import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { QueueService } from '../queues/queue.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

type TrialEmailStep = {
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

    for (const step of TRIAL_EMAIL_SCHEDULE) {
      const scheduledFor = new Date(params.trialStartedAt.getTime() + step.offsetMs);
      const dedupeKey = `${step.emailType}__${params.userId}__${params.trialStartedAt.toISOString().replace(/[:.]/g, '-')}`;

      const existing = await this.prisma.lifecycleEmailLog.findUnique({
        where: { dedupeKey },
      });

      if (existing) {
        continue;
      }

      await this.prisma.lifecycleEmailLog.create({
        data: {
          dedupeKey,
          userId: params.userId,
          emailType: step.emailType,
          scheduledFor,
          payload: basePayload,
        },
      });

      await this.queues.addLifecycleEmail(
        {
          userId: params.userId,
          email: params.email,
          emailType: step.emailType,
          dedupeKey,
          trialStartedAt: basePayload.trialStartedAt,
          trialEndsAt: basePayload.trialEndsAt,
          legacyFree: params.legacyFree,
        },
        {
          jobId: dedupeKey,
          delay: Math.max(0, scheduledFor.getTime() - Date.now()),
          removeOnComplete: 500,
          removeOnFail: 500,
        },
      );
    }
  }
}
