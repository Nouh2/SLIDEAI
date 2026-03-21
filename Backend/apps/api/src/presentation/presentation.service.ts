// apps/api/src/presentation/presentation.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { QueueService } from '../queues/queue.service.js';
import { randomBytes } from 'crypto';
import { ulid } from 'ulid';
import { SupabaseMirrorService } from '../supabase-mirror/supabase-mirror.service.js';

@Injectable()
export class PresentationService {
    constructor(
        private prisma: PrismaService,
        private subscriptionService: SubscriptionService,
        private queueService: QueueService,
        private supabaseMirrorService: SupabaseMirrorService,
    ) { }

    /**
     * Get all presentations accessible to the user (owned + shared + viewOnly)
     * Filtered by organization context
     */
    async findAllForUser(userId: string, orgId: string | null) {
        if (!orgId) {
            await this.supabaseMirrorService.syncPresentations(userId);
        }

        if (orgId) {
            // Organization Context: Return all presentations belonging to the organization
            // Assuming all org members can see all org presentations for now
            // Or typically, we might still want 'owned' vs 'shared' within the org?
            // For MVP Team Workspace, usually it's a shared drive.
            // Let's return all org presentations as "owned" or just a flat list?
            // The frontend expects { owned, shared, viewOnly }.
            // We can put them in 'owned' or 'shared' depending on creator.

            const orgPresentations = await this.prisma.presentations.findMany({
                where: { orgId: orgId },
                orderBy: { created_at: 'desc' },
                include: { Org: true } // Include org info if needed
            });

            // Split into owned (created by me) and shared (created by others in org)
            const owned = orgPresentations.filter(p => p.user_id === userId);
            const shared = orgPresentations.filter(p => p.user_id !== userId);

            return { owned, shared, viewOnly: [] }; // ViewOnly might be relevant if shared explicitly? Keeping simple for now.
        } else {
            // Personal Context: Only presentations with NO orgId
            const [owned, shared, viewOnly] = await Promise.all([
                this.prisma.presentations.findMany({
                    where: { user_id: userId, orgId: null },
                    orderBy: { created_at: 'desc' },
                }),
                this.prisma.presentations.findMany({
                    where: { shared_with_user_ids: { has: userId }, orgId: null },
                    orderBy: { created_at: 'desc' },
                }),
                this.prisma.presentations.findMany({
                    where: { view_only_user_ids: { has: userId }, orgId: null },
                    orderBy: { created_at: 'desc' },
                }),
            ]);

            return { owned, shared, viewOnly };
        }
    }

    /**
     * Get a single presentation if user has access
     * Returns showWatermark: true if the OWNER is on a Free plan (no 'no_watermark' feature)
     */
    async findOne(id: string, userId: string, orgId: string | null = null) {
        let presentation = await this.prisma.presentations.findUnique({
            where: { id },
        });
        if (!presentation && !orgId) {
            await this.supabaseMirrorService.syncPresentations(userId);
            presentation = await this.prisma.presentations.findUnique({
                where: { id },
            });
        }

        if (!presentation) {
            throw new NotFoundException('Présentation introuvable');
        }

        // Validate Organization Context
        if (orgId) {
            if (presentation.orgId !== orgId) {
                // If I'm in Org A, I shouldn't see Personal or Org B presentations
                throw new NotFoundException('Présentation introuvable dans cette organisation');
            }
            // In Org Context, access is granted if you are in the org (validated by guard).
            // We might want to check specific perms later, but for now, org membership is enough.
        } else {
            if (presentation.orgId) {
                // If I'm in Personal mode, I shouldn't see Org presentations
                throw new NotFoundException('Présentation introuvable (Ceci est une présentation d\'équipe)');
            }
            // Personal Context Access Check
            const isOwner = presentation.user_id === userId;
            const hasEditAccess = presentation.shared_with_user_ids.includes(userId);
            const hasViewAccess = presentation.view_only_user_ids.includes(userId);

            if (!isOwner && !hasEditAccess && !hasViewAccess) {
                throw new ForbiddenException('Accès refusé à cette présentation');
            }
        }

        // Check if owner has 'no_watermark' feature (starter, pro, business)
        // Note: For Org, we should check Org subscription? Or Owner's?
        // Usually Org has its own subscription. For now, check owner's (who created it) or maybe the user calling?
        // Let's stick to owner for simplicity for now.
        const ownerHasNoWatermark = await this.subscriptionService.hasFeature(presentation.user_id, 'no_watermark');

        return {
            ...presentation,
            showWatermark: !ownerHasNoWatermark,
        };
    }

    /**
     * Update a presentation if user has access
     */
    async update(id: string, userId: string, data: { slides?: any; title?: string; status?: string; fontConfig?: any }, orgId: string | null = null) {
        // First, verify access
        await this.findOne(id, userId, orgId);

        let slidesPayload = data.slides;
        if (slidesPayload && data.fontConfig) {
            // Ensure fontConfig is saved within the slides JSON object
            if (Array.isArray(slidesPayload)) {
                slidesPayload = { slides: slidesPayload, fontConfig: data.fontConfig };
            } else if (typeof slidesPayload === 'object') {
                slidesPayload = { ...slidesPayload, fontConfig: data.fontConfig };
            }
        }

        return this.prisma.presentations.update({
            where: { id },
            data: {
                ...(slidesPayload !== undefined && { slides: slidesPayload }),
                ...(data.title !== undefined && { title: data.title }),
                ...(data.status !== undefined && { status: data.status }),
            },
        });
    }

    /**
     * Generate a share link for a presentation
     * Requires: user is owner AND has 'public_link' feature (starter, pro, business)
     * @param mode - 'edit' for collaborative access, 'view' for read-only access
     */
    async generateShareLink(id: string, userId: string, userEmail?: string, mode: 'edit' | 'view' = 'edit') {
        const presentation = await this.prisma.presentations.findUnique({
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
            let token = presentation.view_only_token;
            if (!token) {
                token = randomBytes(16).toString('hex');
                await this.prisma.presentations.update({
                    where: { id },
                    data: { view_only_token: token },
                });
            }
            return { token, mode: 'view' };
        } else {
            let token = presentation.share_token;
            if (!token) {
                token = randomBytes(16).toString('hex');
                await this.prisma.presentations.update({
                    where: { id },
                    data: { share_token: token },
                });
            }
            return { token, mode: 'edit' };
        }
    }

    /**
     * Join a presentation via share token
     */
    async joinByToken(token: string, userId: string) {
        const presentation = await this.prisma.presentations.findUnique({
            where: { share_token: token },
        });

        if (!presentation) {
            throw new NotFoundException('Lien de partage invalide ou expiré');
        }

        // Check if already owner or already shared
        if (presentation.user_id === userId) {
            // Already owner, just return it
            return presentation;
        }

        if (presentation.shared_with_user_ids.includes(userId)) {
            // Already has access
            return presentation;
        }

        // Add user to shared list
        const updatedPresentation = await this.prisma.presentations.update({
            where: { id: presentation.id },
            data: {
                shared_with_user_ids: {
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
        const presentation = await this.prisma.presentations.findUnique({
            where: { view_only_token: token },
        });

        if (!presentation) {
            throw new NotFoundException('Lien de partage invalide ou expiré');
        }

        // Check if already owner
        if (presentation.user_id === userId) {
            return presentation;
        }

        // Check if already has view-only access
        if (presentation.view_only_user_ids.includes(userId)) {
            return presentation;
        }

        // Add user to view-only list
        const updatedPresentation = await this.prisma.presentations.update({
            where: { id: presentation.id },
            data: {
                view_only_user_ids: {
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
        options: { prompt?: string; mode?: 'visual' | 'detailed' | 'chart'; tone?: string; command?: string },
        orgId: string | null = null
    ) {
        // Verify access
        const presentation = await this.findOne(presentationId, userId, orgId);

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
        await this.prisma.presentations.update({
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
            tone: options.tone,
            command: options.command,
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
        prompt: string,
        orgId: string | null = null
    ) {
        // Verify access
        const presentation = await this.findOne(presentationId, userId, orgId);

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
        await this.prisma.presentations.update({
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
    /**
     * Modify the color palette of a presentation with AI
     */
    async modifyColorPalette(
        presentationId: string,
        userId: string,
        prompt: string,
        orgId: string | null = null
    ) {
        // Verify access
        const presentation = await this.findOne(presentationId, userId, orgId);

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
