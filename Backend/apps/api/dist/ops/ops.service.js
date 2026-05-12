var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { OPS_EMAIL_FLOW_DEFINITIONS, OPS_EMAIL_TEMPLATE_DEFINITIONS, OPS_EMAIL_TEMPLATE_MAP, } from './ops-email-catalog.js';
import { buildBroadcastEmailContent, buildLifecycleEmailModel, buildTrialEmailContent, sendLifecycleEmail, } from './ops-email-renderer.js';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
const DAY_MS = 24 * 60 * 60 * 1000;
const PRODUCT_FUNNEL_STAGES = [
    { eventName: 'trial_started', label: 'Essai demarre' },
    { eventName: 'activation_use_case_selected', label: 'Cas usage choisi' },
    { eventName: 'create_started', label: 'Generation lancee' },
    { eventName: 'deck_generated', label: 'Deck genere' },
    { eventName: 'deck_opened', label: 'Deck ouvert' },
    { eventName: 'activation_completed', label: 'Export ou partage' },
    { eventName: 'begin_checkout', label: 'Checkout lance' },
    { eventName: 'purchase', label: 'Achat confirme' },
];
let OpsService = class OpsService {
    prisma;
    stripe;
    catalogReadyAt = null;
    catalogPromise = null;
    constructor(prisma) {
        this.prisma = prisma;
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
        this.stripe = stripeSecretKey
            ? new Stripe(stripeSecretKey, {
                apiVersion: '2024-12-18.acacia',
            })
            : null;
    }
    async getOpsSession(email) {
        await this.ensureCatalog();
        return {
            email,
            templates: OPS_EMAIL_TEMPLATE_DEFINITIONS.length,
            flows: OPS_EMAIL_FLOW_DEFINITIONS.length,
        };
    }
    async getOverview() {
        await this.ensureCatalog();
        const now = new Date();
        const since7d = new Date(now.getTime() - 7 * DAY_MS);
        const since30d = new Date(now.getTime() - 30 * DAY_MS);
        const totalUsers = await this.prisma.user.count();
        const newUsers7d = await this.prisma.user.count({ where: { createdAt: { gte: since7d } } });
        const newUsers30d = await this.prisma.user.count({ where: { createdAt: { gte: since30d } } });
        const totalPresentations = await this.prisma.presentations.count();
        const presentations7d = await this.prisma.presentations.count({ where: { created_at: { gte: since7d } } });
        const presentations30d = await this.prisma.presentations.count({ where: { created_at: { gte: since30d } } });
        const trialingCount = await this.prisma.subscription.count({
            where: { status: 'trialing', trialEndsAt: { gt: now } },
        });
        const paidSubscriptions = await this.prisma.subscription.findMany({
            where: {
                stripeSubscriptionId: { not: null },
                status: { in: ['active', 'trialing'] },
            },
            select: {
                stripeSubscriptionId: true,
            },
        });
        const legacyFreeCount = await this.prisma.subscription.count({
            where: { legacyFree: true, plan: 'free' },
        });
        const trialExpiredCount = await this.prisma.subscription.count({
            where: { status: 'trial_expired' },
        });
        const packActiveCount = await this.prisma.subscription.count({
            where: {
                plan: 'free',
                legacyFree: false,
                stripeSubscriptionId: null,
                creditsRemaining: { gt: 0 },
            },
        });
        const sentLogs30d = await this.prisma.lifecycleEmailLog.count({
            where: {
                status: 'sent',
                createdAt: { gte: since30d },
            },
        });
        const pendingLogs = await this.prisma.lifecycleEmailLog.count({
            where: {
                status: 'pending',
            },
        });
        const skippedLogs30d = await this.prisma.lifecycleEmailLog.count({
            where: {
                status: 'skipped',
                createdAt: { gte: since30d },
            },
        });
        const recentPresentingUsers = await this.prisma.presentations.findMany({
            where: { created_at: { gte: since7d } },
            select: { user_id: true },
            distinct: ['user_id'],
        });
        const activatedUsers30d = await this.prisma.user.findMany({
            where: { createdAt: { gte: since30d } },
            select: {
                id: true,
                createdAt: true,
            },
        });
        const gaOverview = await this.fetchGaOverview().catch((error) => ({
            configured: false,
            source: 'ga4',
            error: error instanceof Error ? error.message : 'ga_fetch_failed',
        }));
        const paidSubscriptionIds = paidSubscriptions
            .map((item) => item.stripeSubscriptionId)
            .filter((value) => Boolean(value));
        const revenue = await this.getStripeRevenueSnapshot(paidSubscriptionIds);
        const activatedUserIds30d = new Set((await this.prisma.presentations.findMany({
            where: {
                created_at: { gte: since30d },
                user_id: {
                    in: activatedUsers30d.map((user) => user.id),
                },
            },
            select: { user_id: true },
            distinct: ['user_id'],
        })).map((item) => item.user_id));
        const activationRate30d = activatedUsers30d.length > 0
            ? Math.round((activatedUserIds30d.size / activatedUsers30d.length) * 100)
            : 0;
        return {
            summary: {
                totalUsers,
                newUsers7d,
                newUsers30d,
                totalPresentations,
                presentations7d,
                presentations30d,
                activeCreators7d: recentPresentingUsers.length,
                trialingCount,
                activePaidCount: paidSubscriptionIds.length,
                legacyFreeCount,
                trialExpiredCount,
                packActiveCount,
                activationRate30d,
                sentEmails30d: sentLogs30d,
                pendingEmails: pendingLogs,
                skippedEmails30d: skippedLogs30d,
                mrrCents: revenue.mrrCents,
                mrrCurrency: revenue.currency,
            },
            acquisition: gaOverview,
            flows: await this.getFlowPerformanceSnapshot(since30d),
        };
    }
    async listTemplates() {
        await this.ensureCatalog();
        const templates = await this.prisma.opsEmailTemplate.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
        return templates.map((template) => {
            const definition = OPS_EMAIL_TEMPLATE_MAP[template.slug];
            return {
                ...template,
                flowSlug: definition?.flowSlug,
            };
        });
    }
    async getTemplate(slug) {
        await this.ensureCatalog();
        const template = await this.prisma.opsEmailTemplate.findUnique({ where: { slug } });
        if (!template) {
            throw new Error('Template introuvable');
        }
        const previewDraft = await this.renderTemplate(slug, 'draft');
        return {
            ...template,
            previewDraft,
            previewLive: null,
            definition: OPS_EMAIL_TEMPLATE_MAP[slug],
        };
    }
    async updateTemplate(slug, input, editorEmail) {
        await this.ensureCatalog();
        const updated = await this.prisma.opsEmailTemplate.update({
            where: { slug },
            data: {
                draftJson: input.draftJson ?? {},
                draftVersion: { increment: 1 },
                updatedBy: editorEmail,
            },
        });
        return updated;
    }
    async publishTemplate(slug, editorEmail) {
        await this.ensureCatalog();
        const template = await this.prisma.opsEmailTemplate.findUnique({ where: { slug } });
        if (!template) {
            throw new Error('Template introuvable');
        }
        return this.prisma.opsEmailTemplate.update({
            where: { slug },
            data: {
                liveJson: (template.draftJson ?? {}),
                liveVersion: template.draftVersion,
                updatedBy: editorEmail,
            },
        });
    }
    async previewTemplate(slug, mode, fixtureOverrides) {
        await this.ensureCatalog();
        return this.renderTemplate(slug, mode, fixtureOverrides);
    }
    async sendTemplateTest(slug, mode, to, fixtureOverrides) {
        const preview = await this.renderTemplate(slug, mode, fixtureOverrides);
        const response = await sendLifecycleEmail({
            to,
            subject: `[Test] ${preview.subject}`,
            html: preview.html,
        });
        return {
            preview,
            response,
        };
    }
    async listFlows() {
        await this.ensureCatalog();
        return this.prisma.opsEmailFlow.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });
    }
    async updateFlow(slug, input, editorEmail) {
        await this.ensureCatalog();
        const updated = await this.prisma.opsEmailFlow.update({
            where: { slug },
            data: {
                ...(input.enabled != null ? { enabled: input.enabled } : {}),
                ...(input.timezone ? { timezone: input.timezone } : {}),
                ...(input.sendWindowStart ? { sendWindowStart: input.sendWindowStart } : {}),
                ...(input.sendWindowEnd ? { sendWindowEnd: input.sendWindowEnd } : {}),
                ...(input.weekdaysOnly != null ? { weekdaysOnly: input.weekdaysOnly } : {}),
                ...(input.draftConfig ? { draftConfig: input.draftConfig } : {}),
                draftVersion: { increment: 1 },
                updatedBy: editorEmail,
            },
        });
        return updated;
    }
    async publishFlow(slug, editorEmail) {
        await this.ensureCatalog();
        const flow = await this.prisma.opsEmailFlow.findUnique({ where: { slug } });
        if (!flow) {
            throw new Error('Flow introuvable');
        }
        return this.prisma.opsEmailFlow.update({
            where: { slug },
            data: {
                liveConfig: (flow.draftConfig ?? {}),
                liveVersion: flow.draftVersion,
                updatedBy: editorEmail,
            },
        });
    }
    async listLogs(limit = 120) {
        await this.ensureCatalog();
        const logs = await this.prisma.lifecycleEmailLog.findMany({
            take: Math.min(limit, 300),
            orderBy: { createdAt: 'desc' },
            include: {
                User: {
                    select: {
                        email: true,
                    },
                },
            },
        });
        return logs.map((log) => ({
            ...log,
            userEmail: log.User.email,
        }));
    }
    async getEmailFunnel(days = 30) {
        await this.ensureCatalog();
        const clampedDays = Math.min(Math.max(Number.isFinite(days) ? days : 30, 1), 180);
        const since = new Date(Date.now() - clampedDays * DAY_MS);
        const logs = await this.prisma.lifecycleEmailLog.findMany({
            where: {
                createdAt: { gte: since },
            },
            select: {
                emailType: true,
                flowSlug: true,
                status: true,
                payload: true,
            },
        });
        const rows = new Map();
        for (const log of logs) {
            const key = log.emailType;
            const payload = log.payload && typeof log.payload === 'object' ? log.payload : {};
            const current = rows.get(key) || {
                emailType: key,
                flowSlug: log.flowSlug || 'unclassified',
                scheduled: 0,
                sent: 0,
                skipped: 0,
                pending: 0,
                clicked: 0,
                converted: 0,
                revenueCents: 0,
                currency: 'eur',
            };
            current.scheduled += 1;
            if (log.status === 'sent')
                current.sent += 1;
            if (log.status === 'skipped')
                current.skipped += 1;
            if (log.status === 'pending')
                current.pending += 1;
            if (payload.emailClickedAt || Number(payload.emailClickCount || 0) > 0) {
                current.clicked += 1;
            }
            if (payload.emailConvertedAt || payload.emailConversion) {
                current.converted += 1;
                const conversion = payload.emailConversion || {};
                current.revenueCents += Number(conversion.amountTotal || 0);
                current.currency = conversion.currency || current.currency;
            }
            rows.set(key, current);
        }
        const items = Array.from(rows.values())
            .map((row) => ({
            ...row,
            sendRate: this.toPercent(row.sent, row.scheduled),
            clickRate: this.toPercent(row.clicked, row.sent),
            conversionRate: this.toPercent(row.converted, row.clicked || row.sent),
            revenuePerSentCents: row.sent > 0 ? Math.round(row.revenueCents / row.sent) : 0,
        }))
            .sort((a, b) => b.converted - a.converted || b.clicked - a.clicked || b.sent - a.sent);
        const totals = items.reduce((acc, row) => {
            acc.scheduled += row.scheduled;
            acc.sent += row.sent;
            acc.skipped += row.skipped;
            acc.pending += row.pending;
            acc.clicked += row.clicked;
            acc.converted += row.converted;
            acc.revenueCents += row.revenueCents;
            acc.currency = row.currency || acc.currency;
            return acc;
        }, {
            scheduled: 0,
            sent: 0,
            skipped: 0,
            pending: 0,
            clicked: 0,
            converted: 0,
            revenueCents: 0,
            currency: 'eur',
        });
        return {
            days: clampedDays,
            totals: {
                ...totals,
                sendRate: this.toPercent(totals.sent, totals.scheduled),
                clickRate: this.toPercent(totals.clicked, totals.sent),
                conversionRate: this.toPercent(totals.converted, totals.clicked || totals.sent),
                revenuePerSentCents: totals.sent > 0 ? Math.round(totals.revenueCents / totals.sent) : 0,
            },
            items,
        };
    }
    async getProductActivationFunnel(days = 30) {
        const clampedDays = Math.min(Math.max(Number.isFinite(days) ? days : 30, 1), 180);
        const since = new Date(Date.now() - clampedDays * DAY_MS);
        const events = await this.prisma.productEvent.findMany({
            where: {
                occurredAt: { gte: since },
                eventName: { in: PRODUCT_FUNNEL_STAGES.map((stage) => stage.eventName) },
            },
            select: {
                userId: true,
                eventName: true,
                properties: true,
                occurredAt: true,
            },
            orderBy: { occurredAt: 'asc' },
        });
        const usersByStage = new Map();
        const eventCountByStage = new Map();
        const useCases = new Map();
        const firstSeen = new Map();
        let revenueCents = 0;
        let revenueCurrency = 'eur';
        for (const event of events) {
            const stageUsers = usersByStage.get(event.eventName) || new Set();
            stageUsers.add(event.userId);
            usersByStage.set(event.eventName, stageUsers);
            eventCountByStage.set(event.eventName, (eventCountByStage.get(event.eventName) || 0) + 1);
            const previousFirstSeen = firstSeen.get(event.userId);
            if (!previousFirstSeen || event.occurredAt < previousFirstSeen) {
                firstSeen.set(event.userId, event.occurredAt);
            }
            const properties = event.properties && typeof event.properties === 'object'
                ? event.properties
                : {};
            const useCase = typeof properties.use_case === 'string' ? properties.use_case : undefined;
            if (useCase) {
                const row = useCases.get(useCase) || { useCase, selected: 0, created: 0, completed: 0 };
                if (event.eventName === 'activation_use_case_selected')
                    row.selected += 1;
                if (event.eventName === 'create_started')
                    row.created += 1;
                if (event.eventName === 'activation_completed')
                    row.completed += 1;
                useCases.set(useCase, row);
            }
            if (event.eventName === 'purchase') {
                const value = Number(properties.value || 0);
                if (Number.isFinite(value) && value > 0) {
                    revenueCents += Math.round(value * 100);
                }
                if (typeof properties.currency === 'string') {
                    revenueCurrency = properties.currency.toLowerCase();
                }
            }
        }
        const firstStageUsers = usersByStage.get(PRODUCT_FUNNEL_STAGES[0].eventName)?.size || 0;
        let previousUsers = firstStageUsers;
        const stages = PRODUCT_FUNNEL_STAGES.map((stage, index) => {
            const users = usersByStage.get(stage.eventName)?.size || 0;
            const eventsCount = eventCountByStage.get(stage.eventName) || 0;
            const fromPrevious = index === 0 ? 100 : this.toPercent(users, previousUsers);
            const fromStart = index === 0 ? 100 : this.toPercent(users, firstStageUsers);
            const dropoffFromPrevious = index === 0 ? 0 : Math.max(0, 100 - fromPrevious);
            previousUsers = users;
            return {
                ...stage,
                users,
                events: eventsCount,
                fromPrevious,
                fromStart,
                dropoffFromPrevious: Math.round(dropoffFromPrevious * 10) / 10,
            };
        });
        return {
            days: clampedDays,
            totals: {
                users: firstSeen.size,
                trialStarted: usersByStage.get('trial_started')?.size || 0,
                activated: usersByStage.get('activation_completed')?.size || 0,
                checkouts: usersByStage.get('begin_checkout')?.size || 0,
                purchases: usersByStage.get('purchase')?.size || 0,
                activationRate: this.toPercent(usersByStage.get('activation_completed')?.size || 0, firstStageUsers),
                trialToPaidRate: this.toPercent(usersByStage.get('purchase')?.size || 0, firstStageUsers),
                revenueCents,
                currency: revenueCurrency,
            },
            stages,
            useCases: Array.from(useCases.values()).sort((a, b) => b.selected - a.selected || b.completed - a.completed),
        };
    }
    toPercent(numerator, denominator) {
        if (!denominator)
            return 0;
        return Math.round((numerator / denominator) * 1000) / 10;
    }
    async unsubscribeByToken(token) {
        const preference = await this.prisma.opsEmailPreference.findUnique({
            where: { unsubscribeToken: token },
            include: {
                User: true,
            },
        });
        if (!preference) {
            return {
                success: false,
                html: '<html><body style="font-family: Arial, sans-serif; padding: 24px;"><h1>Lien invalide</h1><p>Le lien de desinscription est invalide ou a expire.</p></body></html>',
            };
        }
        await this.prisma.opsEmailPreference.update({
            where: { userId: preference.userId },
            data: {
                marketingOptIn: false,
                marketingUnsubscribedAt: new Date(),
            },
        });
        return {
            success: true,
            html: `<html><body style="font-family: Arial, sans-serif; padding: 24px;"><h1>Desinscription prise en compte</h1><p>${preference.User.email} ne recevra plus d'emails marketing SlideAI.</p></body></html>`,
        };
    }
    async getTemplateRuntime(slug) {
        await this.ensureCatalog();
        const template = await this.prisma.opsEmailTemplate.findUnique({ where: { slug } });
        if (!template) {
            return null;
        }
        return {
            slug: template.slug,
            liveVersion: template.liveVersion,
            draftVersion: template.draftVersion,
            kind: template.kind,
            flowSlug: OPS_EMAIL_TEMPLATE_MAP[slug]?.flowSlug,
            liveJson: template.liveJson || {},
        };
    }
    async getFlowRuntimeByEmailType(emailType) {
        await this.ensureCatalog();
        const templateDefinition = OPS_EMAIL_TEMPLATE_MAP[emailType];
        const flowSlug = templateDefinition?.flowSlug;
        if (!flowSlug) {
            return null;
        }
        const flow = await this.prisma.opsEmailFlow.findUnique({
            where: { slug: flowSlug },
        });
        if (!flow) {
            return null;
        }
        return {
            slug: flow.slug,
            enabled: flow.enabled,
            liveVersion: flow.liveVersion,
            kind: flow.kind,
            timezone: flow.timezone,
            sendWindowStart: flow.sendWindowStart,
            sendWindowEnd: flow.sendWindowEnd,
            weekdaysOnly: flow.weekdaysOnly,
            config: flow.liveConfig || {},
        };
    }
    async ensureEmailPreference(userId) {
        return this.prisma.opsEmailPreference.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });
    }
    async isMarketingAllowed(userId) {
        const preference = await this.ensureEmailPreference(userId);
        return preference.marketingOptIn;
    }
    async getUnsubscribeUrl(userId) {
        const preference = await this.ensureEmailPreference(userId);
        const apiUrl = process.env.API_PUBLIC_URL || process.env.FRONTEND_API_URL || process.env.RAILWAY_PUBLIC_DOMAIN;
        const fallback = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/api` : '';
        const baseUrl = apiUrl
            ? apiUrl.startsWith('http')
                ? apiUrl
                : `https://${apiUrl}`
            : fallback;
        if (!baseUrl) {
            return undefined;
        }
        return `${baseUrl.replace(/\/$/, '')}/v1/ops/unsubscribe/${preference.unsubscribeToken}`;
    }
    async broadcastGetUsers(segment) {
        const where = this.broadcastSegmentWhere(segment);
        const users = await this.prisma.user.findMany({
            where,
            select: { id: true, email: true },
            orderBy: { createdAt: 'asc' },
        });
        const optedIn = await Promise.all(users.map(async (user) => {
            const allowed = await this.isMarketingAllowed(user.id);
            return { ...user, marketingOptIn: allowed };
        }));
        return {
            total: users.length,
            eligible: optedIn.filter((u) => u.marketingOptIn).length,
            users: optedIn,
        };
    }
    async broadcastPreview(params) {
        const appUrl = process.env.FRONTEND_URL || 'https://slideai.fr';
        return buildBroadcastEmailContent({
            ...params,
            unsubscribeUrl: `${appUrl.replace(/\/$/, '')}/account`,
            footerReason: 'Vous recevez cet email car vous utilisez SlideAI et avez accepte les emails marketing.',
        });
    }
    async broadcastSend(params, adminEmail) {
        const { segment, ...emailParams } = params;
        const where = this.broadcastSegmentWhere(segment);
        const users = await this.prisma.user.findMany({
            where,
            select: { id: true, email: true },
        });
        const broadcastId = `broadcast_${Date.now()}`;
        const now = new Date();
        let sent = 0;
        let skipped = 0;
        const errors = [];
        for (const user of users) {
            const allowed = await this.isMarketingAllowed(user.id);
            const dedupeKey = `${broadcastId}_${user.id}`;
            if (!allowed) {
                await this.prisma.lifecycleEmailLog.create({
                    data: {
                        dedupeKey,
                        userId: user.id,
                        emailType: 'broadcast',
                        flowSlug: 'broadcast',
                        scheduledFor: now,
                        sentAt: now,
                        status: 'skipped',
                        payload: { broadcastId, segment, adminEmail, reason: 'marketing_opt_out' },
                    },
                });
                skipped++;
                continue;
            }
            const unsubscribeUrl = await this.getUnsubscribeUrl(user.id);
            const appUrl = process.env.FRONTEND_URL || 'https://slideai.fr';
            const { subject, html } = buildBroadcastEmailContent({
                ...emailParams,
                unsubscribeUrl: unsubscribeUrl || `${appUrl.replace(/\/$/, '')}/account`,
                footerReason: 'Vous recevez cet email car vous utilisez SlideAI et avez accepte les emails marketing.',
            });
            try {
                await sendLifecycleEmail({ to: user.email, subject, html });
                await this.prisma.lifecycleEmailLog.create({
                    data: {
                        dedupeKey,
                        userId: user.id,
                        emailType: 'broadcast',
                        flowSlug: 'broadcast',
                        scheduledFor: now,
                        sentAt: now,
                        status: 'sent',
                        payload: { broadcastId, segment, adminEmail },
                    },
                });
                sent++;
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                errors.push({ email: user.email, error: message });
                await this.prisma.lifecycleEmailLog.create({
                    data: {
                        dedupeKey,
                        userId: user.id,
                        emailType: 'broadcast',
                        flowSlug: 'broadcast',
                        scheduledFor: now,
                        sentAt: now,
                        status: 'failed',
                        payload: { broadcastId, segment, adminEmail, error: message },
                    },
                });
            }
        }
        return { broadcastId, segment, total: users.length, sent, skipped, errors };
    }
    broadcastSegmentWhere(segment) {
        if (segment === 'all')
            return {};
        if (segment === 'trialing') {
            return { Subscription: { status: 'trialing' } };
        }
        if (segment === 'trial_expired') {
            return { Subscription: { status: 'trial_expired' } };
        }
        if (segment === 'legacy_free') {
            return { Subscription: { legacyFree: true, plan: 'free' } };
        }
        if (segment === 'paid') {
            return { Subscription: { stripeSubscriptionId: { not: null }, status: { in: ['active', 'trialing'] } } };
        }
        return {};
    }
    async ensureCatalog() {
        const tenMinutes = 10 * 60 * 1000;
        if (this.catalogReadyAt && Date.now() - this.catalogReadyAt < tenMinutes) {
            return;
        }
        if (this.catalogPromise) {
            return this.catalogPromise;
        }
        this.catalogPromise = this.seedCatalog().finally(() => {
            this.catalogReadyAt = Date.now();
            this.catalogPromise = null;
        });
        return this.catalogPromise;
    }
    async seedCatalog() {
        const [templateCount, flowCount] = await Promise.all([
            this.prisma.opsEmailTemplate.count(),
            this.prisma.opsEmailFlow.count(),
        ]);
        if (templateCount < OPS_EMAIL_TEMPLATE_DEFINITIONS.length) {
            await this.prisma.opsEmailTemplate.createMany({
                data: OPS_EMAIL_TEMPLATE_DEFINITIONS.map((definition) => ({
                    slug: definition.slug,
                    name: definition.name,
                    category: definition.category,
                    locale: 'fr',
                    kind: definition.kind,
                    draftJson: {},
                    liveJson: {},
                })),
                skipDuplicates: true,
            });
        }
        if (flowCount < OPS_EMAIL_FLOW_DEFINITIONS.length) {
            await this.prisma.opsEmailFlow.createMany({
                data: OPS_EMAIL_FLOW_DEFINITIONS.map((definition) => ({
                    slug: definition.slug,
                    name: definition.name,
                    category: definition.category,
                    kind: definition.kind,
                    emailTypes: definition.emailTypes,
                    enabled: definition.defaultConfig.enabled,
                    timezone: definition.defaultConfig.timezone,
                    sendWindowStart: definition.defaultConfig.sendWindowStart,
                    sendWindowEnd: definition.defaultConfig.sendWindowEnd,
                    weekdaysOnly: definition.defaultConfig.weekdaysOnly,
                    draftConfig: definition.defaultConfig,
                    liveConfig: definition.defaultConfig,
                })),
                skipDuplicates: true,
            });
        }
    }
    async renderTemplate(slug, mode, fixtureOverrides) {
        const template = await this.prisma.opsEmailTemplate.findUnique({ where: { slug } });
        const definition = OPS_EMAIL_TEMPLATE_MAP[slug];
        if (!template || !definition) {
            throw new Error('Template introuvable');
        }
        const patch = (mode === 'draft' ? template.draftJson : template.liveJson) || {};
        const fixture = this.buildFixture(definition, fixtureOverrides);
        const preview = buildTrialEmailContent({
            emailType: slug,
            legacyFree: fixture.legacyFree,
            presentationCount: fixture.presentationCount,
            trialEndsAt: fixture.trialEndsAt,
            winbackOffer: fixture.winbackOffer,
            contentPatch: patch,
            unsubscribeUrl: fixture.unsubscribeUrl,
            footerReason: fixture.footerReason,
        });
        const model = buildLifecycleEmailModel({
            emailType: slug,
            legacyFree: fixture.legacyFree,
            presentationCount: fixture.presentationCount,
            trialEndsAt: fixture.trialEndsAt,
            winbackOffer: fixture.winbackOffer,
            contentPatch: patch,
            unsubscribeUrl: fixture.unsubscribeUrl,
            footerReason: fixture.footerReason,
        });
        if (!preview || !model) {
            throw new Error('Impossible de generer le preview');
        }
        return {
            subject: preview.subject,
            html: preview.html,
            model,
            fixture,
            version: mode === 'draft' ? template.draftVersion : template.liveVersion,
        };
    }
    buildFixture(definition, overrides) {
        const trialEndsAt = new Date(Date.now() + (overrides?.trialEndsAtOffsetDays ?? definition.sample.trialEndsAtOffsetDays ?? 7) * DAY_MS).toISOString();
        const footerReason = definition.kind === 'marketing'
            ? 'Vous recevez cet email car vous utilisez SlideAI et avez accepte les emails marketing.'
            : 'Vous recevez cet email car il est lie a votre compte SlideAI.';
        return {
            legacyFree: overrides?.legacyFree ?? definition.sample.legacyFree ?? false,
            presentationCount: overrides?.presentationCount ?? definition.sample.presentationCount ?? 0,
            trialEndsAt,
            winbackOffer: definition.slug === 'trial_winback_day2'
                ? {
                    code: 'TRIAL20-PREVIEW',
                    expiresAt: new Date(Date.now() + 72 * DAY_MS / 24).toISOString(),
                    percentOff: 20,
                    expiresInHours: 72,
                }
                : undefined,
            unsubscribeUrl: definition.kind === 'marketing' ? 'https://www.slideai.fr/account' : undefined,
            footerReason,
        };
    }
    async getFlowPerformanceSnapshot(since) {
        const rows = await this.prisma.lifecycleEmailLog.findMany({
            where: {
                createdAt: { gte: since },
            },
            select: {
                flowSlug: true,
                status: true,
            },
        });
        const acc = new Map();
        for (const row of rows) {
            const flowSlug = row.flowSlug || 'unclassified';
            const current = acc.get(flowSlug) || { flowSlug, sent: 0, skipped: 0, pending: 0 };
            if (row.status === 'sent')
                current.sent += 1;
            if (row.status === 'skipped')
                current.skipped += 1;
            if (row.status === 'pending')
                current.pending += 1;
            acc.set(flowSlug, current);
        }
        return Array.from(acc.values()).sort((a, b) => b.sent - a.sent);
    }
    async getStripeRevenueSnapshot(subscriptionIds) {
        const uniqueIds = Array.from(new Set(subscriptionIds.filter(Boolean)));
        if (!this.stripe || uniqueIds.length === 0) {
            return {
                mrrCents: uniqueIds.length * Number(process.env.OPS_PRO_MONTHLY_PRICE_CENTS || 2900),
                currency: 'eur',
            };
        }
        const subscriptions = await Promise.all(uniqueIds.map((subscriptionId) => this.stripe.subscriptions.retrieve(subscriptionId)));
        let mrrCents = 0;
        let currency = 'eur';
        for (const subscription of subscriptions) {
            if (!['active', 'trialing', 'past_due'].includes(subscription.status)) {
                continue;
            }
            for (const item of subscription.items.data) {
                const unitAmount = item.price.unit_amount || 0;
                const recurring = item.price.recurring;
                currency = item.price.currency || currency;
                if (!recurring || recurring.interval === 'month') {
                    mrrCents += Math.round(unitAmount / Math.max(recurring?.interval_count || 1, 1)) * (item.quantity || 1);
                    continue;
                }
                if (recurring.interval === 'year') {
                    mrrCents += Math.round(unitAmount / 12 / Math.max(recurring.interval_count || 1, 1)) * (item.quantity || 1);
                    continue;
                }
                mrrCents += unitAmount * (item.quantity || 1);
            }
        }
        return { mrrCents, currency };
    }
    async fetchGaOverview() {
        const propertyId = process.env.GA4_PROPERTY_ID;
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
        const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
        if (!propertyId || !clientEmail || !privateKey) {
            return {
                configured: false,
                source: 'ga4',
            };
        }
        const accessToken = await this.getGoogleAccessToken(clientEmail, privateKey);
        const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
                metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
            }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            return {
                configured: true,
                source: 'ga4',
                error: errorBody,
            };
        }
        const body = await response.json();
        const metrics = body.rows?.[0]?.metricValues || [];
        return {
            configured: true,
            source: 'ga4',
            sessions30d: Number(metrics[0]?.value || 0),
            users30d: Number(metrics[1]?.value || 0),
            pageViews30d: Number(metrics[2]?.value || 0),
            vercelClientEnabled: true,
        };
    }
    async getGoogleAccessToken(clientEmail, privateKey) {
        const now = Math.floor(Date.now() / 1000);
        const assertion = jwt.sign({
            iss: clientEmail,
            scope: 'https://www.googleapis.com/auth/analytics.readonly',
            aud: 'https://oauth2.googleapis.com/token',
            iat: now,
            exp: now + 3600,
        }, privateKey, { algorithm: 'RS256' });
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion,
            }),
        });
        if (!response.ok) {
            throw new Error(`Google token error: ${await response.text()}`);
        }
        const body = await response.json();
        return body.access_token;
    }
};
OpsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [PrismaService])
], OpsService);
export { OpsService };
