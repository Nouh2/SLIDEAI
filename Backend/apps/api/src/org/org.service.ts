import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { CreateOrgDto } from './dto/create-org.dto.js';
import { AddMemberDto, OrgRole } from './dto/add-member.dto.js';
import { ulid } from 'ulid';

@Injectable()
export class OrgService {
    constructor(private prisma: PrismaService) { }

    async createOrg(userId: string, createOrgDto: CreateOrgDto) {
        // Generate a unique ID for the org
        const orgId = `org_${ulid()}`;

        // Create the organization and add the creator as owner in a transaction
        const result = await this.prisma.$transaction(async (prisma) => {
            const org = await prisma.org.create({
                data: {
                    id: orgId,
                    name: createOrgDto.name,
                },
            });

            await prisma.membership.create({
                data: {
                    id: `mem_${ulid()}`,
                    userId: userId,
                    orgId: org.id,
                    role: 'owner',
                },
            });

            return org;
        });

        return result;
    }

    async getUserOrgs(userId: string) {
        const memberships = await this.prisma.membership.findMany({
            where: { userId },
            include: {
                Org: true,
            },
        });

        return memberships.map((m) => ({
            ...m.Org,
            role: m.role,
            createdAt: m.createdAt,
        }));
    }

    async getOrgMembers(orgId: string, userId: string) {
        // Verify user is a member of the org
        await this.checkMembership(orgId, userId);

        const memberships = await this.prisma.membership.findMany({
            where: { orgId },
            include: {
                User: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        // Map User to user for frontend compatibility
        return memberships.map((m) => ({
            id: m.id,
            userId: m.userId,
            role: m.role,
            createdAt: m.createdAt,
            user: m.User,
        }));
    }

    async addMember(orgId: string, requesterId: string, addMemberDto: AddMemberDto) {
        // Verify requester is admin or owner
        const membership = await this.checkMembership(orgId, requesterId);
        if (membership.role !== 'owner' && membership.role !== 'admin') {
            throw new ForbiddenException('Only admins or owners can add members');
        }

        // Resolve email to userId using local User table
        const user = await this.prisma.user.findUnique({
            where: { email: addMemberDto.email },
        });

        if (!user) {
            throw new NotFoundException(`User with email ${addMemberDto.email} not found.`);
        }

        // Check if already a member
        const existingMembership = await this.prisma.membership.findFirst({
            where: {
                orgId,
                userId: user.id,
            },
        });

        if (existingMembership) {
            throw new BadRequestException('User is already a member of this organization');
        }

        // Create membership
        await this.prisma.membership.create({
            data: {
                id: `mem_${ulid()}`,
                userId: user.id,
                orgId: orgId,
                role: addMemberDto.role || 'member',
            },
        });

        return { success: true };
    }

    async removeMember(orgId: string, requesterId: string, userIdToRemove: string) {
        const requesterMembership = await this.checkMembership(orgId, requesterId);

        if (requesterMembership.role !== 'owner' && requesterMembership.role !== 'admin') {
            throw new ForbiddenException('Only admins or owners can remove members');
        }

        if (requesterId === userIdToRemove) {
            throw new BadRequestException('Cannot remove yourself. Leave the organization instead.');
        }

        // Check if target user is in the org
        const targetMembership = await this.prisma.membership.findFirst({
            where: { orgId, userId: userIdToRemove }
        });

        if (!targetMembership) {
            throw new NotFoundException('User is not a member of this organization');
        }

        // Prevent removing owner if you are just an admin
        if (targetMembership.role === 'owner' && requesterMembership.role !== 'owner') {
            throw new ForbiddenException('Admins cannot remove the owner');
        }

        await this.prisma.membership.delete({
            where: { id: targetMembership.id }
        });

        return { success: true };
    }

    private async checkMembership(orgId: string, userId: string) {
        const membership = await this.prisma.membership.findFirst({
            where: {
                orgId,
                userId,
            },
        });

        if (!membership) {
            throw new ForbiddenException('User is not a member of this organization');
        }

        return membership;
    }
}
