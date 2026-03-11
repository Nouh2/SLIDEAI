import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { QueueService } from '../queues/queue.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

type TrialEmailStep = {
  emailType: string;
  offsetMs: number;
};

type ScheduledEmailStep = {
  emailType: string;
  offsetMs: number;
};

const TRIAL_EMAIL_SCHEDULE: TrialEmailStep[] = [
  { emailType: 'trial_welcome', offsetMs: 0 },
  { emailType: 'trial_inactive_day1', offsetMs: 1 * DAY_MS },
  { emailType: 'trial_value_day4', offsetMs: 4 * DAY_MS },
  { emailType: 'trial_ending_day6', offsetMs: 6 * DAY_MS },
  { emailType: 'trial_expired', offsetMs: 7 * DAY_MS },
  { emailType: 'trial_winback_day2', offsetMs: 9 * DAY_MS },
];

const SIGNUP_ONBOARDING_SCHEDULE: ScheduledEmailStep[] = [
  { emailType: 'signup_day1_no_presentation', offsetMs: 1 * DAY_MS },
  { emailType: 'signup_day3_no_presentation', offsetMs: 3 * DAY_MS },
  { emailType: 'signup_day5_activated', offsetMs: 5 * DAY_MS },
];

const INACTIVITY_REACTIVATION_SCHEDULE: ScheduledEmailStep[] = [
  { emailType: 'inactive_7d', offsetMs: 7 * DAY_MS },
  { emailType: 'inactive_14d', offsetMs: 14 * DAY_MS },
  { emailType: 'inactive_21d_offer', offsetMs: 21 * DAY_MS },
];

const CANCEL_SEQUENCE_SCHEDULE: ScheduledEmailStep[] = [
  { emailType: 'cancel_confirmation', offsetMs: 0 },
  { emailType: 'cancel_day3_winback', offsetMs: 3 * DAY_MS },
];

@Injectable()
export class LifecycleEmailService {
  private readonly logger = new Logger(LifecycleEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queues: QueueService,
  ) {}

  async scheduleTrialLifecycleEmails(params: {
    userId: string;
    email?: string;
    trialStartedAt: Date;
    trialEndsAt: Date;
    legacyFree: boolean;
  }) {
    if (!params.email) {
      this.logger.warn(`Skipping lifecycle email scheduling for ${params.userId}: no email available`);
      return;
    }

    const basePayload = {
      email: params.email,
      trialStartedAt: params.trialStartedAt.toISOString(),
      trialEndsAt: params.trialEndsAt.toISOString(),
      legacyFree: params.legacyFree,
    };

    await this.scheduleSequence({
      userId: params.userId,
      email: params.email,
      anchorAt: params.trialStartedAt,
      scopeKey: `trial_${this.toScopeStamp(params.trialStartedAt)}`,
      steps: TRIAL_EMAIL_SCHEDULE,
      payload: basePayload,
    });
  }

  async scheduleSignupOnboardingEmails(params: {
    userId: string;
    email?: string;
    signupAt: Date;
  }) {
    if (!params.email) {
      this.logger.warn(`Skipping signup onboarding scheduling for ${params.userId}: no email available`);
      return;
    }

    await this.scheduleSequence({
      userId: params.userId,
      email: params.email,
      anchorAt: params.signupAt,
      scopeKey: `signup_${this.toScopeStamp(params.signupAt)}`,
      steps: SIGNUP_ONBOARDING_SCHEDULE,
      payload: {
        email: params.email,
        signupAt: params.signupAt.toISOString(),
      },
    });
  }

  async scheduleInactivityReactivationEmails(params: {
    userId: string;
    email?: string;
    activityAt: Date;
  }) {
    if (!params.email) {
      this.logger.warn(`Skipping inactivity scheduling for ${params.userId}: no email available`);
      return;
    }

    await this.scheduleSequence({
      userId: params.userId,
      email: params.email,
      anchorAt: params.activityAt,
      scopeKey: `activity_${this.toScopeStamp(params.activityAt)}`,
      steps: INACTIVITY_REACTIVATION_SCHEDULE,
      payload: {
        email: params.email,
        activityAt: params.activityAt.toISOString(),
      },
    });
  }

  async schedulePackPurchaseConfirmation(params: {
    userId: string;
    email?: string;
    purchasedAt: Date;
    packType: string;
    creditsPurchased: number;
    creditsBalance: number;
  }) {
    if (!params.email) {
      this.logger.warn(`Skipping pack purchase email for ${params.userId}: no email available`);
      return;
    }

    const scopeKey = `pack_${this.toScopeStamp(params.purchasedAt)}`;
    await this.scheduleSingleEmail({
      userId: params.userId,
      email: params.email,
      emailType: 'pack_purchase_confirmation',
      scheduledFor: params.purchasedAt,
      scopeKey,
      payload: {
        email: params.email,
        purchasedAt: params.purchasedAt.toISOString(),
        packType: params.packType,
        creditsPurchased: params.creditsPurchased,
        creditsBalance: params.creditsBalance,
        scopeKey,
      },
    });
  }

  async schedulePackBalanceAlert(params: {
    userId: string;
    email?: string;
    emailType: 'pack_low_balance' | 'pack_exhausted';
    creditsRemaining: number;
  }) {
    if (!params.email) {
      this.logger.warn(`Skipping pack balance email for ${params.userId}: no email available`);
      return;
    }

    const latestPack = await this.prisma.lifecycleEmailLog.findFirst({
      where: {
        userId: params.userId,
        emailType: 'pack_purchase_confirmation',
      },
      orderBy: { createdAt: 'desc' },
    });

    const packScopeKey =
      ((latestPack?.payload as Record<string, any> | null)?.scopeKey as string | undefined) ||
      `pack_fallback_${params.userId}`;

    await this.scheduleSingleEmail({
      userId: params.userId,
      email: params.email,
      emailType: params.emailType,
      scheduledFor: new Date(),
      scopeKey: `${packScopeKey}_${params.emailType}`,
      payload: {
        email: params.email,
        creditsRemaining: params.creditsRemaining,
        packScopeKey,
      },
    });
  }

  async scheduleCancellationEmails(params: {
    userId: string;
    email?: string;
    canceledAt: Date;
  }) {
    if (!params.email) {
      this.logger.warn(`Skipping cancellation emails for ${params.userId}: no email available`);
      return;
    }

    await this.scheduleSequence({
      userId: params.userId,
      email: params.email,
      anchorAt: params.canceledAt,
      scopeKey: `cancel_${this.toScopeStamp(params.canceledAt)}`,
      steps: CANCEL_SEQUENCE_SCHEDULE,
      payload: {
        email: params.email,
        canceledAt: params.canceledAt.toISOString(),
      },
    });
  }

  async scheduleFailedPaymentEmail(params: {
    userId: string;
    email?: string;
    invoiceId: string;
    amountDue?: number | null;
    currency?: string | null;
  }) {
    if (!params.email) {
      this.logger.warn(`Skipping failed payment email for ${params.userId}: no email available`);
      return;
    }

    await this.scheduleSingleEmail({
      userId: params.userId,
      email: params.email,
      emailType: 'failed_payment_day0',
      scheduledFor: new Date(),
      scopeKey: `invoice_${this.sanitizeScopeKey(params.invoiceId)}`,
      payload: {
        email: params.email,
        invoiceId: params.invoiceId,
        amountDue: params.amountDue,
        currency: params.currency,
      },
    });
  }

  private async scheduleSequence(params: {
    userId: string;
    email: string;
    anchorAt: Date;
    scopeKey: string;
    steps: ScheduledEmailStep[];
    payload: Record<string, unknown>;
  }) {
    for (const step of params.steps) {
      const scheduledFor = new Date(params.anchorAt.getTime() + step.offsetMs);
      await this.scheduleSingleEmail({
        userId: params.userId,
        email: params.email,
        emailType: step.emailType,
        scheduledFor,
        scopeKey: `${params.scopeKey}_${step.emailType}`,
        payload: params.payload,
      });
    }
  }

  private async scheduleSingleEmail(params: {
    userId: string;
    email: string;
    emailType: string;
    scheduledFor: Date;
    scopeKey: string;
    payload: Record<string, unknown>;
  }) {
    const dedupeKey = `${params.emailType}__${params.userId}__${this.sanitizeScopeKey(params.scopeKey)}`;

    const existing = await this.prisma.lifecycleEmailLog.findUnique({
      where: { dedupeKey },
    });

    if (existing) {
      return;
    }

    const payload = {
      ...params.payload,
      email: params.email,
      scopeKey: params.scopeKey,
    };

    await this.prisma.lifecycleEmailLog.create({
      data: {
        dedupeKey,
        userId: params.userId,
        emailType: params.emailType,
        scheduledFor: params.scheduledFor,
        payload,
      },
    });

    await this.queues.addLifecycleEmail(
      {
        userId: params.userId,
        emailType: params.emailType,
        dedupeKey,
        ...payload,
      },
      {
        jobId: dedupeKey,
        delay: Math.max(0, params.scheduledFor.getTime() - Date.now()),
        removeOnComplete: 500,
        removeOnFail: 500,
      },
    );
  }

  private toScopeStamp(date: Date) {
    return date.toISOString().replace(/[:.]/g, '-');
  }

  private sanitizeScopeKey(value: string) {
    return value.replace(/[^a-zA-Z0-9_-]/g, '-');
  }
}
