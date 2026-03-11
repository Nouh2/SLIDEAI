import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import type { Subscription as PrismaSubscription, User as PrismaUser } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma.service.js';
import { LifecycleEmailService } from './lifecycle-email.service.js';

type PlanLimits = {
  creditsPerMonth: number;
  features: string[];
  limits: {
    pdfPages: number;
    maxProjects: number;
    aiAddPerPresentation: number;
    aiWandPerPresentation: number;
  };
};

type AccessState = 'legacy_free' | 'trialing' | 'pack_active' | 'active_paid' | 'trial_expired';

const DAY_MS = 24 * 60 * 60 * 1000;

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    creditsPerMonth: 2,
    features: ['watermark'],
    limits: {
      pdfPages: 10,
      maxProjects: 3,
      aiAddPerPresentation: 2,
      aiWandPerPresentation: 3,
    },
  },
  starter: {
    creditsPerMonth: 15,
    features: ['web_viewer', 'public_link', 'no_watermark', 'export_pdf'],
    limits: {
      pdfPages: 50,
      maxProjects: 20,
      aiAddPerPresentation: 5,
      aiWandPerPresentation: -1,
    },
  },
  pro: {
    creditsPerMonth: -1,
    features: ['web_viewer', 'public_link', 'no_watermark', 'brand_kit', 'ai_priority', 'export_beta', 'export_pdf', 'support_priority'],
    limits: {
      pdfPages: 200,
      maxProjects: -1,
      aiAddPerPresentation: -1,
      aiWandPerPresentation: -1,
    },
  },
  business: {
    creditsPerMonth: -1,
    features: ['web_viewer', 'public_link', 'no_watermark', 'brand_kit', 'ai_priority', 'export_beta', 'team_workspace', 'sso', 'analytics', 'export_pdf'],
    limits: {
      pdfPages: 500,
      maxProjects: -1,
      aiAddPerPresentation: -1,
      aiWandPerPresentation: -1,
    },
  },
};

const CREDIT_PACKS: Record<string, number> = {
  pack_decouverte: 5,
  pack_power: 15,
};

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycleEmailService: LifecycleEmailService,
  ) {}

  async getOrCreateSubscription(userId: string, userEmail?: string) {
    const subscription = await this.getOrCreateSubscriptionRecord(userId, userEmail);
    return this.serializeSubscription(subscription);
  }

  async startTrial(userId: string, userEmail?: string) {
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

  async getSubscriptionIdForCancellation(userId: string): Promise<string> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!sub || !sub.stripeSubscriptionId) {
      throw new ForbiddenException("Aucun abonnement actif trouvé à résilier.");
    }

    return sub.stripeSubscriptionId;
  }

  async getStripeCustomerIdForCheckout(userId: string, userEmail?: string): Promise<string | null> {
    const sub = await this.getOrCreateSubscriptionRecord(userId, userEmail);
    return sub.stripeCustomerId ?? null;
  }

  async canGenerate(userId: string, userEmail?: string): Promise<boolean> {
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
      throw new ForbiddenException(
        `Vous avez atteint votre limite de ${entitlements.limits.creditsPerMonth} génération(s). Passez à un plan supérieur pour continuer.`,
      );
    }

    return true;
  }

  async consumeCredit(userId: string, userEmail?: string): Promise<void> {
    const sub = await this.getOrCreateSubscriptionRecord(userId, userEmail);
    const entitlements = this.resolveEntitlements(sub);

    if (entitlements.accessState === 'trial_expired') {
      return;
    }

    if (entitlements.limits.creditsPerMonth === -1) {
      return;
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        creditsRemaining: { decrement: 1 },
        updatedAt: new Date(),
      },
    });
  }

  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const sub = await this.getOrCreateSubscriptionRecord(userId);
    const entitlements = this.resolveEntitlements(sub);

    if (entitlements.accessState === 'trial_expired') {
      return false;
    }

    return entitlements.limits.features.includes(feature);
  }

  getPlanLimits(plan: string) {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  }

  async handleStripeEvent(event: any) {
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
          } else {
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
    }
  }

  async getUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
    const sub = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    });
    return sub?.userId || null;
  }

  async checkProjectLimit(userId: string): Promise<boolean> {
    const sub = await this.getOrCreateSubscriptionRecord(userId);
    const entitlements = this.ensureWritableAccess(sub);

    if (entitlements.limits.limits.maxProjects === -1) {
      return true;
    }

    const presentationCount = await this.prisma.presentations.count({
      where: { user_id: userId },
    });

    if (presentationCount >= entitlements.limits.limits.maxProjects) {
      throw new ForbiddenException(
        `Limite de plan atteinte : vous ne pouvez avoir que ${entitlements.limits.limits.maxProjects} présentations actives.`,
      );
    }

    return true;
  }

  async checkPdfPageLimit(userId: string, pageCount: number): Promise<boolean> {
    const sub = await this.getOrCreateSubscriptionRecord(userId);
    const entitlements = this.ensureWritableAccess(sub);

    if (entitlements.limits.limits.pdfPages === -1) {
      return true;
    }

    if (pageCount > entitlements.limits.limits.pdfPages) {
      throw new ForbiddenException(
        `Ce PDF dépasse la limite de ${entitlements.limits.limits.pdfPages} pages de votre plan.`,
      );
    }

    return true;
  }

  async checkAiAddLimit(userId: string, currentUsage: number): Promise<boolean> {
    const sub = await this.getOrCreateSubscriptionRecord(userId);
    const entitlements = this.ensureWritableAccess(sub);

    if (entitlements.limits.limits.aiAddPerPresentation === -1) {
      return true;
    }

    if (currentUsage >= entitlements.limits.limits.aiAddPerPresentation) {
      throw new ForbiddenException(
        `Limite atteinte : vous ne pouvez ajouter que ${entitlements.limits.limits.aiAddPerPresentation} slides IA par présentation avec ce plan.`,
      );
    }

    return true;
  }

  async checkAiWandLimit(userId: string, currentUsage: number): Promise<boolean> {
    const sub = await this.getOrCreateSubscriptionRecord(userId);
    const entitlements = this.ensureWritableAccess(sub);

    if (entitlements.limits.limits.aiWandPerPresentation === -1) {
      return true;
    }

    if (currentUsage >= entitlements.limits.limits.aiWandPerPresentation) {
      throw new ForbiddenException(
        `Limite atteinte : vous ne pouvez régénérer que ${entitlements.limits.limits.aiWandPerPresentation} fois par présentation avec ce plan.`,
      );
    }

    return true;
  }

  private async getOrCreateSubscriptionRecord(userId: string, userEmail?: string) {
    const user = await this.ensureLocalUser(userId, userEmail);
    let subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await this.createInitialSubscription(user);
    }

    return this.refreshSubscriptionState(subscription);
  }

  private async ensureLocalUser(userId: string, userEmail?: string): Promise<PrismaUser> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (existing) {
      if (userEmail && existing.email.endsWith('@placeholder.local')) {
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
        this.logger.warn(
          `Reconciling local user by email for ${userEmail}: moving ${existingByEmail.id} to ${userId}`,
        );

        return this.prisma.user.update({
          where: { email: userEmail },
          data: {
            id: userId,
            createdAt: new Date(),
          },
        });
      }
    }

    try {
      return await this.prisma.user.create({
        data: {
          id: userId,
          email: userEmail || `${userId}@placeholder.local`,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002' && userEmail) {
        const existingByEmail = await this.prisma.user.findUnique({
          where: { email: userEmail },
        });

        if (existingByEmail) {
          this.logger.warn(
            `Recovered from duplicate local user email for ${userEmail}: moving ${existingByEmail.id} to ${userId}`,
          );

          return this.prisma.user.update({
            where: { email: userEmail },
            data: {
              id: userId,
              createdAt: new Date(),
            },
          });
        }
      }

      throw error;
    }
  }

  private async createInitialSubscription(user: PrismaUser) {
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

    return subscription;
  }

  private async refreshSubscriptionState(subscription: PrismaSubscription) {
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

  private async resetCredits(userId: string, plan: string) {
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

  private resolveEntitlements(subscription: PrismaSubscription) {
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
        effectivePlan: 'free',
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
      effectivePlan: 'free',
      limits: this.getPlanLimits('free'),
    };
  }

  private ensureWritableAccess(subscription: PrismaSubscription) {
    const entitlements = this.resolveEntitlements(subscription);

    if (entitlements.accessState === 'trial_expired') {
      throw new ForbiddenException("Votre essai gratuit est terminé. Passez à l'abonnement Pro pour continuer.");
    }

    return entitlements;
  }

  private getAccessState(subscription: PrismaSubscription): AccessState {
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

  private canStartTrial(subscription: PrismaSubscription) {
    return Boolean(
      subscription.legacyFree &&
      !subscription.trialConsumedAt &&
      !subscription.stripeSubscriptionId &&
      subscription.status !== 'trialing',
    );
  }

  private serializeSubscription(subscription: PrismaSubscription) {
    const entitlements = this.resolveEntitlements(subscription);
    const now = Date.now();
    const packActive = this.isPackActive(subscription);
    const trialDaysLeft = subscription.trialEndsAt
      ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now) / DAY_MS))
      : 0;

    return {
      ...subscription,
      accessState: entitlements.accessState,
      creditsTotal: entitlements.limits.creditsPerMonth,
      limits: entitlements.limits,
      trialDaysLeft,
      canStartTrial: this.canStartTrial(subscription),
      requiresPayment: entitlements.accessState === 'trial_expired',
      legacyFree: subscription.legacyFree,
      packActive,
      packCreditsRemaining: packActive ? subscription.creditsRemaining : 0,
      packFeaturesMode: packActive ? 'generation_and_export' : null,
    };
  }

  private async handleCreditPackPurchase(userId: string, userEmail: string, packType: string) {
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

    await this.prisma.subscription.update({
      where: { userId },
      data: {
        plan: 'free',
        status: 'active',
        creditsRemaining: baseCredits + creditsToAdd,
        creditsResetAt: sub.legacyFree ? sub.creditsResetAt || this.buildNextMonthlyResetAt(new Date()) : null,
        requiresPayment: sub.legacyFree ? false : true,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`[Stripe Webhook] Added ${creditsToAdd} pack credits to ${userId}`);
  }

  private isLegacyEligible(createdAt: Date) {
    return createdAt.getTime() < this.getFreeTrialLaunchAt().getTime();
  }

  private getFreeTrialLaunchAt() {
    const launchAt = process.env.FREE_TRIAL_LAUNCH_AT || '2026-03-10T00:00:00.000Z';
    return new Date(launchAt);
  }

  private getTrialDurationMs() {
    const days = Number(process.env.FREE_TRIAL_DAYS || 7);
    return Math.max(1, days) * DAY_MS;
  }

  private buildNextMonthlyResetAt(from: Date) {
    return new Date(from.getFullYear(), from.getMonth() + 1, 1);
  }

  private isUnlimitedPlan(plan: string) {
    return (PLAN_LIMITS[plan]?.creditsPerMonth ?? 0) === -1;
  }

  private isPackActive(subscription: PrismaSubscription) {
    return subscription.plan === 'free' && !subscription.legacyFree && subscription.creditsRemaining > 0;
  }

  private getPackLimits(): PlanLimits {
    return {
      ...PLAN_LIMITS.free,
      features: [...PLAN_LIMITS.free.features, 'export_pdf'],
    };
  }
}
