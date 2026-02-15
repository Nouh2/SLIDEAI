// apps/api/src/presentation/public-view.controller.ts
import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

/**
 * Public controller for view-only presentation access.
 * These endpoints do NOT require authentication.
 */
@Controller('/v1/public')
export class PublicViewController {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * GET /v1/public/view/:token
     * Get a presentation by its view-only token (no auth required)
     */
    @Get('view/:token')
    async getPublicViewPresentation(@Param('token') token: string) {
        const presentation = await this.prisma.presentations.findUnique({
            where: { view_only_token: token },
            select: {
                id: true,
                title: true,
                slides: true,
                theme: true,
                user_id: true,
            },
        });

        if (!presentation) {
            throw new NotFoundException('Presentation not found or link expired');
        }

        // Check if owner has watermark feature (for free users)
        const subscription = await this.prisma.subscription.findFirst({
            where: { userId: presentation.user_id },
            orderBy: { createdAt: 'desc' },
        });

        const features = ((subscription as any)?.features) || [];
        const showWatermark = !features.includes('no_watermark');

        return {
            id: presentation.id,
            title: presentation.title,
            slides: presentation.slides,
            theme: presentation.theme,
            showWatermark,
        };
    }
}
