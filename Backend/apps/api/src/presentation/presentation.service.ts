// apps/api/src/presentation/presentation.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { randomBytes } from 'crypto';

@Injectable()
export class PresentationService {
    constructor(
        private prisma: PrismaService,
        private subscriptionService: SubscriptionService,
    ) { }

    /**
     * Get all presentations accessible to the user (owned + shared)
     */
    async findAllForUser(userId: string) {
        const [owned, shared] = await Promise.all([
            this.prisma.presentation.findMany({
                where: { user_id: userId },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.presentation.findMany({
                where: { sharedWithUserIds: { has: userId } },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return { owned, shared };
    }

    /**
     * Get a single presentation if user has access
     */
    async findOne(id: string, userId: string) {
        const presentation = await this.prisma.presentation.findUnique({
            where: { id },
        });

        if (!presentation) {
            throw new NotFoundException('Présentation introuvable');
        }

        // Check access: owner or shared
        if (presentation.user_id !== userId && !presentation.sharedWithUserIds.includes(userId)) {
            throw new ForbiddenException('Accès refusé à cette présentation');
        }

        return presentation;
    }

    /**
     * Update a presentation if user has access
     */
    async update(id: string, userId: string, data: { slides?: any; title?: string }) {
        // First, verify access
        await this.findOne(id, userId);

        return this.prisma.presentation.update({
            where: { id },
            data: {
                ...(data.slides !== undefined && { slides: data.slides }),
                ...(data.title !== undefined && { title: data.title }),
            },
        });
    }

    /**
     * Generate a share link for a presentation
     * Requires: user is owner AND has 'public_link' feature (starter, pro, business)
     */
    async generateShareLink(id: string, userId: string, userEmail?: string) {
        const presentation = await this.prisma.presentation.findUnique({
            where: { id },
        });

        if (!presentation) {
            throw new NotFoundException('Présentation introuvable');
        }

        // Only owner can share
        if (presentation.user_id !== userId) {
            throw new ForbiddenException('Seul le propriétaire peut partager cette présentation');
        }

        // Check subscription feature
        const hasFeature = await this.subscriptionService.hasFeature(userId, 'public_link');
        if (!hasFeature) {
            throw new ForbiddenException(
                'Le partage de lien est réservé aux abonnements Starter, Pro et Business. Mettez à niveau votre compte pour débloquer cette fonctionnalité.',
            );
        }

        // Generate a token if not already exists
        let token = presentation.shareToken;
        if (!token) {
            token = randomBytes(16).toString('hex'); // 32-char hex string
            await this.prisma.presentation.update({
                where: { id },
                data: { shareToken: token },
            });
        }

        return { token };
    }

    /**
     * Join a presentation via share token
     */
    async joinByToken(token: string, userId: string) {
        const presentation = await this.prisma.presentation.findUnique({
            where: { shareToken: token },
        });

        if (!presentation) {
            throw new NotFoundException('Lien de partage invalide ou expiré');
        }

        // Check if already owner or already shared
        if (presentation.user_id === userId) {
            // Already owner, just return it
            return presentation;
        }

        if (presentation.sharedWithUserIds.includes(userId)) {
            // Already has access
            return presentation;
        }

        // Add user to shared list
        const updatedPresentation = await this.prisma.presentation.update({
            where: { id: presentation.id },
            data: {
                sharedWithUserIds: {
                    push: userId,
                },
            },
        });

        return updatedPresentation;
    }
}
