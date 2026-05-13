import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma.service.js';
import { QueueService } from '../queues/queue.service.js';
import { OpsService } from '../ops/ops.service.js';
import { getTemplateDefinition } from '../ops/ops-email-catalog.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function extractFirstNameFromEmail(email: string): string {
  const local = email.split('@')[0];
  const firstPart = local.split('.')[0].split('_')[0].split('+')[0];
  const name = firstPart.replace(/\d+$/, '');
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

type TrialEmailStep = {
  emailType: string;
  offsetMs: number;
  bypassSendWindow?: boolean;
};

type ScheduledEmailStep = {
  emailType: string;
  offsetMs: number;
  bypassSendWindow?: boolean;
};

const TRIAL_EMAIL_SCHEDULE: TrialEmailStep[] = [
  { emailType: 'trial_welcome', offsetMs: 0, bypassSendWindow: true },
  { emailType: 'trial_inactive_day1', offsetMs: 1 * DAY_MS },
  { emailType: 'trial_value_day4', offsetMs: 4 * DAY_MS },
  { emailType: 'trial_ending_day6', offsetMs: 6 * DAY_MS },
  { emailType: 'trial_expired', offsetMs: 7 * DAY_MS },
  { emailType: 'trial_winback_day2', offsetMs: 9 * DAY_MS },
];

// signup_welcome was a duplicate of trial_welcome (same template, same offset).
// trial_welcome covers the welcome for every new user, the steps below handle nudges.
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
    private readonly opsService: OpsService,
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
        firstName: extractFirstNameFromEmail(params.email),
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

  async recordEmailClick(params: {
    emailTrackingId: string;
    emailType?: string;
    landingPath?: string;
    attribution?: Record<string, string | undefined>;
  }) {
    const trackingId = params.emailTrackingId?.trim();
    if (!trackingId) {
      return { tracked: false };
    }

    const rows = await this.prisma.$queryRaw<Array<{ id: string; payload: any }>>`
      SELECT "id", "payload"
      FROM "LifecycleEmailLog"
      WHERE "payload"->>'emailTrackingId' = ${trackingId}
      LIMIT 1
    `;

    const row = rows[0];
    if (!row) {
      return { tracked: false };
    }

    const now = new Date().toISOString();
    const currentPayload = row.payload && typeof row.payload === 'object' ? row.payload : {};
    const clickCount = Number(currentPayload.emailClickCount || 0) + 1;

    await this.prisma.lifecycleEmailLog.update({
      where: { id: row.id },
      data: {
        payload: {
          ...currentPayload,
          emailClickedAt: currentPayload.emailClickedAt || now,
          emailLastClickedAt: now,
          emailClickCount: clickCount,
          emailClickLandingPath: params.landingPath,
          emailClickAttribution: {
            ...(currentPayload.emailClickAttribution || {}),
            ...(params.attribution || {}),
            emailType: params.emailType,
          },
        } as any,
      },
    });

    return { tracked: true };
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
      const targetScheduledFor = new Date(params.anchorAt.getTime() + step.offsetMs);
      await this.scheduleSingleEmail({
        userId: params.userId,
        email: params.email,
        emailType: step.emailType,
        scheduledFor: targetScheduledFor,
        scopeKey: `${params.scopeKey}_${step.emailType}`,
        payload: params.payload,
        bypassSendWindow: step.bypassSendWindow,
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
    bypassSendWindow?: boolean;
  }) {
    const templateRuntime = await this.opsService.getTemplateRuntime(params.emailType);
    const flowRuntime = await this.opsService.getFlowRuntimeByEmailType(params.emailType);
    const templateDefinition = getTemplateDefinition(params.emailType);

    if (flowRuntime && !flowRuntime.enabled) {
      this.logger.log(`Skipping ${params.emailType} for ${params.userId}: flow ${flowRuntime.slug} disabled`);
      return;
    }

    const isMarketing = templateDefinition?.kind === 'marketing';
    if (isMarketing) {
      const allowed = await this.opsService.isMarketingAllowed(params.userId);
      if (!allowed) {
        await this.prisma.lifecycleEmailLog.create({
          data: {
            dedupeKey: `${params.emailType}__${params.userId}__${this.sanitizeScopeKey(params.scopeKey)}__optout`,
            userId: params.userId,
            emailType: params.emailType,
            templateSlug: templateRuntime?.slug,
            templateVersion: templateRuntime?.liveVersion,
            flowSlug: flowRuntime?.slug,
            flowVersion: flowRuntime?.liveVersion,
            scheduledFor: params.scheduledFor,
            status: 'skipped',
            statusReason: 'marketing_unsubscribed',
            payload: params.payload as any,
          },
        }).catch(() => undefined);
        return;
      }
    }

    const unsubscribeUrl = isMarketing ? await this.opsService.getUnsubscribeUrl(params.userId) : undefined;
    const scheduledFor = params.bypassSendWindow ? params.scheduledFor : this.applyFlowWindow(params.scheduledFor, flowRuntime);
    const dedupeKey = `${params.emailType}__${params.userId}__${this.sanitizeScopeKey(params.scopeKey)}`;

    const existing = await this.prisma.lifecycleEmailLog.findUnique({
      where: { dedupeKey },
    });

    if (existing) {
      return;
    }

    const emailTrackingId = randomUUID();
    const payload = {
      ...params.payload,
      email: params.email,
      emailTrackingId,
      scopeKey: params.scopeKey,
      unsubscribeUrl,
      templateSlug: templateRuntime?.slug,
      templateVersion: templateRuntime?.liveVersion,
      templatePatch: templateRuntime?.liveJson || {},
      flowSlug: flowRuntime?.slug,
      flowVersion: flowRuntime?.liveVersion,
      flowConfig: flowRuntime?.config || {},
      footerReason:
        templateDefinition?.kind === 'marketing'
          ? 'Vous recevez cet email car vous utilisez SlideAI et avez accepte les emails marketing.'
          : 'Vous recevez cet email car il est lie a votre compte SlideAI.',
    };

    await this.prisma.lifecycleEmailLog.create({
      data: {
        dedupeKey,
        userId: params.userId,
        emailType: params.emailType,
        templateSlug: templateRuntime?.slug,
        templateVersion: templateRuntime?.liveVersion,
        flowSlug: flowRuntime?.slug,
        flowVersion: flowRuntime?.liveVersion,
        scheduledFor,
        payload: payload as any,
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
        delay: Math.max(0, scheduledFor.getTime() - Date.now()),
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

  private applyFlowWindow(date: Date, flowRuntime: Awaited<ReturnType<OpsService['getFlowRuntimeByEmailType']>>) {
    if (!flowRuntime) {
      return date;
    }

    const scheduled = new Date(date);
    const [startHour, startMinute] = flowRuntime.sendWindowStart.split(':').map((value: string) => Number(value));
    const [endHour, endMinute] = flowRuntime.sendWindowEnd.split(':').map((value: string) => Number(value));

    const minutes = scheduled.getHours() * 60 + scheduled.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (flowRuntime.weekdaysOnly) {
      while (scheduled.getDay() === 0 || scheduled.getDay() === 6) {
        scheduled.setDate(scheduled.getDate() + 1);
        scheduled.setHours(startHour, startMinute, 0, 0);
      }
    }

    if (minutes < startMinutes) {
      scheduled.setHours(startHour, startMinute, 0, 0);
      return scheduled;
    }

    if (minutes > endMinutes) {
      scheduled.setDate(scheduled.getDate() + 1);
      scheduled.setHours(startHour, startMinute, 0, 0);

      if (flowRuntime.weekdaysOnly) {
        while (scheduled.getDay() === 0 || scheduled.getDay() === 6) {
          scheduled.setDate(scheduled.getDate() + 1);
          scheduled.setHours(startHour, startMinute, 0, 0);
        }
      }
    }

    return scheduled;
  }
}
