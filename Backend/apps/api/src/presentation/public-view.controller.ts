// apps/api/src/presentation/public-view.controller.ts
import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';

/**
 * Public controller for view-only presentation access.
 * These endpoints do NOT require authentication.
 */
@Controller('/v1/public')
export class PublicViewController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly subscriptionService: SubscriptionService,
    ) { }

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

        const showWatermark = !(await this.subscriptionService.hasFeature(presentation.user_id, 'no_watermark'));

        return {
            id: presentation.id,
            title: presentation.title,
            slides: presentation.slides,
            theme: presentation.theme,
            showWatermark,
        };
    }
}
