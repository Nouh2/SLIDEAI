import { OpsService } from './ops.service.js';
export declare class OpsController {
    private readonly opsService;
    constructor(opsService: OpsService);
    unsubscribe(token: string): Promise<string>;
    getMe(req: any): Promise<{
        email: string;
        templates: number;
        flows: number;
    }>;
    getOverview(): Promise<{
        summary: {
            totalUsers: number;
            newUsers7d: number;
            newUsers30d: number;
            totalPresentations: number;
            presentations7d: number;
            presentations30d: number;
            activeCreators7d: number;
            trialingCount: number;
            activePaidCount: number;
            legacyFreeCount: number;
            trialExpiredCount: number;
            packActiveCount: number;
            activationRate30d: number;
            sentEmails30d: number;
            pendingEmails: number;
            skippedEmails30d: number;
            mrrCents: number;
            mrrCurrency: string;
        };
        acquisition: {
            configured: boolean;
            source: string;
            error?: undefined;
            sessions30d?: undefined;
            users30d?: undefined;
            pageViews30d?: undefined;
            vercelClientEnabled?: undefined;
        } | {
            configured: boolean;
            source: string;
            error: string;
            sessions30d?: undefined;
            users30d?: undefined;
            pageViews30d?: undefined;
            vercelClientEnabled?: undefined;
        } | {
            configured: boolean;
            source: string;
            sessions30d: number;
            users30d: number;
            pageViews30d: number;
            vercelClientEnabled: boolean;
            error?: undefined;
        } | {
            configured: boolean;
            source: string;
            error: string;
        };
        flows: {
            flowSlug: string;
            sent: number;
            skipped: number;
            pending: number;
        }[];
    }>;
    getMoneyFunnel(days?: string): Promise<{
        days: number;
        generatedAt: string;
        acquisition: {
            configured: boolean;
            source: string;
            activeUsers: number;
            sessions: number;
            pageViews: number;
            events: Record<string, {
                eventCount: number;
                activeUsers: number;
            }>;
        } | {
            configured: boolean;
            source: string;
            error: string;
            activeUsers: number;
            sessions: number;
            pageViews: number;
            events: {};
        };
        summary: {
            visitors: number;
            signups: number;
            confirmed: number;
            trials: number;
            firstDecks: number;
            exports: number;
            pricingViews: number;
            planClicks: number;
            checkouts: number;
            purchases: number;
            currentPaidStripe: number;
            currentManualPro: number;
            currentPackUsers: number;
            revenueCents: number;
            currency: string;
        };
        bottleneck: {
            key: string;
            label: string;
            dropoff: number;
            fromPrevious: number;
            previous: number;
            value: number;
        } | null;
        recommendation: string;
        stages: {
            previous: number;
            fromPrevious: number;
            fromStart: number;
            dropoff: number;
            key: string;
            label: string;
            description: string;
            value: number;
            source: string;
        }[];
    }>;
    listTemplates(): Promise<{
        flowSlug: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        category: string;
        locale: string;
        kind: string;
        draftJson: import("@prisma/client/runtime/library").JsonValue | null;
        liveJson: import("@prisma/client/runtime/library").JsonValue | null;
        draftVersion: number;
        liveVersion: number;
        updatedBy: string | null;
    }[]>;
    getTemplate(slug: string): Promise<{
        previewDraft: {
            subject: string;
            html: string;
            model: import("./ops-email-renderer.js").EmailContent;
            fixture: {
                legacyFree: any;
                presentationCount: any;
                trialEndsAt: string;
                winbackOffer: {
                    code: string;
                    expiresAt: string;
                    percentOff: number;
                    expiresInHours: number;
                } | undefined;
                unsubscribeUrl: string | undefined;
                footerReason: string;
            };
            version: number;
        };
        previewLive: null;
        definition: import("./ops-email-catalog.js").OpsEmailTemplateDefinition;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        category: string;
        locale: string;
        kind: string;
        draftJson: import("@prisma/client/runtime/library").JsonValue | null;
        liveJson: import("@prisma/client/runtime/library").JsonValue | null;
        draftVersion: number;
        liveVersion: number;
        updatedBy: string | null;
    }>;
    updateTemplate(slug: string, body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        category: string;
        locale: string;
        kind: string;
        draftJson: import("@prisma/client/runtime/library").JsonValue | null;
        liveJson: import("@prisma/client/runtime/library").JsonValue | null;
        draftVersion: number;
        liveVersion: number;
        updatedBy: string | null;
    }>;
    publishTemplate(slug: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        category: string;
        locale: string;
        kind: string;
        draftJson: import("@prisma/client/runtime/library").JsonValue | null;
        liveJson: import("@prisma/client/runtime/library").JsonValue | null;
        draftVersion: number;
        liveVersion: number;
        updatedBy: string | null;
    }>;
    previewTemplate(slug: string, body: {
        mode?: 'draft' | 'live';
        fixtureOverrides?: Record<string, any>;
    }): Promise<{
        subject: string;
        html: string;
        model: import("./ops-email-renderer.js").EmailContent;
        fixture: {
            legacyFree: any;
            presentationCount: any;
            trialEndsAt: string;
            winbackOffer: {
                code: string;
                expiresAt: string;
                percentOff: number;
                expiresInHours: number;
            } | undefined;
            unsubscribeUrl: string | undefined;
            footerReason: string;
        };
        version: number;
    }>;
    sendTemplateTest(slug: string, body: {
        mode?: 'draft' | 'live';
        to: string;
        fixtureOverrides?: Record<string, any>;
    }): Promise<{
        preview: {
            subject: string;
            html: string;
            model: import("./ops-email-renderer.js").EmailContent;
            fixture: {
                legacyFree: any;
                presentationCount: any;
                trialEndsAt: string;
                winbackOffer: {
                    code: string;
                    expiresAt: string;
                    percentOff: number;
                    expiresInHours: number;
                } | undefined;
                unsubscribeUrl: string | undefined;
                footerReason: string;
            };
            version: number;
        };
        response: any;
    }>;
    listFlows(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        category: string;
        kind: string;
        draftVersion: number;
        liveVersion: number;
        updatedBy: string | null;
        emailTypes: string[];
        enabled: boolean;
        timezone: string;
        sendWindowStart: string;
        sendWindowEnd: string;
        weekdaysOnly: boolean;
        draftConfig: import("@prisma/client/runtime/library").JsonValue | null;
        liveConfig: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    updateFlow(slug: string, body: any, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        category: string;
        kind: string;
        draftVersion: number;
        liveVersion: number;
        updatedBy: string | null;
        emailTypes: string[];
        enabled: boolean;
        timezone: string;
        sendWindowStart: string;
        sendWindowEnd: string;
        weekdaysOnly: boolean;
        draftConfig: import("@prisma/client/runtime/library").JsonValue | null;
        liveConfig: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    publishFlow(slug: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        slug: string;
        category: string;
        kind: string;
        draftVersion: number;
        liveVersion: number;
        updatedBy: string | null;
        emailTypes: string[];
        enabled: boolean;
        timezone: string;
        sendWindowStart: string;
        sendWindowEnd: string;
        weekdaysOnly: boolean;
        draftConfig: import("@prisma/client/runtime/library").JsonValue | null;
        liveConfig: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    listLogs(limit?: string): Promise<{
        userEmail: string;
        User: {
            email: string;
        };
        id: string;
        status: string;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        dedupeKey: string;
        emailType: string;
        templateSlug: string | null;
        templateVersion: number | null;
        flowSlug: string | null;
        flowVersion: number | null;
        providerMessageId: string | null;
        scheduledFor: Date;
        sentAt: Date | null;
        statusReason: string | null;
        payload: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    getEmailFunnel(days?: string): Promise<{
        days: number;
        totals: {
            sendRate: number;
            clickRate: number;
            conversionRate: number;
            revenuePerSentCents: number;
            scheduled: number;
            sent: number;
            skipped: number;
            pending: number;
            clicked: number;
            converted: number;
            revenueCents: number;
            currency: string;
        };
        items: {
            sendRate: number;
            clickRate: number;
            conversionRate: number;
            revenuePerSentCents: number;
            emailType: string;
            flowSlug: string;
            scheduled: number;
            sent: number;
            skipped: number;
            pending: number;
            clicked: number;
            converted: number;
            revenueCents: number;
            currency: string;
        }[];
    }>;
    getActivationFunnel(days?: string): Promise<{
        days: number;
        totals: {
            users: number;
            trialStarted: number;
            activated: number;
            checkouts: number;
            purchases: number;
            activationRate: number;
            trialToPaidRate: number;
            revenueCents: number;
            currency: string;
        };
        stages: {
            users: number;
            events: number;
            fromPrevious: number;
            fromStart: number;
            dropoffFromPrevious: number;
            eventName: string;
            label: string;
        }[];
        useCases: {
            useCase: string;
            selected: number;
            created: number;
            completed: number;
        }[];
    }>;
    broadcastGetUsers(segment: string): Promise<{
        total: number;
        eligible: number;
        users: {
            marketingOptIn: boolean;
            id: string;
            email: string;
        }[];
    }>;
    broadcastPreview(body: any): Promise<{
        subject: string;
        html: string;
    }>;
    broadcastSend(body: any, req: any): Promise<{
        broadcastId: string;
        segment: "trialing" | "trial_expired" | "paid" | "all" | "legacy_free";
        total: number;
        sent: number;
        skipped: number;
        errors: {
            email: string;
            error: string;
        }[];
    }>;
}
