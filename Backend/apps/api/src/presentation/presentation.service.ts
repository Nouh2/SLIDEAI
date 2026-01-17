// apps/api/src/presentation/presentation.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { QueueService } from '../queues/queue.service.js';
import { randomBytes } from 'crypto';
import { ulid } from 'ulid';

@Injectable()
export class PresentationService {
    constructor(
        private prisma: PrismaService,
        private subscriptionService: SubscriptionService,
        private queueService: QueueService,
    ) { }

    /**
     * Get all presentations accessible to the user (owned + shared + viewOnly)
     */
    async findAllForUser(userId: string) {
        const [owned, shared, viewOnly] = await Promise.all([
            this.prisma.presentation.findMany({
                where: { user_id: userId },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.presentation.findMany({
                where: { sharedWithUserIds: { has: userId } },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.presentation.findMany({
                where: { viewOnlyUserIds: { has: userId } },
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return { owned, shared, viewOnly };
    }

    /**
     * Get a single presentation if user has access
     * Returns showWatermark: true if the OWNER is on a Free plan (no 'no_watermark' feature)
     */
    async findOne(id: string, userId: string) {
        const presentation = await this.prisma.presentation.findUnique({
            where: { id },
        });

        if (!presentation) {
            throw new NotFoundException('Présentation introuvable');
        }

        // Check access: owner, shared (edit), or view-only
        const isOwner = presentation.user_id === userId;
        const hasEditAccess = presentation.sharedWithUserIds.includes(userId);
        const hasViewAccess = presentation.viewOnlyUserIds.includes(userId);

        if (!isOwner && !hasEditAccess && !hasViewAccess) {
            throw new ForbiddenException('Accès refusé à cette présentation');
        }

        // Check if owner has 'no_watermark' feature (starter, pro, business)
        const ownerHasNoWatermark = await this.subscriptionService.hasFeature(presentation.user_id, 'no_watermark');

        return {
            ...presentation,
            showWatermark: !ownerHasNoWatermark,
        };
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
     * @param mode - 'edit' for collaborative access, 'view' for read-only access
     */
    async generateShareLink(id: string, userId: string, userEmail?: string, mode: 'edit' | 'view' = 'edit') {
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

        // Generate the appropriate token based on mode
        if (mode === 'view') {
            let token = presentation.viewOnlyToken;
            if (!token) {
                token = randomBytes(16).toString('hex');
                await this.prisma.presentation.update({
                    where: { id },
                    data: { viewOnlyToken: token },
                });
            }
            return { token, mode: 'view' };
        } else {
            let token = presentation.shareToken;
            if (!token) {
                token = randomBytes(16).toString('hex');
                await this.prisma.presentation.update({
                    where: { id },
                    data: { shareToken: token },
                });
            }
            return { token, mode: 'edit' };
        }
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

    /**
     * Join a presentation via view-only token (read-only access)
     */
    async joinViewOnly(token: string, userId: string) {
        const presentation = await this.prisma.presentation.findUnique({
            where: { viewOnlyToken: token },
        });

        if (!presentation) {
            throw new NotFoundException('Lien de partage invalide ou expiré');
        }

        // Check if already owner
        if (presentation.user_id === userId) {
            return presentation;
        }

        // Check if already has view-only access
        if (presentation.viewOnlyUserIds.includes(userId)) {
            return presentation;
        }

        // Add user to view-only list
        const updatedPresentation = await this.prisma.presentation.update({
            where: { id: presentation.id },
            data: {
                viewOnlyUserIds: {
                    push: userId,
                },
            },
        });

        return updatedPresentation;
    }

    /**
     * Regenerate a single slide with AI
     * Requires: user has access to the presentation
     */
    async regenerateSlide(
        presentationId: string,
        slideIndex: number,
        userId: string,
        options: { prompt?: string; mode?: 'visual' | 'detailed' | 'chart' }
    ) {
        // Verify access
        const presentation = await this.findOne(presentationId, userId);

        // Get the slides data
        const rawSlides = presentation.slides as any;
        const isArray = Array.isArray(rawSlides);
        const deckData = isArray ? { slides: rawSlides } : rawSlides;
        const slidesArray = isArray ? rawSlides : (rawSlides?.slides || []);

        if (slideIndex < 0 || slideIndex >= slidesArray.length) {
            throw new NotFoundException(`Slide ${slideIndex} introuvable`);
        }

        // === ENFORCE LIMITS ===
        const meta = deckData.meta || {};
        const currentUsage = meta.aiRegeneratedCount || 0;
        await this.subscriptionService.checkAiWandLimit(userId, currentUsage);

        // Increment usage immediately
        const newMeta = { ...meta, aiRegeneratedCount: currentUsage + 1 };
        const newDeckData = { ...deckData, meta: newMeta };

        // Update DB with usage count
        await this.prisma.presentation.update({
            where: { id: presentationId },
            data: { slides: newDeckData },
        });

        // Build context for the worker
        const context = {
            title: deckData.title || presentation.title,
            subtitle: deckData.subtitle,
            theme: deckData.theme || presentation.theme,
            colorPalette: deckData.colorPalette,
            themeConfig: deckData.themeConfig,
            slides: slidesArray,
        };

        const traceId = ulid();

        // Enqueue the regeneration job
        await this.queueService.addRegenerateSlide({
            traceId,
            presentationId,
            slideIndex,
            prompt: options.prompt,
            mode: options.mode,
            context,
            user: { sub: userId },
        });

        return { traceId };
    }

    /**
     * Add a new slide with AI
     * Requires: user has access to the presentation
     */
    async addSlide(
        presentationId: string,
        userId: string,
        prompt: string
    ) {
        // Verify access
        const presentation = await this.findOne(presentationId, userId);

        // Get the slides data
        const rawSlides = presentation.slides as any;
        const isArray = Array.isArray(rawSlides);
        const deckData = isArray ? { slides: rawSlides } : rawSlides;
        const slidesArray = isArray ? rawSlides : (rawSlides?.slides || []);

        // === ENFORCE LIMITS ===
        const meta = deckData.meta || {};
        const currentUsage = meta.aiAddedCount || 0;
        await this.subscriptionService.checkAiAddLimit(userId, currentUsage);

        // Increment usage immediately
        const newMeta = { ...meta, aiAddedCount: currentUsage + 1 };
        const newDeckData = { ...deckData, meta: newMeta };

        // Update DB with usage count
        await this.prisma.presentation.update({
            where: { id: presentationId },
            data: { slides: newDeckData },
        });

        // Build context for the worker
        const context = {
            title: deckData.title || presentation.title,
            subtitle: deckData.subtitle,
            theme: deckData.theme || presentation.theme,
            colorPalette: deckData.colorPalette,
            themeConfig: deckData.themeConfig,
            slides: slidesArray,
        };

        const traceId = ulid();

        // Enqueue the add slide job
        await this.queueService.addAddSlide({
            traceId,
            presentationId,
            prompt,
            context,
            user: { sub: userId },
        });

        return { traceId };
    }

    /**
     * Modify the color palette of a presentation with AI
     */
    async modifyColorPalette(
        presentationId: string,
        userId: string,
        prompt: string
    ) {
        // Verify access
        const presentation = await this.findOne(presentationId, userId);

        // Get current palette and theme
        const rawSlides = presentation.slides as any;
        const isArray = Array.isArray(rawSlides);
        const deckData = isArray ? {} : rawSlides;
        const currentPalette = deckData.colorPalette || {};
        const currentTheme = deckData.theme || presentation.theme || 'startup-pitch';

        const traceId = ulid();

        // Enqueue the modification job
        await this.queueService.addModifyColorPalette({
            traceId,
            presentationId,
            prompt,
            currentPalette,
            currentTheme,
            presentationTitle: presentation.title,
            user: { sub: userId },
        });

        return { traceId };
    }
}
