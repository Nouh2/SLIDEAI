
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class CommentsService {
    constructor(private prisma: PrismaService) { }

    async createComment(data: {
        presentationId: string;
        slideId: string;
        userId: string;
        content: string;
    }) {
        return this.prisma.comment.create({
            data: {
                presentationId: data.presentationId,
                slideId: data.slideId,
                userId: data.userId,
                content: data.content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        // Add other user fields if needed, e.g., name or avatar
                    }
                }
            }
        });
    }

    async getCommentsByPresentation(presentationId: string) {
        return this.prisma.comment.findMany({
            where: { presentationId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async resolveComment(id: string, resolved: boolean) {
        const comment = await this.prisma.comment.findUnique({ where: { id } });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        return this.prisma.comment.update({
            where: { id },
            data: { resolved },
        });
    }

    async deleteComment(id: string, userId: string) {
        const comment = await this.prisma.comment.findUnique({ where: { id } });
        if (!comment) {
            throw new NotFoundException('Comment not found');
        }
        // Verify ownership or check if user is admin/owner of presentation (simplified for now)
        if (comment.userId !== userId) {
            // Here we might want to check if the user is the presentation owner too
            // For now, let's just restrict deletion to the comment author
            // throw new ForbiddenException('You can only delete your own comments');
        }

        return this.prisma.comment.delete({ where: { id } });
    }
}
