var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SubscriptionService_1;
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service.js';
import { LifecycleEmailService } from './lifecycle-email.service.js';
import { StripeService } from './stripe.service.js';
import { SupabaseMirrorService } from '../supabase-mirror/supabase-mirror.service.js';
const DAY_MS = 24 * 60 * 60 * 1000;
const PLAN_LIMITS = {
    free: {
        creditsPerMonth: 2,
        features: ['export_pdf'],
        limits: {
            pdfPages: 10,
            maxProjects: 3,
            aiAddPerPresentation: 2,
            aiWandPerPresentation: 3,
        },
    },
    starter: {
        creditsPerMonth: 15,
        features: ['web_viewer', 'public_link', 'no_watermark', 'export_pdf', 'export_pptx'],
        limits: {
            pdfPages: 50,
            maxProjects: 20,
            aiAddPerPresentation: 5,
            aiWandPerPresentation: -1,
        },
    },
    pro: {
        creditsPerMonth: -1,
        features: ['web_viewer', 'public_link', 'no_watermark', 'brand_kit', 'ai_priority', 'export_pdf', 'export_pptx', 'export_editable_pptx', 'support_priority'],
        limits: {
            pdfPages: 200,
            maxProjects: -1,
            aiAddPerPresentation: -1,
            aiWandPerPresentation: -1,
        },
    },
    business: {
        creditsPerMonth: -1,
        features: ['web_viewer', 'public_link', 'no_watermark', 'brand_kit', 'ai_priority', 'export_pdf', 'export_pptx', 'export_editable_pptx', 'support_priority', 'team_workspace'],
        limits: {
            pdfPages: 500,
            maxProjects: -1,
            aiAddPerPresentation: -1,
            aiWandPerPresentation: -1,
        },
    },
};
const CREDIT_PACKS = {
    pack_decouverte: 5,
    pack_power: 15,
};
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    prisma;
    lifecycleEmailService;
    stripeService;
    supabaseMirrorService;
    logger = new Logger(SubscriptionService_1.name);
    constructor(prisma, lifecycleEmailService, stripeService, supabaseMirrorService) {
        this.prisma = prisma;
        this.lifecycleEmailService = lifecycleEmailService;
        this.stripeService = stripeService;
        this.supabaseMirrorService = supabaseMirrorService;
    }
    async getOrCreateSubscription(userId, userEmail) {
        const subscription = await this.getOrCreateSubscriptionRecord(userId, userEmail);
        return this.serializeSubscription(subscription);
    }
    async startTrial(userId, userEmail) {
        const user = await this.ensureLocalUser(userId, userEmail);
        const subscription = await this.getOrCreateSubscriptionRecord(userId, user.email);
        if (!this.canStartTrial(subscription)) {
            throw new ForbiddenException("Votre essai gratuit n'est pas disponible pour ce compte.");
        }
        const trialStartedAt = new Date();
        const trialEndsAt = new Date(trialStartedAt.getTime() + this.getTrialDurationMs());
        const updated = await this.prisma.subscription.update({
            where: { userId },
            data: {
                plan: 'pro',
                status: 'trialing',
                creditsRemaining: PLAN_LIMITS.pro.creditsPerMonth,
                creditsResetAt: null,
                trialStartedAt,
                trialEndsAt,
                trialConsumedAt: trialStartedAt,
                requiresPayment: false,
                updatedAt: new Date(),
            },
        });
        await this.lifecycleEmailService.scheduleTrialLifecycleEmails({
            userId,
            email: user.email,
            trialStartedAt,
            trialEndsAt,
            legacyFree: true,
        });
        return this.serializeSubscription(updated);
    }
    async getSubscriptionIdForCancellation(userId) {
        const sub = await this.prisma.subscription.findUnique({
            where: { userId },
        });
        if (!sub || !sub.stripeSubscriptionId) {
            throw new ForbiddenException("Aucun abonnement actif trouvé à résilier.");
        }
        return sub.stripeSubscriptionId;
    }
    async getStripeCustomerIdForCheckout(userId, userEmail) {
        const sub = await this.getOrCreateSubscriptionRecord(userId, userEmail);
        return sub.stripeCustomerId ?? null;
    }
    async scheduleCancellationEmails(userId, userEmail) {
        const user = await this.ensureLocalUser(userId, userEmail);
        await this.lifecycleEmailService.scheduleCancellationEmails({
            userId,
            email: user.email,
            canceledAt: new Date(),
        });
    }
    async canGenerate(userId, userEmail) {
        if (process.env.NODE_ENV === 'development') {
            this.logger.log('DEV MODE: skipping credit check');
            return true;
        }
        let sub = await this.getOrCreateSubscriptionRecord(userId, userEmail);
        let entitlements = this.resolveEntitlements(sub);
        if (entitlements.accessState === 'trial_expired') {
            throw new ForbiddenException("Votre essai gratuit est terminé. Passez à l'abonnement Pro pour continuer.");
        }
        if (entitlements.limits.creditsPerMonth === -1) {
            return true;
        }
        if (sub.creditsResetAt && new Date() >= sub.creditsResetAt) {
            sub = await this.resetCredits(sub.userId, entitlements.effectivePlan);
            entitlements = this.resolveEntitlements(sub);
        }
        if (sub.creditsRemaining <= 0) {
            throw new ForbiddenException(`Vous avez atteint votre limite de ${entitlements.limits.creditsPerMonth} génération(s). Passez à un plan supérieur pour continuer.`);
        }
        return true;
    }
    async consumeCredit(userId, userEmail) {
        const user = await this.ensureLocalUser(userId, userEmail);
        const sub = await this.getOrCreateSubscriptionRecord(userId, user.email);
        const entitlements = this.resolveEntitlements(sub);
        if (entitlements.accessState === 'trial_expired') {
            return;
        }
        if (entitlements.limits.creditsPerMonth === -1) {
            return;
        }
        const updated = await this.prisma.subscription.update({
            where: { userId },
            data: {
                creditsRemaining: { decrement: 1 },
                updatedAt: new Date(),
            },
        });
        await this.lifecycleEmailService.scheduleInactivityReactivationEmails({
            userId,
            email: user.email,
            activityAt: new Date(),
        });
        if (!updated.legacyFree && updated.plan === 'free') {
            if (updated.creditsRemaining <= 0) {
                await this.lifecycleEmailService.schedulePackBalanceAlert({
                    userId,
                    email: user.email,
                    emailType: 'pack_exhausted',
                    creditsRemaining: updated.creditsRemaining,
                });
            }
            else if (updated.creditsRemaining <= 2) {
                await this.lifecycleEmailService.schedulePackBalanceAlert({
                    userId,
                    email: user.email,
                    emailType: 'pack_low_balance',
                    creditsRemaining: updated.creditsRemaining,
                });
            }
        }
    }
    async hasFeature(userId, feature) {
        const sub = await this.getOrCreateSubscriptionRecord(userId);
        const entitlements = this.resolveEntitlements(sub);
        if (entitlements.accessState === 'trial_expired') {
            return false;
        }
        return entitlements.limits.features.includes(feature);
    }
    async getEntitlements(userId, userEmail) {
        const subscription = await this.getOrCreateSubscriptionRecord(userId, userEmail);
        return this.resolveEntitlements(subscription);
    }
    getPlanLimits(plan) {
        return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
    }
    async handleStripeEvent(event) {
        this.logger.log(`[Stripe Webhook] Handling event: ${event.type}`);
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = session.client_reference_id || session.metadata?.userId;
                const stripeCustomerId = session.customer;
                const stripeSubscriptionId = session.subscription;
                if (!userId) {
                    this.logger.error(`[Stripe Webhook] No userId found in session ${session.id}`);
                    return;
                }
                const user = await this.ensureLocalUser(userId, session.customer_email);
                await this.recordLifecycleEmailConversion(session);
                if (!stripeSubscriptionId && session.metadata?.packType) {
                    await this.handleCreditPackPurchase(userId, user.email, session.metadata.packType);
                    return;
                }
                const plan = session.metadata?.plan || 'starter';
                const now = new Date();
                await this.prisma.subscription.upsert({
                    where: { userId },
                    update: {
                        stripeCustomerId,
                        stripeSubscriptionId,
                        plan,
                        status: 'active',
                        requiresPayment: false,
                        creditsRemaining: PLAN_LIMITS[plan]?.creditsPerMonth ?? 0,
                        creditsResetAt: this.isUnlimitedPlan(plan) ? null : this.buildNextMonthlyResetAt(now),
                        updatedAt: now,
                    },
                    create: {
                        id: randomUUID(),
                        userId,
                        stripeCustomerId,
                        stripeSubscriptionId,
                        plan,
                        status: 'active',
                        creditsRemaining: PLAN_LIMITS[plan]?.creditsPerMonth ?? 0,
                        creditsResetAt: this.isUnlimitedPlan(plan) ? null : this.buildNextMonthlyResetAt(now),
                        updatedAt: now,
                    },
                });
                break;
            }
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                const userId = await this.getUserIdByStripeCustomerId(subscription.customer);
                if (userId) {
                    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
                    const plan = existing?.plan || subscription.metadata?.plan || 'starter';
                    await this.prisma.subscription.update({
                        where: { userId },
                        data: {
                            status: subscription.status,
                            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                            creditsResetAt: this.isUnlimitedPlan(plan)
                                ? null
                                : new Date(subscription.current_period_end * 1000),
                            requiresPayment: false,
                            updatedAt: new Date(),
                        },
                    });
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const userId = await this.getUserIdByStripeCustomerId(subscription.customer);
                if (userId) {
                    const existing = await this.prisma.subscription.findUnique({ where: { userId } });
                    if (!existing) {
                        return;
                    }
                    if (existing.legacyFree) {
                        await this.prisma.subscription.update({
                            where: { userId },
                            data: {
                                plan: 'free',
                                status: 'active',
                                stripeSubscriptionId: null,
                                creditsRemaining: PLAN_LIMITS.free.creditsPerMonth,
                                creditsResetAt: this.buildNextMonthlyResetAt(new Date()),
                                requiresPayment: false,
                                updatedAt: new Date(),
                            },
                        });
                    }
                    else {
                        await this.prisma.subscription.update({
                            where: { userId },
                            data: {
                                status: 'trial_expired',
                                stripeSubscriptionId: null,
                                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                                creditsRemaining: 0,
                                creditsResetAt: null,
                                requiresPayment: true,
                                updatedAt: new Date(),
                            },
                        });
                    }
                }
                break;
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const userId = await this.getUserIdByStripeCustomerId(invoice.customer);
                if (!userId) {
                    return;
                }
                const user = await this.ensureLocalUser(userId, invoice.customer_email);
                await this.lifecycleEmailService.scheduleFailedPaymentEmail({
                    userId,
                    email: user.email,
                    invoiceId: invoice.id,
                    amountDue: invoice.amount_due ?? null,
                    currency: invoice.currency ?? null,
                });
                break;
            }
        }
    }
    async recordLifecycleEmailConversion(session) {
        const emailTrackingId = session.metadata?.email_id;
        if (!emailTrackingId) {
            return;
        }
        const rows = await this.prisma.$queryRaw `
      SELECT "id", "payload"
      FROM "LifecycleEmailLog"
      WHERE "payload"->>'emailTrackingId' = ${emailTrackingId}
      LIMIT 1
    `;
        const row = rows[0];
        if (!row) {
            return;
        }
        const currentPayload = row.payload && typeof row.payload === 'object' ? row.payload : {};
        await this.prisma.lifecycleEmailLog.update({
            where: { id: row.id },
            data: {
                payload: {
                    ...currentPayload,
                    emailConvertedAt: currentPayload.emailConvertedAt || new Date().toISOString(),
                    emailConversion: {
                        checkoutSessionId: session.id,
                        checkoutMode: session.mode,
                        paymentStatus: session.payment_status,
                        plan: session.metadata?.plan || null,
                        packType: session.metadata?.packType || null,
                        amountTotal: session.amount_total ?? null,
                        currency: session.currency ?? null,
                    },
                },
            },
        });
    }
    async getUserIdByStripeCustomerId(customerId) {
        const sub = await this.prisma.subscription.findFirst({
            where: { stripeCustomerId: customerId },
        });
        return sub?.userId || null;
    }
    async checkProjectLimit(userId) {
        const sub = await this.getOrCreateSubscriptionRecord(userId);
        const entitlements = this.ensureWritableAccess(sub);
        if (entitlements.limits.limits.maxProjects === -1) {
            return true;
        }
        const presentationCount = await this.prisma.presentations.count({
            where: { user_id: userId },
        });
        if (presentationCount >= entitlements.limits.limits.maxProjects) {
            throw new ForbiddenException(`Limite de plan atteinte : vous ne pouvez avoir que ${entitlements.limits.limits.maxProjects} présentations actives.`);
        }
        return true;
    }
    async checkPdfPageLimit(userId, pageCount) {
        const sub = await this.getOrCreateSubscriptionRecord(userId);
        const entitlements = this.ensureWritableAccess(sub);
        if (entitlements.limits.limits.pdfPages === -1) {
            return true;
        }
        if (pageCount > entitlements.limits.limits.pdfPages) {
            throw new ForbiddenException(`Ce PDF dépasse la limite de ${entitlements.limits.limits.pdfPages} pages de votre plan.`);
        }
        return true;
    }
    async checkAiAddLimit(userId, currentUsage) {
        const sub = await this.getOrCreateSubscriptionRecord(userId);
        const entitlements = this.ensureWritableAccess(sub);
        if (entitlements.limits.limits.aiAddPerPresentation === -1) {
            return true;
        }
        if (currentUsage >= entitlements.limits.limits.aiAddPerPresentation) {
            throw new ForbiddenException(`Limite atteinte : vous ne pouvez ajouter que ${entitlements.limits.limits.aiAddPerPresentation} slides IA par présentation avec ce plan.`);
        }
        return true;
    }
    async checkAiWandLimit(userId, currentUsage) {
        const sub = await this.getOrCreateSubscriptionRecord(userId);
        const entitlements = this.ensureWritableAccess(sub);
        if (entitlements.limits.limits.aiWandPerPresentation === -1) {
            return true;
        }
        if (currentUsage >= entitlements.limits.limits.aiWandPerPresentation) {
            throw new ForbiddenException(`Limite atteinte : vous ne pouvez régénérer que ${entitlements.limits.limits.aiWandPerPresentation} fois par présentation avec ce plan.`);
        }
        return true;
    }
    async getOrCreateSubscriptionRecord(userId, userEmail) {
        await this.supabaseMirrorService.syncUserAndSubscription(userId, userEmail);
        const user = await this.ensureLocalUser(userId, userEmail);
        let subscription = await this.prisma.subscription.findUnique({
            where: { userId },
        });
        subscription = await this.recoverStripeSubscriptionIfNeeded(user, subscription);
        if (!subscription) {
            subscription = await this.createInitialSubscription(user);
        }
        subscription = await this.repairMisclassifiedTrialSubscription(user, subscription);
        return this.refreshSubscriptionState(subscription);
    }
    async recoverStripeSubscriptionIfNeeded(user, subscription) {
        if (!this.shouldAttemptStripeRecovery(user, subscription)) {
            return subscription;
        }
        try {
            const remoteSubscription = await this.stripeService.findActiveSubscriptionByEmail(user.email);
            if (!remoteSubscription?.plan) {
                return subscription;
            }
            this.logger.log(`Recovered Stripe subscription for ${user.email}: plan=${remoteSubscription.plan}, subscription=${remoteSubscription.subscriptionId}`);
            const now = new Date();
            const nextStatus = remoteSubscription.status === 'trialing' ? 'trialing' : 'active';
            const nextPlan = remoteSubscription.plan;
            if (subscription) {
                return this.prisma.subscription.update({
                    where: { userId: user.id },
                    data: {
                        plan: nextPlan,
                        status: nextStatus,
                        stripeCustomerId: remoteSubscription.customerId,
                        stripeSubscriptionId: remoteSubscription.subscriptionId,
                        currentPeriodEnd: remoteSubscription.currentPeriodEnd,
                        creditsRemaining: PLAN_LIMITS[nextPlan].creditsPerMonth,
                        creditsResetAt: this.isUnlimitedPlan(nextPlan) ? null : (remoteSubscription.currentPeriodEnd || this.buildNextMonthlyResetAt(now)),
                        requiresPayment: false,
                        legacyFree: false,
                        updatedAt: now,
                    },
                });
            }
            return this.prisma.subscription.create({
                data: {
                    id: randomUUID(),
                    userId: user.id,
                    plan: nextPlan,
                    status: nextStatus,
                    stripeCustomerId: remoteSubscription.customerId,
                    stripeSubscriptionId: remoteSubscription.subscriptionId,
                    currentPeriodEnd: remoteSubscription.currentPeriodEnd,
                    creditsRemaining: PLAN_LIMITS[nextPlan].creditsPerMonth,
                    creditsResetAt: this.isUnlimitedPlan(nextPlan) ? null : (remoteSubscription.currentPeriodEnd || this.buildNextMonthlyResetAt(now)),
                    legacyFree: false,
                    requiresPayment: false,
                    updatedAt: now,
                },
            });
        }
        catch (error) {
            this.logger.warn(`Stripe subscription recovery skipped for ${user.email}: ${error.message}`);
            return subscription;
        }
    }
    shouldAttemptStripeRecovery(user, subscription) {
        if (!this.stripeService.isReady()) {
            return false;
        }
        if (!user.email || user.email.endsWith('@placeholder.local')) {
            return false;
        }
        if (!subscription) {
            return true;
        }
        if (subscription.stripeSubscriptionId) {
            return false;
        }
        if (subscription.plan === 'starter' || subscription.plan === 'pro' || subscription.plan === 'business') {
            return subscription.status !== 'trialing';
        }
        return true;
    }
    async ensureLocalUser(userId, userEmail) {
        const existing = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (existing) {
            if (userEmail && existing.email.endsWith('@placeholder.local')) {
                const existingByEmail = await this.prisma.user.findUnique({
                    where: { email: userEmail },
                });
                if (existingByEmail && existingByEmail.id !== userId) {
                    return this.reconcileDuplicateLocalUsers(existing, existingByEmail, userId, userEmail);
                }
                return this.prisma.user.update({
                    where: { id: userId },
                    data: { email: userEmail },
                });
            }
            return existing;
        }
        if (userEmail) {
            const existingByEmail = await this.prisma.user.findUnique({
                where: { email: userEmail },
            });
            if (existingByEmail) {
                return this.claimExistingUserByEmail(existingByEmail, userId, userEmail);
            }
        }
        try {
            return await this.prisma.user.create({
                data: {
                    id: userId,
                    email: userEmail || `${userId}@placeholder.local`,
                },
            });
        }
        catch (error) {
            if (error?.code === 'P2002' && userEmail) {
                const existingByEmail = await this.prisma.user.findUnique({
                    where: { email: userEmail },
                });
                if (existingByEmail) {
                    return this.claimExistingUserByEmail(existingByEmail, userId, userEmail);
                }
            }
            throw error;
        }
    }
    async claimExistingUserByEmail(existingByEmail, userId, userEmail) {
        this.logger.warn(`Reconciling local user by email for ${userEmail}: moving ${existingByEmail.id} to ${userId}`);
        return this.prisma.user.update({
            where: { email: userEmail },
            data: {
                id: userId,
            },
        });
    }
    async reconcileDuplicateLocalUsers(placeholderUser, emailUser, userId, userEmail) {
        this.logger.warn(`Merging duplicate local users for ${userEmail}: placeholder=${placeholderUser.id}, emailOwner=${emailUser.id}, target=${userId}`);
        return this.prisma.$transaction(async (tx) => {
            const placeholderSubscription = await tx.subscription.findUnique({
                where: { userId: placeholderUser.id },
            });
            const emailSubscription = await tx.subscription.findUnique({
                where: { userId: emailUser.id },
            });
            if (!placeholderSubscription) {
                await tx.user.delete({
                    where: { id: placeholderUser.id },
                });
                return tx.user.update({
                    where: { id: emailUser.id },
                    data: {
                        id: userId,
                        email: userEmail,
                    },
                });
            }
            await tx.membership.updateMany({
                where: { userId: emailUser.id },
                data: { userId },
            });
            await tx.project.updateMany({
                where: { ownerId: emailUser.id },
                data: { ownerId: userId },
            });
            await tx.lifecycleEmailLog.updateMany({
                where: { userId: emailUser.id },
                data: { userId },
            });
            if (!emailSubscription) {
                await tx.subscription.update({
                    where: { userId: placeholderUser.id },
                    data: { userId },
                });
            }
            await tx.user.delete({
                where: { id: emailUser.id },
            });
            return tx.user.update({
                where: { id: userId },
                data: {
                    email: userEmail,
                },
            });
        });
    }
    async repairMisclassifiedTrialSubscription(user, subscription) {
        const launchAt = this.getFreeTrialLaunchAt();
        const looksMisclassifiedTrial = subscription.legacyFree &&
            subscription.plan === 'free' &&
            subscription.status === 'active' &&
            !subscription.trialConsumedAt &&
            !subscription.stripeSubscriptionId &&
            !subscription.stripeCustomerId &&
            user.createdAt.getTime() >= launchAt.getTime() &&
            subscription.createdAt.getTime() >= launchAt.getTime();
        const looksLikeUnpaidActivePlan = ['starter', 'pro', 'business'].includes(subscription.plan) &&
            subscription.status === 'active' &&
            !subscription.trialStartedAt &&
            !subscription.trialConsumedAt &&
            !subscription.stripeSubscriptionId &&
            !subscription.stripeCustomerId;
        if (!looksMisclassifiedTrial && !looksLikeUnpaidActivePlan) {
            return subscription;
        }
        this.logger.warn(`Repairing misclassified free-trial account for user ${user.id} (${user.email})`);
        const trialStartedAt = new Date();
        const trialEndsAt = new Date(trialStartedAt.getTime() + this.getTrialDurationMs());
        const updated = await this.prisma.subscription.update({
            where: { userId: user.id },
            data: {
                plan: 'pro',
                status: 'trialing',
                creditsRemaining: PLAN_LIMITS.pro.creditsPerMonth,
                creditsResetAt: null,
                trialStartedAt,
                trialEndsAt,
                trialConsumedAt: trialStartedAt,
                legacyFree: false,
                requiresPayment: false,
                updatedAt: new Date(),
            },
        });
        await this.lifecycleEmailService.scheduleTrialLifecycleEmails({
            userId: user.id,
            email: user.email,
            trialStartedAt,
            trialEndsAt,
            legacyFree: false,
        });
        return updated;
    }
    async createInitialSubscription(user) {
        if (this.isLegacyEligible(user.createdAt)) {
            return this.prisma.subscription.create({
                data: {
                    id: randomUUID(),
                    userId: user.id,
                    plan: 'free',
                    status: 'active',
                    creditsRemaining: PLAN_LIMITS.free.creditsPerMonth,
                    creditsResetAt: this.buildNextMonthlyResetAt(new Date()),
                    legacyFree: true,
                    requiresPayment: false,
                    updatedAt: new Date(),
                },
            });
        }
        const trialStartedAt = new Date();
        const trialEndsAt = new Date(trialStartedAt.getTime() + this.getTrialDurationMs());
        const subscription = await this.prisma.subscription.create({
            data: {
                id: randomUUID(),
                userId: user.id,
                plan: 'pro',
                status: 'trialing',
                creditsRemaining: PLAN_LIMITS.pro.creditsPerMonth,
                creditsResetAt: null,
                trialStartedAt,
                trialEndsAt,
                trialConsumedAt: trialStartedAt,
                legacyFree: false,
                requiresPayment: false,
                updatedAt: new Date(),
            },
        });
        await this.lifecycleEmailService.scheduleTrialLifecycleEmails({
            userId: user.id,
            email: user.email,
            trialStartedAt,
            trialEndsAt,
            legacyFree: false,
        });
        await this.lifecycleEmailService.scheduleSignupOnboardingEmails({
            userId: user.id,
            email: user.email,
            signupAt: user.createdAt,
        });
        return subscription;
    }
    async refreshSubscriptionState(subscription) {
        if (subscription.status !== 'trialing' || !subscription.trialEndsAt) {
            return subscription;
        }
        if (new Date() < subscription.trialEndsAt) {
            return subscription;
        }
        if (subscription.legacyFree) {
            return this.prisma.subscription.update({
                where: { userId: subscription.userId },
                data: {
                    plan: 'free',
                    status: 'active',
                    creditsRemaining: PLAN_LIMITS.free.creditsPerMonth,
                    creditsResetAt: this.buildNextMonthlyResetAt(new Date()),
                    requiresPayment: false,
                    updatedAt: new Date(),
                },
            });
        }
        return this.prisma.subscription.update({
            where: { userId: subscription.userId },
            data: {
                status: 'trial_expired',
                creditsRemaining: 0,
                creditsResetAt: null,
                requiresPayment: true,
                updatedAt: new Date(),
            },
        });
    }
    async resetCredits(userId, plan) {
        const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
        return this.prisma.subscription.update({
            where: { userId },
            data: {
                creditsRemaining: limits.creditsPerMonth,
                creditsResetAt: this.buildNextMonthlyResetAt(new Date()),
                updatedAt: new Date(),
            },
        });
    }
    resolveEntitlements(subscription) {
        const accessState = this.getAccessState(subscription);
        if (accessState === 'trialing') {
            return {
                accessState,
                effectivePlan: 'pro',
                limits: PLAN_LIMITS.pro,
            };
        }
        if (accessState === 'pack_active') {
            return {
                accessState,
                effectivePlan: 'pack',
                limits: this.getPackLimits(),
            };
        }
        if (accessState === 'active_paid' && PLAN_LIMITS[subscription.plan]) {
            return {
                accessState,
                effectivePlan: subscription.plan,
                limits: this.getPlanLimits(subscription.plan),
            };
        }
        return {
            accessState,
            effectivePlan: subscription.legacyFree ? 'legacy' : 'free',
            limits: this.getPlanLimits('free'),
        };
    }
    ensureWritableAccess(subscription) {
        const entitlements = this.resolveEntitlements(subscription);
        if (entitlements.accessState === 'trial_expired') {
            throw new ForbiddenException("Votre essai gratuit est terminé. Passez à l'abonnement Pro pour continuer.");
        }
        return entitlements;
    }
    getAccessState(subscription) {
        if (subscription.status === 'trialing' && subscription.trialEndsAt && new Date() < subscription.trialEndsAt) {
            return 'trialing';
        }
        if (subscription.plan === 'free' && !subscription.legacyFree && subscription.creditsRemaining > 0) {
            return 'pack_active';
        }
        if (subscription.requiresPayment) {
            return 'trial_expired';
        }
        if (subscription.legacyFree || subscription.plan === 'free') {
            return 'legacy_free';
        }
        return 'active_paid';
    }
    canStartTrial(subscription) {
        return Boolean(subscription.legacyFree &&
            !subscription.trialConsumedAt &&
            !subscription.stripeSubscriptionId &&
            subscription.status !== 'trialing');
    }
    serializeSubscription(subscription) {
        const entitlements = this.resolveEntitlements(subscription);
        const now = Date.now();
        const packActive = this.isPackActive(subscription);
        const features = entitlements.accessState === 'trial_expired' ? [] : entitlements.limits.features;
        const creditsTotal = entitlements.accessState === 'trial_expired' ? 0 : entitlements.limits.creditsPerMonth;
        const trialDaysLeft = subscription.trialEndsAt
            ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now) / DAY_MS))
            : 0;
        return {
            ...subscription,
            accessState: entitlements.accessState,
            effectivePlan: entitlements.effectivePlan,
            features,
            creditsTotal,
            limits: entitlements.limits,
            trialDaysLeft,
            canStartTrial: this.canStartTrial(subscription),
            requiresPayment: entitlements.accessState === 'trial_expired',
            legacyFree: subscription.legacyFree,
            isLegacyAccess: subscription.legacyFree,
            packActive,
            packCreditsRemaining: packActive ? subscription.creditsRemaining : 0,
            hearAboutAnswered: !!subscription.hearAboutUs,
            packFeaturesMode: packActive ? 'generation_and_export' : null,
        };
    }
    async handleCreditPackPurchase(userId, userEmail, packType) {
        const creditsToAdd = CREDIT_PACKS[packType] || 0;
        if (creditsToAdd <= 0) {
            this.logger.warn(`[Stripe Webhook] Unknown packType: ${packType}`);
            return;
        }
        const user = await this.ensureLocalUser(userId, userEmail);
        let sub = await this.prisma.subscription.findUnique({
            where: { userId },
        });
        if (!sub) {
            sub = await this.prisma.subscription.create({
                data: {
                    id: randomUUID(),
                    userId,
                    plan: 'free',
                    status: 'active',
                    creditsRemaining: this.isLegacyEligible(user.createdAt) ? PLAN_LIMITS.free.creditsPerMonth : 0,
                    creditsResetAt: this.isLegacyEligible(user.createdAt) ? this.buildNextMonthlyResetAt(new Date()) : null,
                    legacyFree: this.isLegacyEligible(user.createdAt),
                    requiresPayment: !this.isLegacyEligible(user.createdAt),
                    updatedAt: new Date(),
                },
            });
        }
        const freeLimit = PLAN_LIMITS.free.creditsPerMonth;
        const baseCredits = sub.legacyFree ? Math.max(sub.creditsRemaining, freeLimit) : Math.max(sub.creditsRemaining, 0);
        const now = new Date();
        const updated = await this.prisma.subscription.update({
            where: { userId },
            data: {
                plan: 'free',
                status: 'active',
                creditsRemaining: baseCredits + creditsToAdd,
                legacyFree: false,
                creditsResetAt: null,
                requiresPayment: false,
                updatedAt: now,
            },
        });
        await this.lifecycleEmailService.schedulePackPurchaseConfirmation({
            userId,
            email: user.email,
            purchasedAt: now,
            packType,
            creditsPurchased: creditsToAdd,
            creditsBalance: updated.creditsRemaining,
        });
        this.logger.log(`[Stripe Webhook] Added ${creditsToAdd} pack credits to ${userId}`);
    }
    isLegacyEligible(createdAt) {
        return createdAt.getTime() < this.getFreeTrialLaunchAt().getTime();
    }
    getFreeTrialLaunchAt() {
        const launchAt = process.env.FREE_TRIAL_LAUNCH_AT || '2026-03-10T00:00:00.000Z';
        return new Date(launchAt);
    }
    getTrialDurationMs() {
        const days = Number(process.env.FREE_TRIAL_DAYS || 7);
        return Math.max(1, days) * DAY_MS;
    }
    buildNextMonthlyResetAt(from) {
        return new Date(from.getFullYear(), from.getMonth() + 1, 1);
    }
    isUnlimitedPlan(plan) {
        return (PLAN_LIMITS[plan]?.creditsPerMonth ?? 0) === -1;
    }
    async saveHearAboutUs(userId, source) {
        await this.prisma.subscription.update({
            where: { userId },
            data: { hearAboutUs: source, updatedAt: new Date() },
        });
        return { ok: true };
    }
    isPackActive(subscription) {
        return subscription.plan === 'free' && !subscription.legacyFree && subscription.creditsRemaining > 0;
    }
    getPackLimits() {
        return {
            creditsPerMonth: 0,
            features: ['export_pdf', 'export_pptx', 'export_editable_pptx', 'no_watermark', 'public_link', 'web_viewer'],
            limits: {
                pdfPages: 50,
                maxProjects: 20,
                aiAddPerPresentation: 5,
                aiWandPerPresentation: -1,
            },
        };
    }
};
SubscriptionService = SubscriptionService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService,
        LifecycleEmailService,
        StripeService,
        SupabaseMirrorService])
], SubscriptionService);
export { SubscriptionService };
