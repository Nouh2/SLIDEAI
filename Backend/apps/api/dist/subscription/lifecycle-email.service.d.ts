import { PrismaService } from '../prisma.service.js';
import { QueueService } from '../queues/queue.service.js';
import { OpsService } from '../ops/ops.service.js';
export declare class LifecycleEmailService {
    private readonly prisma;
    private readonly queues;
    private readonly opsService;
    private readonly logger;
    constructor(prisma: PrismaService, queues: QueueService, opsService: OpsService);
    scheduleTrialLifecycleEmails(params: {
        userId: string;
        email?: string;
        trialStartedAt: Date;
        trialEndsAt: Date;
        legacyFree: boolean;
    }): Promise<void>;
    scheduleSignupOnboardingEmails(params: {
        userId: string;
        email?: string;
        signupAt: Date;
    }): Promise<void>;
    scheduleInactivityReactivationEmails(params: {
        userId: string;
        email?: string;
        activityAt: Date;
    }): Promise<void>;
    schedulePackPurchaseConfirmation(params: {
        userId: string;
        email?: string;
        purchasedAt: Date;
        packType: string;
        creditsPurchased: number;
        creditsBalance: number;
    }): Promise<void>;
    schedulePackBalanceAlert(params: {
        userId: string;
        email?: string;
        emailType: 'pack_low_balance' | 'pack_exhausted';
        creditsRemaining: number;
    }): Promise<void>;
    scheduleCancellationEmails(params: {
        userId: string;
        email?: string;
        canceledAt: Date;
    }): Promise<void>;
    scheduleFailedPaymentEmail(params: {
        userId: string;
        email?: string;
        invoiceId: string;
        amountDue?: number | null;
        currency?: string | null;
    }): Promise<void>;
    scheduleCheckoutAbandonEmail(params: {
        userId: string;
        email?: string;
        checkoutStartedAt: Date;
        checkoutType: 'subscription' | 'pack';
        plan?: string;
        packType?: string;
    }): Promise<void>;
    recordEmailClick(params: {
        emailTrackingId: string;
        emailType?: string;
        landingPath?: string;
        attribution?: Record<string, string | undefined>;
    }): Promise<{
        tracked: boolean;
    }>;
    private scheduleSequence;
    private scheduleSingleEmail;
    private toScopeStamp;
    private sanitizeScopeKey;
    private applyFlowWindow;
}
