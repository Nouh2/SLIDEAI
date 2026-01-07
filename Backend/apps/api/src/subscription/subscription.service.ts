// apps/api/src/subscription/subscription.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

// === Plan Limits Configuration ===
const PLAN_LIMITS: Record<string, { creditsPerMonth: number; features: string[] }> = {
    free: {
        creditsPerMonth: 1,
        features: ['web_viewer', 'pdf_import_5_pages', 'watermark'],
    },
    starter: {
        creditsPerMonth: 15,
        features: ['web_viewer', 'pdf_import_full', 'public_link', 'no_watermark'],
    },
    pro: {
        creditsPerMonth: -1, // Unlimited
        features: ['web_viewer', 'pdf_import_full', 'public_link', 'no_watermark', 'brand_kit', 'ai_priority', 'export_beta'],
    },
    business: {
        creditsPerMonth: -1, // Unlimited
        features: ['web_viewer', 'pdf_import_full', 'public_link', 'no_watermark', 'brand_kit', 'ai_priority', 'export_beta', 'team_workspace', 'sso', 'analytics'],
    },
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

                // Récupérer le plan correspondant au prix Stripe
                // Pour l'instant on fait simple ou on stocke le plan dans la metadata
                const plan = session.metadata?.plan || 'starter';

                // Ensure user exists (Fix for potential FK constraint error)
                await this.prisma.user.upsert({
                    where: { id: userId },
                    update: {},
                    create: { id: userId, email: session.customer_email || `${userId}@placeholder.local` }
                });

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

    private async getUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
        const sub = await this.prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
        });
        return sub?.userId || null;
    }
}
