import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import {
  OPS_EMAIL_FLOW_DEFINITIONS,
  OPS_EMAIL_FLOW_MAP,
  OPS_EMAIL_TEMPLATE_DEFINITIONS,
  OPS_EMAIL_TEMPLATE_MAP,
} from './ops-email-catalog.js';
import {
  buildBroadcastEmailContent,
  buildLifecycleEmailModel,
  buildTrialEmailContent,
  sendLifecycleEmail,
  type BroadcastEmailParams,
  type EmailContentPatch,
  type WinbackOffer,
} from './ops-email-renderer.js';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';

const DAY_MS = 24 * 60 * 60 * 1000;

type TemplateMode = 'draft' | 'live';

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

const MONEY_FUNNEL_GA_EVENTS = ['View Pricing', 'Select Plan', 'begin_checkout', 'purchase'];
const SEO_FUNNEL_EVENTS = [
  'blog_cta_click',
  'create_started',
  'deck_generated',
  'activation_completed',
  'deck_exported',
  'export_clicked',
  'paywall_view',
  'paywall_cta_click',
  'begin_checkout',
  'purchase',
];

type GoogleAnalyticsCredentials = {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
};

@Injectable()
export class OpsService {
  private readonly stripe: Stripe | null;
  private catalogReadyAt: number | null = null;
  private catalogPromise: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    this.stripe = stripeSecretKey
      ? new Stripe(stripeSecretKey, {
          apiVersion: '2024-12-18.acacia' as any,
        })
      : null;
  }

  async getOpsSession(email: string) {
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
      .filter((value): value is string => Boolean(value));

    const revenue = await this.getStripeRevenueSnapshot(paidSubscriptionIds);

    const activatedUserIds30d = new Set(
      (
        await this.prisma.presentations.findMany({
          where: {
            created_at: { gte: since30d },
            user_id: {
              in: activatedUsers30d.map((user) => user.id),
            },
          },
          select: { user_id: true },
          distinct: ['user_id'],
        })
      ).map((item) => item.user_id),
    );

    const activationRate30d =
      activatedUsers30d.length > 0
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

  async getMoneyFunnel(days = 30) {
    const clampedDays = Math.min(Math.max(Number.isFinite(days) ? days : 30, 1), 180);
    const since = new Date(Date.now() - clampedDays * DAY_MS);

    const authRows = await this.prisma.$queryRaw<Array<{
      signups: bigint;
      confirmed: bigint;
    }>>`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= ${since}) AS signups,
        COUNT(*) FILTER (
          WHERE created_at >= ${since}
          AND COALESCE(email_confirmed_at, confirmed_at) IS NOT NULL
        ) AS confirmed
      FROM auth.users
    `;
    const auth = authRows[0] || { signups: 0, confirmed: 0 };

    const [
      trialUsers,
      firstDeckUsers,
      paidStripeUsers,
      manualProUsers,
      packUsers,
      productEvents,
      ga,
    ] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { trialStartedAt: { gte: since } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.presentations.findMany({
        where: { created_at: { gte: since } },
        select: { user_id: true },
        distinct: ['user_id'],
      }),
      this.prisma.subscription.findMany({
        where: {
          stripeSubscriptionId: { not: null },
          status: { in: ['active', 'trialing', 'past_due'] },
        },
        select: { userId: true },
      }),
      this.prisma.subscription.count({
        where: {
          plan: 'pro',
          status: 'active',
          stripeSubscriptionId: null,
        },
      }),
      this.prisma.subscription.count({
        where: {
          plan: 'free',
          legacyFree: false,
          stripeSubscriptionId: null,
          creditsRemaining: { gt: 0 },
        },
      }),
      this.prisma.productEvent.findMany({
        where: {
          occurredAt: { gte: since },
          eventName: {
            in: [
              'activation_completed',
              'deck_exported',
              'export_clicked',
              'paywall_view',
              'paywall_cta_click',
              'begin_checkout',
              'purchase',
            ],
          },
        },
        select: {
          eventName: true,
          userId: true,
          properties: true,
        },
      }),
      this.fetchGaMoneyFunnel(clampedDays).catch((error) => ({
        configured: false,
        source: 'ga4',
        error: error instanceof Error ? error.message : 'ga_fetch_failed',
        activeUsers: 0,
        sessions: 0,
        pageViews: 0,
        events: {},
      })),
    ]);

    const usersByEvent = new Map<string, Set<string>>();
    let revenueCents = 0;
    let currency = 'eur';

    for (const event of productEvents) {
      const set = usersByEvent.get(event.eventName) || new Set<string>();
      set.add(event.userId);
      usersByEvent.set(event.eventName, set);

      if (event.eventName === 'purchase') {
        const properties = event.properties && typeof event.properties === 'object'
          ? (event.properties as Record<string, any>)
          : {};
        const value = Number(properties.value || 0);
        if (Number.isFinite(value) && value > 0) {
          revenueCents += Math.round(value * 100);
        }
        if (typeof properties.currency === 'string') {
          currency = properties.currency.toLowerCase();
        }
      }
    }

    const getEventUsers = (eventName: string) => usersByEvent.get(eventName)?.size || 0;
    const exportUsers = new Set<string>();
    for (const eventName of ['activation_completed', 'deck_exported', 'export_clicked']) {
      for (const userId of usersByEvent.get(eventName) || []) {
        exportUsers.add(userId);
      }
    }
    const paywallViewUsers = getEventUsers('paywall_view');
    const paywallClickUsers = getEventUsers('paywall_cta_click');

    const gaEvents = ga.events as Record<string, { activeUsers: number; eventCount: number }> | undefined;
    const pricingUsers = gaEvents?.['View Pricing']?.activeUsers || 0;
    const selectPlanUsers = gaEvents?.['Select Plan']?.activeUsers || 0;
    const checkoutUsers = Math.max(getEventUsers('begin_checkout'), gaEvents?.begin_checkout?.activeUsers || 0);
    const purchaseUsers = Math.max(getEventUsers('purchase'), gaEvents?.purchase?.activeUsers || 0);

    const rawStages = [
      {
        key: 'visitors',
        label: 'Visiteurs site',
        description: 'Utilisateurs actifs GA4 sur la période.',
        value: Number(ga.activeUsers || 0),
        source: ga.configured ? 'GA4' : 'GA4 non configuré',
      },
      {
        key: 'signups',
        label: 'Comptes créés',
        description: 'Nouveaux comptes Supabase.',
        value: Number(auth.signups || 0),
        source: 'Supabase Auth',
      },
      {
        key: 'confirmed',
        label: 'Emails confirmés',
        description: 'Comptes avec email confirmé.',
        value: Number(auth.confirmed || 0),
        source: 'Supabase Auth',
      },
      {
        key: 'trials',
        label: 'Essais activés',
        description: 'Utilisateurs qui ont démarré le trial.',
        value: trialUsers.length,
        source: 'Subscription',
      },
      {
        key: 'first_deck',
        label: '1er deck créé',
        description: 'Utilisateurs ayant créé au moins une présentation.',
        value: firstDeckUsers.length,
        source: 'Presentations',
      },
      {
        key: 'export_or_share',
        label: 'Export / partage',
        description: 'Signal fort de valeur perçue.',
        value: exportUsers.size,
        source: 'Product events',
      },
      {
        key: 'upgrade_prompt',
        label: 'Upsell Pro vu',
        description: 'Utilisateurs exposes au bandeau ou callout Pro apres valeur.',
        value: paywallViewUsers,
        source: 'Product events',
      },
      {
        key: 'upgrade_clicked',
        label: 'Upsell Pro clique',
        description: 'Clic sur une proposition Pro in-app.',
        value: paywallClickUsers,
        source: 'Product events',
      },
      {
        key: 'pricing_view',
        label: 'Tarifs vus',
        description: 'Utilisateurs exposés à la page pricing.',
        value: pricingUsers,
        source: 'GA4 event',
      },
      {
        key: 'plan_selected',
        label: 'Plan cliqué',
        description: 'Intention de payer.',
        value: selectPlanUsers,
        source: 'GA4 event',
      },
      {
        key: 'checkout',
        label: 'Checkout lancé',
        description: 'Redirection Stripe ouverte.',
        value: checkoutUsers,
        source: 'Product event + GA4',
      },
      {
        key: 'paid',
        label: 'Paiement réussi',
        description: 'Achat ou retour Stripe tracké.',
        value: purchaseUsers,
        source: 'Product event + GA4',
      },
    ];

    const firstValue = rawStages[0]?.value || 0;
    let previousValue = firstValue;
    const stages = rawStages.map((stage, index) => {
      const fromPrevious = index === 0 ? 100 : this.toPercent(stage.value, previousValue);
      const fromStart = index === 0 ? 100 : this.toPercent(stage.value, firstValue);
      const dropoff = index === 0 ? 0 : Math.max(0, 100 - fromPrevious);
      const previous = previousValue;
      previousValue = stage.value;

      return {
        ...stage,
        previous,
        fromPrevious,
        fromStart,
        dropoff: Math.round(dropoff * 10) / 10,
      };
    });

    const bottleneck = stages
      .slice(1)
      .filter((stage) => stage.previous > 0)
      .sort((a, b) => b.dropoff - a.dropoff)[0] || null;

    return {
      days: clampedDays,
      generatedAt: new Date().toISOString(),
      acquisition: ga,
      summary: {
        visitors: stages[0]?.value || 0,
        signups: Number(auth.signups || 0),
        confirmed: Number(auth.confirmed || 0),
        trials: trialUsers.length,
        firstDecks: firstDeckUsers.length,
        exports: exportUsers.size,
        pricingViews: pricingUsers,
        planClicks: selectPlanUsers,
        checkouts: checkoutUsers,
        purchases: purchaseUsers,
        currentPaidStripe: paidStripeUsers.length,
        currentManualPro: manualProUsers,
        currentPackUsers: packUsers,
        revenueCents,
        currency,
      },
      bottleneck: bottleneck
        ? {
            key: bottleneck.key,
            label: bottleneck.label,
            dropoff: bottleneck.dropoff,
            fromPrevious: bottleneck.fromPrevious,
            previous: bottleneck.previous,
            value: bottleneck.value,
          }
        : null,
      recommendation: this.buildMoneyFunnelRecommendation(bottleneck?.key),
      stages,
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

  async getTemplate(slug: string) {
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

  async updateTemplate(slug: string, input: { draftJson?: EmailContentPatch | null }, editorEmail: string) {
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

  async publishTemplate(slug: string, editorEmail: string) {
    await this.ensureCatalog();
    const template = await this.prisma.opsEmailTemplate.findUnique({ where: { slug } });
    if (!template) {
      throw new Error('Template introuvable');
    }

    return this.prisma.opsEmailTemplate.update({
      where: { slug },
      data: {
        liveJson: (template.draftJson ?? {}) as any,
        liveVersion: template.draftVersion,
        updatedBy: editorEmail,
      },
    });
  }

  async previewTemplate(slug: string, mode: TemplateMode, fixtureOverrides?: Record<string, any>) {
    await this.ensureCatalog();
    return this.renderTemplate(slug, mode, fixtureOverrides);
  }

  async sendTemplateTest(slug: string, mode: TemplateMode, to: string, fixtureOverrides?: Record<string, any>) {
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

  async updateFlow(
    slug: string,
    input: {
      enabled?: boolean;
      timezone?: string;
      sendWindowStart?: string;
      sendWindowEnd?: string;
      weekdaysOnly?: boolean;
      draftConfig?: Record<string, any>;
    },
    editorEmail: string,
  ) {
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

  async publishFlow(slug: string, editorEmail: string) {
    await this.ensureCatalog();
    const flow = await this.prisma.opsEmailFlow.findUnique({ where: { slug } });
    if (!flow) {
      throw new Error('Flow introuvable');
    }

    return this.prisma.opsEmailFlow.update({
      where: { slug },
      data: {
        liveConfig: (flow.draftConfig ?? {}) as any,
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

    type FunnelRow = {
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
    };

    const rows = new Map<string, FunnelRow>();

    for (const log of logs) {
      const key = log.emailType;
      const payload = log.payload && typeof log.payload === 'object' ? (log.payload as Record<string, any>) : {};
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
      if (log.status === 'sent') current.sent += 1;
      if (log.status === 'skipped') current.skipped += 1;
      if (log.status === 'pending') current.pending += 1;

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

    const totals = items.reduce(
      (acc, row) => {
        acc.scheduled += row.scheduled;
        acc.sent += row.sent;
        acc.skipped += row.skipped;
        acc.pending += row.pending;
        acc.clicked += row.clicked;
        acc.converted += row.converted;
        acc.revenueCents += row.revenueCents;
        acc.currency = row.currency || acc.currency;
        return acc;
      },
      {
        scheduled: 0,
        sent: 0,
        skipped: 0,
        pending: 0,
        clicked: 0,
        converted: 0,
        revenueCents: 0,
        currency: 'eur',
      },
    );

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

    const usersByStage = new Map<string, Set<string>>();
    const eventCountByStage = new Map<string, number>();
    const useCases = new Map<string, { useCase: string; selected: number; created: number; completed: number }>();
    const firstSeen = new Map<string, Date>();
    let revenueCents = 0;
    let revenueCurrency = 'eur';

    for (const event of events) {
      const stageUsers = usersByStage.get(event.eventName) || new Set<string>();
      stageUsers.add(event.userId);
      usersByStage.set(event.eventName, stageUsers);
      eventCountByStage.set(event.eventName, (eventCountByStage.get(event.eventName) || 0) + 1);

      const previousFirstSeen = firstSeen.get(event.userId);
      if (!previousFirstSeen || event.occurredAt < previousFirstSeen) {
        firstSeen.set(event.userId, event.occurredAt);
      }

      const properties = event.properties && typeof event.properties === 'object'
        ? (event.properties as Record<string, any>)
        : {};
      const useCase = typeof properties.use_case === 'string' ? properties.use_case : undefined;

      if (useCase) {
        const row = useCases.get(useCase) || { useCase, selected: 0, created: 0, completed: 0 };
        if (event.eventName === 'activation_use_case_selected') row.selected += 1;
        if (event.eventName === 'create_started') row.created += 1;
        if (event.eventName === 'activation_completed') row.completed += 1;
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

  async getSeoBlogFunnel(days = 30) {
    const clampedDays = Math.min(Math.max(Number.isFinite(days) ? days : 30, 1), 180);
    const since = new Date(Date.now() - clampedDays * DAY_MS);

    const [events, ga] = await Promise.all([
      this.prisma.productEvent.findMany({
        where: {
          occurredAt: { gte: since },
          eventName: { in: SEO_FUNNEL_EVENTS },
        },
        select: {
          userId: true,
          eventName: true,
          properties: true,
          occurredAt: true,
        },
        orderBy: { occurredAt: 'asc' },
      }),
      this.fetchGaSeoBlogFunnel(clampedDays).catch((error) => ({
        configured: false,
        source: 'ga4',
        error: error instanceof Error ? error.message : 'ga_fetch_failed',
        articleUsers: 0,
        articleViews: 0,
        articleSessions: 0,
        ctaClicks: { eventCount: 0, activeUsers: 0 },
        createFromBlog: { activeUsers: 0, pageViews: 0 },
        articles: [],
      })),
    ]);

    const usersByStage = new Map<string, Set<string>>();
    const eventsByStage = new Map<string, number>();
    const articleRows = new Map<string, {
      slug: string;
      ctaClicks: number;
      ctaUsers: Set<string>;
      createStarted: Set<string>;
      generated: Set<string>;
      activated: Set<string>;
      exported: Set<string>;
      paywall: Set<string>;
      checkout: Set<string>;
      purchase: Set<string>;
    }>();
    const placements = new Map<string, { placement: string; clicks: number; users: Set<string> }>();
    const blogTouchedUsers = new Set<string>();
    const blogAttributionByUser = new Map<string, { slug: string; placement?: string }>();

    const ensureArticle = (slug: string) => {
      const safeSlug = slug || 'unknown';
      const existing = articleRows.get(safeSlug);
      if (existing) return existing;

      const row = {
        slug: safeSlug,
        ctaClicks: 0,
        ctaUsers: new Set<string>(),
        createStarted: new Set<string>(),
        generated: new Set<string>(),
        activated: new Set<string>(),
        exported: new Set<string>(),
        paywall: new Set<string>(),
        checkout: new Set<string>(),
        purchase: new Set<string>(),
      };
      articleRows.set(safeSlug, row);
      return row;
    };

    for (const event of events) {
      const properties = event.properties && typeof event.properties === 'object'
        ? (event.properties as Record<string, any>)
        : {};
      const attribution = this.extractBlogAttribution(properties);
      const isBlogAttributed = Boolean(attribution.slug);
      const knownAttribution = blogAttributionByUser.get(event.userId);
      const isKnownBlogUser = blogTouchedUsers.has(event.userId);

      if (event.eventName === 'blog_cta_click' && attribution.slug) {
        blogTouchedUsers.add(event.userId);
        blogAttributionByUser.set(event.userId, {
          slug: attribution.slug,
          placement: attribution.placement,
        });
      }

      if (!isBlogAttributed && !isKnownBlogUser) {
        continue;
      }

      const effectiveAttribution = attribution.slug ? attribution : knownAttribution;

      const stageUsers = usersByStage.get(event.eventName) || new Set<string>();
      stageUsers.add(event.userId);
      usersByStage.set(event.eventName, stageUsers);
      eventsByStage.set(event.eventName, (eventsByStage.get(event.eventName) || 0) + 1);

      const row = ensureArticle(effectiveAttribution?.slug || 'post_not_captured');
      if (event.eventName === 'blog_cta_click') {
        row.ctaClicks += 1;
        row.ctaUsers.add(event.userId);
        const placement = effectiveAttribution?.placement || 'unknown';
        const placementRow = placements.get(placement) || { placement, clicks: 0, users: new Set<string>() };
        placementRow.clicks += 1;
        placementRow.users.add(event.userId);
        placements.set(placement, placementRow);
      }
      if (event.eventName === 'create_started') row.createStarted.add(event.userId);
      if (event.eventName === 'deck_generated') row.generated.add(event.userId);
      if (event.eventName === 'activation_completed') row.activated.add(event.userId);
      if (event.eventName === 'deck_exported' || event.eventName === 'export_clicked') row.exported.add(event.userId);
      if (event.eventName === 'paywall_view' || event.eventName === 'paywall_cta_click') row.paywall.add(event.userId);
      if (event.eventName === 'begin_checkout') row.checkout.add(event.userId);
      if (event.eventName === 'purchase') row.purchase.add(event.userId);
    }

    const exportUsers = new Set<string>();
    for (const eventName of ['activation_completed', 'deck_exported', 'export_clicked']) {
      for (const userId of usersByStage.get(eventName) || []) {
        exportUsers.add(userId);
      }
    }

    const paywallUsers = new Set<string>();
    for (const eventName of ['paywall_view', 'paywall_cta_click']) {
      for (const userId of usersByStage.get(eventName) || []) {
        paywallUsers.add(userId);
      }
    }

    const rawStages = [
      {
        key: 'article_view',
        label: 'Articles vus',
        description: 'Lecteurs organiques ou directs sur les articles du blog.',
        value: Number(ga.articleUsers || 0),
        events: Number(ga.articleViews || 0),
        source: ga.configured ? 'GA4 pages' : 'GA4 non configure',
      },
      {
        key: 'blog_cta_click',
        label: 'CTA blog clique',
        description: 'Clic sur le CTA article vers creation.',
        value: Number(ga.ctaClicks?.activeUsers || 0) || (usersByStage.get('blog_cta_click')?.size || 0),
        events: Number(ga.ctaClicks?.eventCount || 0) || (eventsByStage.get('blog_cta_click') || 0),
        source: ga.configured ? 'GA4 event' : 'Product events',
      },
      {
        key: 'create_opened',
        label: '/create ouvert',
        description: 'Page creation ouverte avec UTM blog.',
        value: Number(ga.createFromBlog?.activeUsers || 0),
        events: Number(ga.createFromBlog?.pageViews || 0),
        source: ga.configured ? 'GA4 UTM' : 'GA4 non configure',
      },
      {
        key: 'create_started',
        label: 'Generation lancee',
        description: 'Utilisateur blog qui lance une generation.',
        value: usersByStage.get('create_started')?.size || 0,
        events: eventsByStage.get('create_started') || 0,
        source: 'Product events',
      },
      {
        key: 'deck_generated',
        label: 'Deck genere',
        description: 'Presentation creee apres un passage blog.',
        value: usersByStage.get('deck_generated')?.size || 0,
        events: eventsByStage.get('deck_generated') || 0,
        source: 'Product events',
      },
      {
        key: 'export_or_value',
        label: 'Export / valeur',
        description: 'Export, partage ou activation complete.',
        value: exportUsers.size,
        events:
          (eventsByStage.get('activation_completed') || 0) +
          (eventsByStage.get('deck_exported') || 0) +
          (eventsByStage.get('export_clicked') || 0),
        source: 'Product events',
      },
      {
        key: 'paywall',
        label: 'Paywall / upsell',
        description: 'Exposition ou clic vers une offre payante.',
        value: paywallUsers.size,
        events: (eventsByStage.get('paywall_view') || 0) + (eventsByStage.get('paywall_cta_click') || 0),
        source: 'Product events',
      },
      {
        key: 'checkout',
        label: 'Checkout lance',
        description: 'Stripe ouvert par un utilisateur touche par le blog.',
        value: usersByStage.get('begin_checkout')?.size || 0,
        events: eventsByStage.get('begin_checkout') || 0,
        source: 'Product events',
      },
      {
        key: 'purchase',
        label: 'Paiement reussi',
        description: 'Paiement attribuable a un utilisateur touche par le blog.',
        value: usersByStage.get('purchase')?.size || 0,
        events: eventsByStage.get('purchase') || 0,
        source: 'Product events',
      },
    ];

    const firstValue = rawStages[0]?.value || 0;
    let previousValue = firstValue;
    const stages = rawStages.map((stage, index) => {
      const fromPrevious = index === 0 ? 100 : this.toPercent(stage.value, previousValue);
      const fromStart = index === 0 ? 100 : this.toPercent(stage.value, firstValue);
      const dropoff = index === 0 ? 0 : Math.max(0, 100 - fromPrevious);
      const previous = previousValue;
      previousValue = stage.value;

      return {
        ...stage,
        previous,
        fromPrevious,
        fromStart,
        dropoff: Math.round(dropoff * 10) / 10,
      };
    });

    const gaArticleMap = new Map<string, any>(
      (ga.articles || []).map((article: any) => [article.slug, article]),
    );

    const articles = Array.from(new Set([
      ...Array.from(gaArticleMap.keys()),
      ...Array.from(articleRows.keys()),
    ])).map((slug) => {
      const gaArticle = gaArticleMap.get(slug) || {};
      const row = articleRows.get(slug);
      const articleUsers = Number(gaArticle.activeUsers || 0);
      const ctaClicks = row?.ctaClicks || 0;

      return {
        slug,
        path: gaArticle.path || `/blog/${slug}`,
        views: Number(gaArticle.views || 0),
        users: articleUsers,
        sessions: Number(gaArticle.sessions || 0),
        ctaClicks,
        ctaUsers: row?.ctaUsers.size || 0,
        ctaRate: this.toPercent(row?.ctaUsers.size || 0, articleUsers),
        createStarted: row?.createStarted.size || 0,
        generated: row?.generated.size || 0,
        activated: row?.activated.size || 0,
        exported: row?.exported.size || 0,
        paywall: row?.paywall.size || 0,
        checkout: row?.checkout.size || 0,
        purchase: row?.purchase.size || 0,
      };
    }).sort((a, b) => b.users - a.users || b.ctaClicks - a.ctaClicks || b.generated - a.generated);

    const bottleneck = stages
      .slice(1)
      .filter((stage) => stage.previous > 0)
      .sort((a, b) => b.dropoff - a.dropoff)[0] || null;

    return {
      days: clampedDays,
      generatedAt: new Date().toISOString(),
      ga,
      summary: {
        articleUsers: Number(ga.articleUsers || 0),
        articleViews: Number(ga.articleViews || 0),
        ctaUsers: stages[1]?.value || 0,
        ctaClicks: stages[1]?.events || 0,
        createFromBlogUsers: stages[2]?.value || 0,
        createStartedUsers: stages[3]?.value || 0,
        generatedUsers: stages[4]?.value || 0,
        exportUsers: stages[5]?.value || 0,
        paywallUsers: stages[6]?.value || 0,
        checkoutUsers: stages[7]?.value || 0,
        purchaseUsers: stages[8]?.value || 0,
      },
      stages,
      articles: articles.slice(0, 20),
      placements: Array.from(placements.values())
        .map((row) => ({ placement: row.placement, clicks: row.clicks, users: row.users.size }))
        .sort((a, b) => b.clicks - a.clicks),
      bottleneck: bottleneck
        ? {
            key: bottleneck.key,
            label: bottleneck.label,
            dropoff: bottleneck.dropoff,
            fromPrevious: bottleneck.fromPrevious,
            previous: bottleneck.previous,
            value: bottleneck.value,
          }
        : null,
      recommendation: this.buildSeoFunnelRecommendation(bottleneck?.key),
    };
  }

  private toPercent(numerator: number, denominator: number) {
    if (!denominator) return 0;
    return Math.round((numerator / denominator) * 1000) / 10;
  }

  async unsubscribeByToken(token: string) {
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

  async getTemplateRuntime(slug: string) {
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
      liveJson: (template.liveJson as Record<string, any> | null) || {},
    };
  }

  async getFlowRuntimeByEmailType(emailType: string) {
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
      config: (flow.liveConfig as Record<string, any> | null) || {},
    };
  }

  async ensureEmailPreference(userId: string) {
    return this.prisma.opsEmailPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async isMarketingAllowed(userId: string) {
    const preference = await this.ensureEmailPreference(userId);
    return preference.marketingOptIn;
  }

  async getUnsubscribeUrl(userId: string) {
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

  async broadcastGetUsers(segment: 'all' | 'trialing' | 'trial_expired' | 'legacy_free' | 'paid') {
    const where = this.broadcastSegmentWhere(segment);
    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, email: true },
      orderBy: { createdAt: 'asc' },
    });

    const optedIn = await Promise.all(
      users.map(async (user) => {
        const allowed = await this.isMarketingAllowed(user.id);
        return { ...user, marketingOptIn: allowed };
      }),
    );

    return {
      total: users.length,
      eligible: optedIn.filter((u) => u.marketingOptIn).length,
      users: optedIn,
    };
  }

  async broadcastPreview(params: Omit<BroadcastEmailParams, 'unsubscribeUrl' | 'footerReason'>) {
    const appUrl = process.env.FRONTEND_URL || 'https://slideai.fr';
    return buildBroadcastEmailContent({
      ...params,
      unsubscribeUrl: `${appUrl.replace(/\/$/, '')}/account`,
      footerReason: 'Vous recevez cet email car vous utilisez SlideAI et avez accepte les emails marketing.',
    });
  }

  async broadcastSend(
    params: Omit<BroadcastEmailParams, 'unsubscribeUrl' | 'footerReason'> & {
      segment: 'all' | 'trialing' | 'trial_expired' | 'legacy_free' | 'paid';
    },
    adminEmail: string,
  ) {
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
    const errors: { email: string; error: string }[] = [];

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
      } catch (err) {
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

  private broadcastSegmentWhere(segment: 'all' | 'trialing' | 'trial_expired' | 'legacy_free' | 'paid') {
    if (segment === 'all') return {};

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

  private async ensureCatalog() {
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

  private async seedCatalog() {
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

  private async renderTemplate(slug: string, mode: TemplateMode, fixtureOverrides?: Record<string, any>) {
    const template = await this.prisma.opsEmailTemplate.findUnique({ where: { slug } });
    const definition = OPS_EMAIL_TEMPLATE_MAP[slug];

    if (!template || !definition) {
      throw new Error('Template introuvable');
    }

    const patch = ((mode === 'draft' ? template.draftJson : template.liveJson) as EmailContentPatch | null) || {};
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

  private buildFixture(definition: (typeof OPS_EMAIL_TEMPLATE_DEFINITIONS)[number], overrides?: Record<string, any>) {
    const trialEndsAt = new Date(
      Date.now() + (overrides?.trialEndsAtOffsetDays ?? definition.sample.trialEndsAtOffsetDays ?? 7) * DAY_MS,
    ).toISOString();

    const footerReason =
      definition.kind === 'marketing'
        ? 'Vous recevez cet email car vous utilisez SlideAI et avez accepte les emails marketing.'
        : 'Vous recevez cet email car il est lie a votre compte SlideAI.';

    return {
      legacyFree: overrides?.legacyFree ?? definition.sample.legacyFree ?? false,
      presentationCount: overrides?.presentationCount ?? definition.sample.presentationCount ?? 0,
      trialEndsAt,
      winbackOffer:
        definition.slug === 'trial_winback_day2'
          ? ({
              code: 'TRIAL20-PREVIEW',
              expiresAt: new Date(Date.now() + 72 * DAY_MS / 24).toISOString(),
              percentOff: 20,
              expiresInHours: 72,
            } satisfies WinbackOffer)
          : undefined,
      unsubscribeUrl: definition.kind === 'marketing' ? 'https://www.slideai.fr/account' : undefined,
      footerReason,
    };
  }

  private async getFlowPerformanceSnapshot(since: Date) {
    const rows = await this.prisma.lifecycleEmailLog.findMany({
      where: {
        createdAt: { gte: since },
      },
      select: {
        flowSlug: true,
        status: true,
      },
    });

    const acc = new Map<string, { flowSlug: string; sent: number; skipped: number; pending: number }>();

    for (const row of rows) {
      const flowSlug = row.flowSlug || 'unclassified';
      const current = acc.get(flowSlug) || { flowSlug, sent: 0, skipped: 0, pending: 0 };

      if (row.status === 'sent') current.sent += 1;
      if (row.status === 'skipped') current.skipped += 1;
      if (row.status === 'pending') current.pending += 1;

      acc.set(flowSlug, current);
    }

    return Array.from(acc.values()).sort((a, b) => b.sent - a.sent);
  }

  private async getStripeRevenueSnapshot(subscriptionIds: string[]) {
    const uniqueIds = Array.from(new Set(subscriptionIds.filter(Boolean)));

    if (!this.stripe || uniqueIds.length === 0) {
      return {
        mrrCents: uniqueIds.length * Number(process.env.OPS_PRO_MONTHLY_PRICE_CENTS || 2900),
        currency: 'eur',
      };
    }

    const subscriptions = await Promise.all(
      uniqueIds.map((subscriptionId) => this.stripe!.subscriptions.retrieve(subscriptionId)),
    );

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

  private async fetchGaOverview() {
    const credentials = this.getGoogleAnalyticsCredentials();

    if (!credentials) {
      return {
        configured: false,
        source: 'ga4',
      };
    }

    const accessToken = await this.getGoogleAccessToken(credentials.clientEmail, credentials.privateKey);
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${credentials.propertyId}:runReport`, {
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

  private async fetchGaMoneyFunnel(days: number) {
    const credentials = this.getGoogleAnalyticsCredentials();

    if (!credentials) {
      return {
        configured: false,
        source: 'ga4',
        activeUsers: 0,
        sessions: 0,
        pageViews: 0,
        events: {},
      };
    }

    const accessToken = await this.getGoogleAccessToken(credentials.clientEmail, credentials.privateKey);
    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const runReport = async (body: Record<string, any>) => {
      const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${credentials.propertyId}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`GA4 report error: ${await response.text()}`);
      }

      return response.json();
    };

    const [overview, events] = await Promise.all([
      runReport({
        dateRanges,
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
      }),
      runReport({
        dateRanges,
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: MONEY_FUNNEL_GA_EVENTS,
            },
          },
        },
      }),
    ]);

    const overviewMetrics = overview.rows?.[0]?.metricValues || [];
    const eventMap: Record<string, { eventCount: number; activeUsers: number }> = {};

    for (const row of events.rows || []) {
      const eventName = row.dimensionValues?.[0]?.value;
      if (!eventName) continue;
      eventMap[eventName] = {
        eventCount: Number(row.metricValues?.[0]?.value || 0),
        activeUsers: Number(row.metricValues?.[1]?.value || 0),
      };
    }

    return {
      configured: true,
      source: 'ga4',
      activeUsers: Number(overviewMetrics[0]?.value || 0),
      sessions: Number(overviewMetrics[1]?.value || 0),
      pageViews: Number(overviewMetrics[2]?.value || 0),
      events: eventMap,
    };
  }

  private async fetchGaSeoBlogFunnel(days: number) {
    const credentials = this.getGoogleAnalyticsCredentials();

    if (!credentials) {
      return {
        configured: false,
        source: 'ga4',
        articleUsers: 0,
        articleViews: 0,
        articleSessions: 0,
        ctaClicks: { eventCount: 0, activeUsers: 0 },
        createFromBlog: { activeUsers: 0, pageViews: 0 },
        articles: [],
      };
    }

    const accessToken = await this.getGoogleAccessToken(credentials.clientEmail, credentials.privateKey);
    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const runReport = async (body: Record<string, any>) => {
      const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${credentials.propertyId}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`GA4 report error: ${await response.text()}`);
      }

      return response.json();
    };

    const [articlesReport, ctaReport, createReport] = await Promise.all([
      runReport({
        dateRanges,
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'sessions' }],
        limit: 50,
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'BEGINS_WITH',
              value: '/blog/',
            },
          },
        },
      }),
      runReport({
        dateRanges,
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }, { name: 'activeUsers' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: {
              matchType: 'EXACT',
              value: 'blog_cta_click',
            },
          },
        },
      }),
      runReport({
        dateRanges,
        dimensions: [{ name: 'pagePathPlusQueryString' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        limit: 50,
        dimensionFilter: {
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'pagePathPlusQueryString',
                  stringFilter: {
                    matchType: 'CONTAINS',
                    value: '/create',
                  },
                },
              },
              {
                filter: {
                  fieldName: 'pagePathPlusQueryString',
                  stringFilter: {
                    matchType: 'CONTAINS',
                    value: 'utm_source=blog',
                  },
                },
              },
            ],
          },
        },
      }),
    ]);

    const articles = (articlesReport.rows || [])
      .map((row: any) => {
        const path = row.dimensionValues?.[0]?.value || '';
        const slug = this.extractBlogSlugFromPath(path);

        return {
          path,
          slug,
          views: Number(row.metricValues?.[0]?.value || 0),
          activeUsers: Number(row.metricValues?.[1]?.value || 0),
          sessions: Number(row.metricValues?.[2]?.value || 0),
        };
      })
      .filter((row: any) => row.slug)
      .sort((a: any, b: any) => b.activeUsers - a.activeUsers || b.views - a.views);

    const ctaMetrics = ctaReport.rows?.[0]?.metricValues || [];
    const createTotals = (createReport.rows || []).reduce(
      (acc: { pageViews: number; activeUsers: number }, row: any) => {
        acc.pageViews += Number(row.metricValues?.[0]?.value || 0);
        acc.activeUsers += Number(row.metricValues?.[1]?.value || 0);
        return acc;
      },
      { pageViews: 0, activeUsers: 0 },
    );

    return {
      configured: true,
      source: 'ga4',
      articleUsers: articles.reduce((sum: number, row: any) => sum + row.activeUsers, 0),
      articleViews: articles.reduce((sum: number, row: any) => sum + row.views, 0),
      articleSessions: articles.reduce((sum: number, row: any) => sum + row.sessions, 0),
      ctaClicks: {
        eventCount: Number(ctaMetrics[0]?.value || 0),
        activeUsers: Number(ctaMetrics[1]?.value || 0),
      },
      createFromBlog: createTotals,
      articles,
    };
  }

  private extractBlogAttribution(properties: Record<string, any>) {
    const explicitSlug = typeof properties.post_slug === 'string' ? properties.post_slug : '';
    const explicitPlacement = typeof properties.placement === 'string' ? properties.placement : '';
    const content =
      this.getSearchParam(properties.search, 'utm_content') ||
      this.getSearchParam(properties.page_location, 'utm_content') ||
      this.getSearchParam(properties.location, 'utm_content') ||
      (typeof properties.utm_content === 'string' ? properties.utm_content : '');
    const parsed = this.parseBlogUtmContent(content);
    const pathSlug = this.extractBlogSlugFromPath(typeof properties.path === 'string' ? properties.path : '');

    return {
      slug: explicitSlug || parsed.slug || pathSlug,
      placement: explicitPlacement || parsed.placement,
    };
  }

  private parseBlogUtmContent(value?: string | null) {
    if (!value) return { slug: '', placement: '' };
    const match = String(value).match(/^(.*)_(inline_markdown|inline|bottom)$/);
    if (!match) return { slug: String(value), placement: '' };
    return { slug: match[1], placement: match[2] };
  }

  private getSearchParam(value: any, key: string) {
    if (typeof value !== 'string' || !value) return '';

    try {
      const search = value.startsWith('http')
        ? new URL(value).search
        : value.includes('?')
          ? value.slice(value.indexOf('?'))
          : value;
      const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
      return params.get(key) || '';
    } catch {
      return '';
    }
  }

  private extractBlogSlugFromPath(path: string) {
    const match = String(path || '').match(/^\/(?:en\/)?blog\/([^/?#]+)$/);
    const slug = match?.[1] || '';
    if (!slug || slug === 'c' || slug === 'metier') return '';
    return slug;
  }

  private getGoogleAnalyticsCredentials(): GoogleAnalyticsCredentials | null {
    const propertyId = process.env.GA4_PROPERTY_ID || process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    const credentialsJson =
      process.env.GA4_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (propertyId && credentialsJson) {
      try {
        const parsed = JSON.parse(credentialsJson);
        const clientEmail = parsed.client_email || parsed.clientEmail;
        const privateKey = parsed.private_key || parsed.privateKey;

        if (clientEmail && privateKey) {
          return {
            propertyId,
            clientEmail,
            privateKey: String(privateKey).replace(/\\n/g, '\n'),
          };
        }
      } catch {
        return null;
      }
    }

    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!propertyId || !clientEmail || !privateKey) {
      return null;
    }

    return {
      propertyId,
      clientEmail,
      privateKey,
    };
  }

  private buildMoneyFunnelRecommendation(stageKey?: string) {
    switch (stageKey) {
      case 'signups':
        return 'Le trafic ne crée pas assez de comptes. Priorité: CTA landing plus direct, promesse trial au-dessus de la ligne de flottaison, et pages SEO orientées intention forte.';
      case 'confirmed':
        return 'Les comptes ne confirment pas assez leur email. Priorité: délivrabilité, template transactionnel simple, et relance confirmation.';
      case 'trials':
        return 'Les inscrits ne démarrent pas assez le trial. Priorité: activer automatiquement le trial au premier usage et clarifier le bénéfice sans carte bancaire.';
      case 'first_deck':
        return 'Les trials ne créent pas leur premier deck. Priorité: pré-remplir le prompt, proposer 3 cas d’usage, et réduire les choix avant génération.';
      case 'export_or_share':
        return 'Les utilisateurs créent mais ne vont pas jusqu’au moment de valeur. Priorité: améliorer l’éditeur, rendre l’export visible, et afficher un CTA export dès la génération terminée.';
      case 'upgrade_prompt':
        return 'Les utilisateurs activés ne voient pas assez la proposition Pro. Priorité: bandeau post-génération, callout dans l’export, et rappel dashboard pendant le trial.';
      case 'upgrade_clicked':
        return 'L’upsell est vu mais ne déclenche pas assez de clics. Priorité: clarifier le bénéfice PowerPoint/brand kit, rendre le 9,90€ plus visible, et proposer un CTA direct Stripe.';
      case 'pricing_view':
        return 'Les utilisateurs activés ne voient pas assez l’offre. Priorité: CTA Pro après génération, dashboard trial banner, et rappel dans l’export.';
      case 'plan_selected':
        return 'La page pricing ne donne pas assez envie de cliquer. Priorité: simplifier l’offre Pro, renforcer le 9,90€ premier mois, et rassurer sur l’annulation.';
      case 'checkout':
        return 'Les clics plan ne lancent pas assez Stripe. Priorité: corriger les états de compte, erreurs checkout, et rendre les boutons non ambigus.';
      case 'paid':
        return 'Les checkouts ne paient pas. Priorité: vérifier Stripe, coupon, moyens de paiement, et relance abandon checkout.';
      default:
        return 'Commence par suivre ce funnel chaque semaine. Le meilleur chantier est l’étape avec la plus grosse chute entre deux lignes.';
    }
  }

  private buildSeoFunnelRecommendation(stageKey?: string) {
    switch (stageKey) {
      case 'blog_cta_click':
        return 'Les articles sont lus mais ne cliquent pas assez. Priorite: CTA plus haut, copy plus directe, exemple de prompt dans l article.';
      case 'create_opened':
        return 'Les CTA sont cliques mais la page creation ne s ouvre pas assez. Priorite: verifier auth returnTo, liens UTM et temps de chargement.';
      case 'create_started':
        return 'Les lecteurs arrivent sur creation mais ne lancent pas de generation. Priorite: pre-remplir le sujet depuis l article et reduire la friction du premier prompt.';
      case 'deck_generated':
        return 'Les generations blog ne vont pas au bout. Priorite: verifier erreurs de generation, temps d attente et clarte du loader.';
      case 'export_or_value':
        return 'Les lecteurs generent mais ne percoivent pas assez la valeur. Priorite: ameliorer rendu, preview et appel export.';
      case 'paywall':
        return 'Les lecteurs actives ne voient pas assez l offre. Priorite: upsell apres generation et rappel export.';
      case 'checkout':
        return 'L intention payante ne lance pas assez Stripe. Priorite: CTA pricing plus clair et lien Pro 9,90 EUR.';
      case 'purchase':
        return 'Les checkouts issus du blog ne paient pas. Priorite: verifier Stripe, coupon et relance abandon checkout.';
      default:
        return 'Suivre ce funnel apres chaque publication: vues article, clic CTA, creation, generation, valeur percue et paiement.';
    }
  }

  private async getGoogleAccessToken(clientEmail: string, privateKey: string) {
    const now = Math.floor(Date.now() / 1000);
    const assertion = jwt.sign(
      {
        iss: clientEmail,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      },
      privateKey,
      { algorithm: 'RS256' },
    );

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
    return body.access_token as string;
  }
}
