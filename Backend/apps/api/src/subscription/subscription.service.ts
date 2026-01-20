// apps/api/src/subscription/subscription.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

// === Plan Limits Configuration ===
// === Plan Limits Configuration ===
const PLAN_LIMITS: Record<string, {
    creditsPerMonth: number;
    features: string[];
    limits: {
        pdfPages: number;
        maxProjects: number;
        aiAddPerPresentation: number;
        aiWandPerPresentation: number;
    }
}> = {
    free: {
        creditsPerMonth: 2,
        features: ['watermark'],
        limits: {
            pdfPages: 10,
            maxProjects: 3,
            aiAddPerPresentation: 2,
            aiWandPerPresentation: 3,
        }
    },
    starter: {
        creditsPerMonth: 15,
        features: ['web_viewer', 'public_link', 'no_watermark', 'export_pdf'],
        limits: {
            pdfPages: 50,
            maxProjects: 20,
            aiAddPerPresentation: 5,
            aiWandPerPresentation: -1,
        }
    },
    pro: {
        creditsPerMonth: -1, // Unlimited
        features: ['web_viewer', 'public_link', 'no_watermark', 'brand_kit', 'ai_priority', 'export_beta', 'export_pdf', 'support_priority'],
        limits: {
            pdfPages: 200,
            maxProjects: -1,
            aiAddPerPresentation: -1,
            aiWandPerPresentation: -1,
        }
    },
    business: {
        creditsPerMonth: -1, // Unlimited
        features: ['web_viewer', 'public_link', 'no_watermark', 'brand_kit', 'ai_priority', 'export_beta', 'team_workspace', 'sso', 'analytics', 'export_pdf'],
        limits: {
            pdfPages: 500,
            maxProjects: -1,
            aiAddPerPresentation: -1,
            aiWandPerPresentation: -1,
        }
    },
};

// === Credit Pack Configuration (one-time purchases) ===
const CREDIT_PACKS: Record<string, number> = {
    'pack_decouverte': 5,
    'pack_power': 15,
};

@Injectable()
export class SubscriptionService {
    constructor(private prisma: PrismaService) { }

    /**
     * Récupère l'abonnement d'un utilisateur.
     * Si l'utilisateur n'a pas d'abonnement, en crée un gratuit.
     */
    async getOrCreateSubscription(userId: string, userEmail?: string) {
        let subscription = await this.prisma.subscription.findUnique({
            where: { userId },
        });

        if (!subscription) {
            // First, ensure the user exists in the User table (for foreign key constraint)
            await this.prisma.user.upsert({
                where: { id: userId },
                update: {}, // No update needed if exists
                create: {
                    id: userId,
                    email: userEmail || `${userId}@placeholder.local`,
                },
            });

            // Now create a free subscription for the new user
            const now = new Date();
            const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1er du mois prochain

            subscription = await this.prisma.subscription.create({
                data: {
                    userId,
                    plan: 'free',
                    status: 'active',
                    creditsRemaining: PLAN_LIMITS.free.creditsPerMonth,
                    creditsResetAt: resetAt,
                },
            });
        }

        return {
            ...subscription,
            limits: PLAN_LIMITS[subscription.plan] || PLAN_LIMITS.free,
        };
    }

    /**
     * Retrieves the Stripe Subscription ID for cancellation.
     * Throws if no active subscription exists.
     */
    async getSubscriptionIdForCancellation(userId: string): Promise<string> {
        const sub = await this.prisma.subscription.findUnique({
            where: { userId },
        });

        if (!sub || !sub.stripeSubscriptionId) {
            throw new ForbiddenException("Aucun abonnement actif trouvé à résilier.");
        }

        return sub.stripeSubscriptionId;
    }

    /**
     * Vérifie si l'utilisateur peut générer une présentation.
     * Retourne true si oui, sinon lance une exception.
     */
    async canGenerate(userId: string, userEmail?: string): Promise<boolean> {
        // DEV MODE BYPASS: Skip credit checks in development
        if (process.env.NODE_ENV === 'development') {
            console.log('[Subscription] DEV MODE: Skipping credit check');
            return true;
        }

        const sub = await this.getOrCreateSubscription(userId, userEmail);
        const limits = PLAN_LIMITS[sub.plan] || PLAN_LIMITS.free;

        // Unlimited pour pro/business
        if (limits.creditsPerMonth === -1) {
            return true;
        }

        // Vérifier si les crédits doivent être resetés
        if (sub.creditsResetAt && new Date() >= sub.creditsResetAt) {
            await this.resetCredits(userId, sub.plan);
            return true; // Après reset, l'utilisateur a des crédits
        }

        if (sub.creditsRemaining <= 0) {
            throw new ForbiddenException(
                `Vous avez atteint votre limite de ${limits.creditsPerMonth} génération(s) ce mois-ci. Passez à un plan supérieur pour continuer.`
            );
        }

        return true;
    }

    /**
     * Consomme un crédit après une génération réussie.
     */
    async consumeCredit(userId: string, userEmail?: string): Promise<void> {
        const sub = await this.getOrCreateSubscription(userId, userEmail);
        const limits = PLAN_LIMITS[sub.plan] || PLAN_LIMITS.free;

        // Ne pas décrémenter pour les plans illimités
        if (limits.creditsPerMonth === -1) {
            return;
        }

        await this.prisma.subscription.update({
            where: { userId },
            data: {
                creditsRemaining: { decrement: 1 },
            },
        });
    }

    /**
     * Réinitialise les crédits mensuels.
     */
    private async resetCredits(userId: string, plan: string): Promise<void> {
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        const now = new Date();
        const nextResetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        await this.prisma.subscription.update({
            where: { userId },
            data: {
                creditsRemaining: limits.creditsPerMonth,
                creditsResetAt: nextResetAt,
            },
        });
    }

    /**
     * Vérifie si l'utilisateur a accès à une fonctionnalité spécifique.
     */
    async hasFeature(userId: string, feature: string): Promise<boolean> {
        const sub = await this.getOrCreateSubscription(userId);
        const limits = PLAN_LIMITS[sub.plan] || PLAN_LIMITS.free;
        return limits.features.includes(feature);
    }

    /**
     * Retourne les limites d'un plan.
     */
    getPlanLimits(plan: string) {
        return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    }

    /**
     * Gère les événements reçus de Stripe.
     */
    async handleStripeEvent(event: any) {
        console.log(`[Stripe Webhook] Handling event: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.client_reference_id || session.metadata?.userId;
                const stripeCustomerId = session.customer;
                const stripeSubscriptionId = session.subscription;

                if (!userId) {
                    console.error('[Stripe Webhook] No userId found in session', session.id);
                    return;
                }

                // Ensure user exists (Fix for potential FK constraint error)
                await this.prisma.user.upsert({
                    where: { id: userId },
                    update: {},
                    create: { id: userId, email: session.customer_email || `${userId}@placeholder.local` }
                });

                // === CREDIT PACK PURCHASE (one-time payment, no subscription) ===
                if (!stripeSubscriptionId && session.metadata?.packType) {
                    const packType = session.metadata.packType;
                    const creditsToAdd = CREDIT_PACKS[packType] || 0;

                    if (creditsToAdd > 0) {
                        // Make sure user has a subscription record to add credits to
                        await this.getOrCreateSubscription(userId, session.customer_email);

                        await this.prisma.subscription.update({
                            where: { userId },
                            data: {
                                creditsRemaining: { increment: creditsToAdd },
                            },
                        });
                        console.log(`[Stripe Webhook] Added ${creditsToAdd} credits for pack: ${packType} to user: ${userId}`);
                    } else {
                        console.warn(`[Stripe Webhook] Unknown packType: ${packType}`);
                    }
                    break;
                }

                // === SUBSCRIPTION PURCHASE ===
                const plan = session.metadata?.plan || 'starter';

                await this.prisma.subscription.upsert({
                    where: { userId },
                    update: {
                        stripeCustomerId,
                        stripeSubscriptionId,
                        plan: plan,
                        status: 'active',
                        creditsRemaining: PLAN_LIMITS[plan]?.creditsPerMonth || 0,
                    },
                    create: {
                        userId,
                        stripeCustomerId,
                        stripeSubscriptionId,
                        plan: plan,
                        status: 'active',
                        creditsRemaining: PLAN_LIMITS[plan]?.creditsPerMonth || 0,
                    },
                });
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const userId = await this.getUserIdByStripeCustomerId(subscription.customer);

                if (userId) {
                    await this.prisma.subscription.update({
                        where: { userId },
                        data: {
                            status: subscription.status,
                            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        },
                    });
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const userId = await this.getUserIdByStripeCustomerId(subscription.customer);

                if (userId) {
                    await this.prisma.subscription.update({
                        where: { userId },
                        data: {
                            plan: 'free',
                            status: 'canceled',
                            stripeSubscriptionId: null,
                            creditsRemaining: PLAN_LIMITS.free.creditsPerMonth,
                        },
                    });
                }
                break;
            }
        }
    }

    async getUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
        const sub = await this.prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
        });
        return sub?.userId || null;
    }

    /**
     * Vérifie si l'utilisateur peut créer un nouveau projet (limite de stockage).
     */
    async checkProjectLimit(userId: string): Promise<boolean> {
        const sub = await this.getOrCreateSubscription(userId);
        const limits = PLAN_LIMITS[sub.plan]?.limits || PLAN_LIMITS.free.limits;

        if (limits.maxProjects === -1) return true;

        // Note: Presentation = Project in this context roughly, but wait, schema has Project and Presentation.
        // "Stockage (Dashboard) 3 projets max".
        // The dashboard lists 'presentations', so we should count Presentations.
        // But there is also a 'Project' model. The user prompt says "Stockage (Dashboard), 3 projets max".
        // Dashboard.tsx fetches `api.getPresentations`. So it's likely Presentations.
        // However, let's look at schema. Presentation model exists. Project model exists.
        // Dashboard shows Presentations. So I should count Presentations.
        // Let's count Presentations as "Projects" for the user facing term
        const presentationCount = await this.prisma.presentation.count({
            where: { user_id: userId },
        });

        if (presentationCount >= limits.maxProjects) {
            throw new ForbiddenException(
                `Limite de plan atteinte : vous ne pouvez avoir que ${limits.maxProjects} présentations actives. Supprimez-en une ou passez au plan supérieur.`
            );
        }

        return true;
    }

    /**
     * Vérifie la limite de pages pour l'import PDF.
     */
    async checkPdfPageLimit(userId: string, pageCount: number): Promise<boolean> {
        const sub = await this.getOrCreateSubscription(userId);
        const limits = PLAN_LIMITS[sub.plan]?.limits || PLAN_LIMITS.free.limits;

        if (limits.pdfPages === -1) return true;

        if (pageCount > limits.pdfPages) {
            throw new ForbiddenException(
                `Ce PDF dépasse la limite de ${limits.pdfPages} pages de votre plan. Passez au plan supérieur pour importer des documents plus longs.`
            );
        }

        return true;
    }

    /**
     * Vérifie la limite d'ajout de slides par IA pour une présentation.
     */
    async checkAiAddLimit(userId: string, currentUsage: number): Promise<boolean> {
        const sub = await this.getOrCreateSubscription(userId);
        const limits = PLAN_LIMITS[sub.plan]?.limits || PLAN_LIMITS.free.limits;

        if (limits.aiAddPerPresentation === -1) return true;

        if (currentUsage >= limits.aiAddPerPresentation) {
            throw new ForbiddenException(
                `Limite atteinte : vous ne pouvez ajouter que ${limits.aiAddPerPresentation} slides par IA par présentation avec ce plan.`
            );
        }

        return true;
    }

    /**
     * Vérifie la limite de régénération (Wand) par présentation.
     */
    async checkAiWandLimit(userId: string, currentUsage: number): Promise<boolean> {
        const sub = await this.getOrCreateSubscription(userId);
        const limits = PLAN_LIMITS[sub.plan]?.limits || PLAN_LIMITS.free.limits;

        if (limits.aiWandPerPresentation === -1) return true;

        if (currentUsage >= limits.aiWandPerPresentation) {
            throw new ForbiddenException(
                `Limite atteinte : vous ne pouvez régénérer que ${limits.aiWandPerPresentation} fois par présentation avec ce plan.`
            );
        }

        return true;
    }
}
