import { Fragment, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Sparkles,
  Zap,
  Loader2,
  ArrowRight,
  Timer,
  FileText,
  Lock,
  ChevronDown,
} from "lucide-react";
import { supabase, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Analytics, ANALYTICS_EVENTS, getAcquisitionAttribution } from "@/lib/analytics";
import { api } from "@/lib/api";
import { SEO } from "@/components/common/SEO";
import {
  isExpiredTrialSubscription,
  isPackSubscription,
  isTrialingSubscription,
} from "@/lib/subscription";

// ─── Stripe Price IDs ──────────────────────────────────────────────────────────
// Vercel env vars can override pack price IDs without a frontend code change.
const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || "price_1Sn5IN5KgGKgF82elQlvSUIf",
    yearly: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID || "price_1Sn5Jd5KgGKgF82erWwaHW8G",
  },
  business: {
    monthly: import.meta.env.VITE_STRIPE_BUSINESS_MONTHLY_PRICE_ID || "price_1Sn5JB5KgGKgF82egl8duDWF",
    yearly: import.meta.env.VITE_STRIPE_BUSINESS_YEARLY_PRICE_ID || "price_1Sn5KK5KgGKgF82eSgoyWSnS",
  },
};

const PACK_PRICE_IDS: Record<string, { priceId: string; packType: string }> = {
  "Pack Mission": {
    priceId: import.meta.env.VITE_STRIPE_PACK_MISSION_PRICE_ID || "price_1TClZP5KgGKgF82eVUkjsrgT",
    packType: "pack_decouverte",
  },
  "Pack Trimestre": {
    priceId: import.meta.env.VITE_STRIPE_PACK_TRIMESTRE_PRICE_ID || "price_1TClZP5KgGKgF82eIJO8gW7d",
    packType: "pack_power",
  },
};
// ──────────────────────────────────────────────────────────────────────────────

const PRO_CHECKOUT_VALUE_BY_CYCLE: Record<"monthly" | "yearly", number> = {
  monthly: 9.9,
  yearly: 168,
};

const PACK_CHECKOUT_VALUE_BY_KEY: Record<string, number> = {
  "Pack Mission": 19,
  "Pack Trimestre": 39,
};

export default function Pricing() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [autoTrialStarted, setAutoTrialStarted] = useState(false);
  const [autoCheckoutStarted, setAutoCheckoutStarted] = useState(false);
  const [isComparisonExpanded, setIsComparisonExpanded] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const promotionCode = searchParams.get("promo")?.trim() || "";
  const shouldAutoStartTrial = searchParams.get("startTrial") === "1";
  const shouldAutoStartIntroCheckout = searchParams.get("checkout") === "pro_intro";
  const attribution = getAcquisitionAttribution(searchParams);

  const isPackActive = isPackSubscription(subscription);
  const packCreditsRemaining = subscription?.packCreditsRemaining ?? 0;
  const isPaidProSubscription = Boolean(
    subscription?.plan === "pro" &&
    subscription?.stripeSubscriptionId &&
    !isTrialingSubscription(subscription) &&
    !isExpiredTrialSubscription(subscription)
  );

  const buildPricingReturnPath = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => params.set(key, value));
    const query = params.toString();
    return `/pricing${query ? `?${query}` : ""}`;
  };

  const redirectToAuth = () => navigate(`/auth?returnTo=${encodeURIComponent(buildPricingReturnPath({}))}`);
  const redirectToAuthForTrial = () => navigate(`/auth?returnTo=${encodeURIComponent(buildPricingReturnPath({ startTrial: "1" }))}`);
  const redirectToAuthForIntroCheckout = () => navigate(`/auth?returnTo=${encodeURIComponent(buildPricingReturnPath({ checkout: "pro_intro" }))}`);

  const refreshSubscription = async (accessToken: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/subscription`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (response.ok) {
      const data = await response.json();
      setSubscription(data);
      return data;
    }
    return null;
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        await refreshSubscription(session.access_token);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };
    fetchSubscription();
    Analytics.trackEvent(ANALYTICS_EVENTS.ECOMMERCE.CATEGORY, ANALYTICS_EVENTS.ECOMMERCE.VIEW_PRICING);
  }, []);

  useEffect(() => {
    if (!shouldAutoStartTrial || !user || autoTrialStarted || !subscription?.canStartTrial) {
      return;
    }

    setAutoTrialStarted(true);
    handleStartTrial();
  }, [shouldAutoStartTrial, user, autoTrialStarted, subscription?.canStartTrial]);

  useEffect(() => {
    if (!shouldAutoStartIntroCheckout || !user || autoCheckoutStarted || isPaidProSubscription) {
      return;
    }

    setAutoCheckoutStarted(true);
    handleSubscribe("pro");
  }, [shouldAutoStartIntroCheckout, user, autoCheckoutStarted, isPaidProSubscription]);

  const handleSubscribe = async (planKey: "pro" | "business") => {
    Analytics.trackEvent(ANALYTICS_EVENTS.ECOMMERCE.CATEGORY, ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN, planKey);
    if (planKey === "business") {
      window.location.href = "mailto:contact@slideai.fr";
      return;
    }
    setLoadingPlan(planKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (planKey === "pro" && billingCycle === "monthly") {
          redirectToAuthForIntroCheckout();
          return;
        }
        toast.error(t("auth.noAccount"));
        redirectToAuth();
        return;
      }

      const priceId = STRIPE_PRICE_IDS[planKey][billingCycle];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subscription/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          priceId,
          plan: planKey,
          promotionCode: promotionCode || undefined,
          introOffer: planKey === "pro" && billingCycle === "monthly" && !promotionCode,
          attribution: attribution || undefined,
        }),
      });
      const data = await response.json();
      if (data.url) {
        Analytics.trackCheckoutStarted({
          checkoutType: "subscription",
          plan: planKey,
          billingCycle,
          value: planKey === "pro" ? PRO_CHECKOUT_VALUE_BY_CYCLE[billingCycle] : undefined,
          currency: "EUR",
          attribution,
        });
        window.location.href = data.url;
      }
      else throw new Error(t("pricing.errors.checkout"));
    } catch (error) {
      console.error(error);
      toast.error(t("pricing.errors.generic"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleStartTrial = async () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Pricing Secondary Trial CTA"
    );
    setLoadingPlan("trial");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { redirectToAuthForTrial(); return; }

      await api.startTrial(session.access_token);
      Analytics.trackTrialStarted({ plan: "pro" });
      await refreshSubscription(session.access_token);
      toast.success(t("pricing.trialStarted", { defaultValue: "Your 7-day Pro trial is now active." }));
      navigate("/create?onboarding=1");
    } catch (error: any) {
      toast.error(error.message || t("pricing.errors.generic"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!isPaidProSubscription) {
      if (isTrialingSubscription(subscription)) {
        await handleSubscribe("pro");
        return;
      }

      navigate("/pricing?checkout=pro_intro");
      return;
    }

    if (!window.confirm(t("pricing.errors.cancelConfirm"))) return;
    setLoadingPlan("cancel");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subscription/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || t("pricing.success.cancel"));
        await refreshSubscription(session.access_token);
      } else {
        throw new Error(data.message || t("pricing.errors.cancel"));
      }
    } catch (error: any) {
      toast.error(error.message || t("pricing.errors.cancel"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePackPurchase = async (lookupKey: string) => {
    Analytics.trackEvent(ANALYTICS_EVENTS.ECOMMERCE.CATEGORY, ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN, lookupKey);
    setLoadingPack(lookupKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error(t("editor.connectionRequired")); redirectToAuth(); return; }
      const packInfo = PACK_PRICE_IDS[lookupKey];
      if (!packInfo) { toast.error(t("pricing.errors.packNotFound")); return; }
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subscription/checkout-pack`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ priceId: packInfo.priceId, packType: packInfo.packType, attribution: attribution || undefined }),
      });
      const data = await response.json();
      if (data.url) {
        Analytics.trackCheckoutStarted({
          checkoutType: "pack",
          packType: packInfo.packType,
          value: PACK_CHECKOUT_VALUE_BY_KEY[lookupKey],
          currency: "EUR",
          attribution,
        });
        window.location.href = data.url;
      }
      else throw new Error(t("pricing.errors.checkout"));
    } catch (error) {
      toast.error(t("pricing.errors.generic"));
    } finally {
      setLoadingPack(null);
    }
  };

  const isTrialing = isTrialingSubscription(subscription);
  const isExpired = isExpiredTrialSubscription(subscription);
  const isCurrentPro = isPaidProSubscription;
  const isCurrentBusiness = Boolean(subscription?.plan === "business" && subscription?.stripeSubscriptionId && !isExpired);
  const canShowTrialCta = !user || Boolean(subscription?.canStartTrial);

  const proPrice = billingCycle === "yearly" ? "14€" : "9,90€";
  const businessPrice = billingCycle === "yearly" ? "24€" : "29€";
  const comparisonPlans = [
    { key: "trial", name: t("pricing.comparison.plans.trial.name"), detail: t("pricing.comparison.plans.trial.detail") },
    { key: "mission", name: t("pricing.packMission.name"), detail: "19€" },
    { key: "trimestre", name: t("pricing.packTrimestre.name"), detail: "39€" },
    { key: "pro", name: t("pricing.plans.pro.name"), detail: billingCycle === "yearly" ? t("pricing.proYearlyComparisonDetail") : t("pricing.introComparisonDetail") },
    { key: "business", name: t("pricing.plans.business.name"), detail: billingCycle === "yearly" ? t("pricing.businessYearlyComparisonDetail") : t("pricing.businessMonthlyComparisonDetail") },
  ];
  const comparisonSections = [
    {
      title: t("pricing.comparison.sections.creation"),
      rows: [
        { label: t("pricing.comparison.rows.generations"), values: { trial: t("pricing.comparison.values.trialSevenDays"), mission: "5", trimestre: "15", pro: t("pricing.comparison.values.unlimited"), business: t("pricing.comparison.values.unlimited") } },
        { label: t("pricing.comparison.rows.projects"), values: { trial: t("pricing.comparison.values.unlimitedTrial"), mission: "20", trimestre: "20", pro: t("pricing.comparison.values.unlimited"), business: t("pricing.comparison.values.unlimited") } },
        { label: t("pricing.comparison.rows.pdfPages"), values: { trial: "200", mission: "50", trimestre: "50", pro: "200", business: "500" } },
        { label: t("pricing.comparison.rows.documentImport"), values: { trial: true, mission: true, trimestre: true, pro: true, business: true } },
        { label: t("pricing.comparison.rows.languages"), values: { trial: "FR / EN / ES", mission: "FR / EN / ES", trimestre: "FR / EN / ES", pro: "FR / EN / ES", business: "FR / EN / ES" } },
      ],
    },
    {
      title: t("pricing.comparison.sections.aiEditing"),
      rows: [
        { label: t("pricing.comparison.rows.aiAdd"), values: { trial: t("pricing.comparison.values.unlimited"), mission: "5", trimestre: "5", pro: t("pricing.comparison.values.unlimited"), business: t("pricing.comparison.values.unlimited") } },
        { label: t("pricing.comparison.rows.aiRegen"), values: { trial: t("pricing.comparison.values.unlimited"), mission: t("pricing.comparison.values.unlimited"), trimestre: t("pricing.comparison.values.unlimited"), pro: t("pricing.comparison.values.unlimited"), business: t("pricing.comparison.values.unlimited") } },
        { label: t("pricing.comparison.rows.colorAi"), values: { trial: true, mission: true, trimestre: true, pro: true, business: true } },
        { label: t("pricing.comparison.rows.storyboard"), values: { trial: true, mission: true, trimestre: true, pro: true, business: true } },
      ],
    },
    {
      title: t("pricing.comparison.sections.brandExport"),
      rows: [
        { label: t("pricing.comparison.rows.brandKit"), values: { trial: true, mission: false, trimestre: false, pro: true, business: true } },
        { label: t("pricing.comparison.rows.pdfExport"), values: { trial: true, mission: true, trimestre: true, pro: true, business: true } },
        { label: t("pricing.comparison.rows.pptxExport"), values: { trial: true, mission: true, trimestre: true, pro: true, business: true } },
        { label: t("pricing.comparison.rows.editablePptx"), values: { trial: true, mission: true, trimestre: true, pro: true, business: true } },
        { label: t("pricing.comparison.rows.noWatermark"), values: { trial: true, mission: true, trimestre: true, pro: true, business: true } },
      ],
    },
    {
      title: t("pricing.comparison.sections.shareTeam"),
      rows: [
        { label: t("pricing.comparison.rows.publicLink"), values: { trial: true, mission: true, trimestre: true, pro: true, business: true } },
        { label: t("pricing.comparison.rows.comments"), values: { trial: true, mission: true, trimestre: true, pro: true, business: true } },
        { label: t("pricing.comparison.rows.teamWorkspace"), values: { trial: false, mission: false, trimestre: false, pro: false, business: true } },
        { label: t("pricing.comparison.rows.prioritySupport"), values: { trial: true, mission: false, trimestre: true, pro: true, business: true } },
      ],
    },
  ];
  const mobileComparisonPreviewCount = 3;
  const mobileComparisonRows = comparisonSections.flatMap((section) =>
    section.rows.map((row) => ({ ...row, sectionTitle: section.title }))
  );
  const visibleMobileComparisonRows = isComparisonExpanded
    ? mobileComparisonRows
    : mobileComparisonRows.slice(0, mobileComparisonPreviewCount);
  const visibleMobileComparisonSections = comparisonSections
    .map((section) => ({
      ...section,
      rows: visibleMobileComparisonRows.filter((row) => row.sectionTitle === section.title),
    }))
    .filter((section) => section.rows.length > 0);
  const hasHiddenMobileComparisonRows = mobileComparisonRows.length > mobileComparisonPreviewCount;
  const renderComparisonValue = (value: string | boolean) => {
    if (value === true) {
      return <CheckCircle2 className="h-4 w-4 text-primary" aria-label={t("pricing.comparison.included")} />;
    }
    if (value === false) {
      return <span className="text-muted-foreground">-</span>;
    }
    return <span>{value}</span>;
  };

  const proCtaLabel = isCurrentPro
      ? t("pricing.unsubscribe")
      : isTrialing
        ? t("pricing.keepProIntro", { defaultValue: "Garder Pro à 9,90 €" })
        : billingCycle === "monthly"
          ? t("pricing.startIntroOffer", { defaultValue: "Start for 9.90€" })
          : t("pricing.choosePro", { defaultValue: "Choose Pro" });

  return (
    <div className="min-h-screen pb-20">
      <SEO
        title={t("pricing.meta.title", "Tarifs SlideAI")}
        description={t("pricing.meta.description", "Choisissez le plan SlideAI adapté à votre rythme de génération.")}
        url="/pricing"
        alternates={{ fr: "/pricing", en: "/pricing", "x-default": "/pricing" }}
      />

      {/* ── Hero ── */}
      <section className="pt-16 pb-10 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
            <Timer className="h-4 w-4" />
            {t("pricing.heroBadge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            {t("pricing.heroTitle")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
            {t("pricing.heroTagline")}
          </p>

          {promotionCode && (
            <div className="rounded-full border border-emerald-300/50 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 inline-block">
              {t("pricing.winbackCodeApplied", { code: promotionCode })}
            </div>
          )}

          {canShowTrialCta && !isCurrentPro && !isCurrentBusiness && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <Button
                variant="outline"
                className="rounded-xl font-bold h-11 px-6"
                onClick={isTrialing ? () => navigate("/create") : handleStartTrial}
                disabled={loadingPlan === "trial"}
              >
                {loadingPlan === "trial" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isTrialing ? (
                  t("pricing.continueTrial", { defaultValue: "Continue trial" })
                ) : (
                  t("pricing.createFreeTrialCta", { defaultValue: "Create for free" })
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t("pricing.createFreeTrialNote", { defaultValue: "Activates your 7-day free trial. No card required." })}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Pack Active Banner ── */}
      {isPackActive && (
        <div className="max-w-3xl mx-auto px-4 mb-8">
          <Card className="border-amber-300/40 bg-amber-50/60 rounded-2xl">
            <CardContent className="p-5 text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                {t("pricing.packActiveBannerLabel")}
              </p>
              <p className="text-xl font-bold">
                {t("pricing.packActiveBannerTitle", { count: packCreditsRemaining })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 space-y-20">

        {/* ══════════════════════════════════════════════
            SECTION 1 — PACKS (primary, project-based)
        ══════════════════════════════════════════════ */}
        <section>
          <div className="text-center mb-10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("pricing.packsSectionBadge")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">{t("pricing.packsTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t("pricing.packsSubtitle")}
            </p>
            <p className="text-sm font-semibold text-primary">
              {t("pricing.packsTjmLine")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Pack Mission */}
            <Card className="relative border-border/60 rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2 pt-7 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  {t("pricing.packMission.badge")}
                </p>
                <CardTitle className="text-2xl">{t("pricing.packMission.name")}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">{t("pricing.packMission.subtitle")}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-5 pb-7">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold">19€</span>
                  </div>
                  <p className="text-sm font-bold text-primary mt-1">{t("pricing.packMission.keyLine")}</p>
                  <p className="text-xs text-muted-foreground">{t("pricing.packMission.validity")}</p>
                </div>

                <div className="w-full space-y-2.5">
                  {(t("pricing.packMission.features", { returnObjects: true }) as string[]).map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full rounded-xl font-bold h-12"
                  variant="outline"
                  onClick={() => handlePackPurchase("Pack Mission")}
                  disabled={loadingPack === "Pack Mission"}
                >
                  {loadingPack === "Pack Mission" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>{t("pricing.packMission.cta")} <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">{t("pricing.packOneShot")}</p>
              </CardContent>
            </Card>

            {/* Pack Trimestre */}
            <Card className="relative border-primary/40 rounded-2xl shadow-glow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("pricing.packTrimestre.badge")}
                </div>
              </div>
              <CardHeader className="pb-2 pt-7 text-center">
                <CardTitle className="text-2xl">{t("pricing.packTrimestre.name")}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">{t("pricing.packTrimestre.subtitle")}</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-5 pb-7">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gradient">39€</span>
                  </div>
                  <p className="text-sm font-bold text-primary mt-1">{t("pricing.packTrimestre.keyLine")}</p>
                  <p className="text-xs text-muted-foreground">{t("pricing.packTrimestre.validity")}</p>
                </div>

                <div className="w-full space-y-2.5">
                  {(t("pricing.packTrimestre.features", { returnObjects: true }) as string[]).map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full rounded-xl font-bold h-12 shadow-lg shadow-primary/20"
                  onClick={() => handlePackPurchase("Pack Trimestre")}
                  disabled={loadingPack === "Pack Trimestre"}
                >
                  {loadingPack === "Pack Trimestre" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>{t("pricing.packTrimestre.cta")} <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">{t("pricing.packOneShot")}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 2 — ABONNEMENTS (Pro + Business)
        ══════════════════════════════════════════════ */}
        <section>
          <div className="text-center mb-10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("pricing.subscriptionSectionBadge")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">{t("pricing.subscriptionTitle")}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {t("pricing.subscriptionSubtitle")}
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative inline-flex items-center p-1.5 rounded-full bg-secondary/30 border border-border">
              <div
                className={`absolute inset-y-1.5 rounded-full bg-background shadow-sm transition-all duration-300 ${
                  billingCycle === "monthly" ? "left-1.5 w-[calc(50%-6px)]" : "left-[calc(50%)] w-[calc(50%-6px)]"
                }`}
              />
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {t("pricing.monthly")}
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                  billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {t("pricing.yearly")}
              </button>
              {billingCycle === "yearly" && (
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary whitespace-nowrap">
                  <Sparkles className="w-3 h-3 fill-primary" />
                  {t("pricing.discount")}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Pro */}
            <Card className="relative border-primary/50 rounded-2xl shadow-glow">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("pricing.mostPopular")}
                </div>
              </div>
              <CardHeader className="pb-2 pt-8 text-center">
                <CardTitle className="text-2xl">{t("pricing.plans.pro.name")}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">{t("pricing.plans.pro.description")}</p>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gradient">{proPrice}</span>
                    <span className="text-muted-foreground text-sm">{t("pricing.perMonth")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {billingCycle === "yearly"
                      ? t("pricing.billedYearly", { price: 168 })
                      : t("pricing.introBillingLine")}
                  </p>
                  {billingCycle === "monthly" && (
                    <p className="text-xs font-semibold text-primary mt-1">
                      {t("pricing.introRenewalLine")}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 pb-7">
                {isTrialing ? (
                  <Button
                    className="w-full rounded-xl font-bold h-12 shadow-lg shadow-primary/20"
                    onClick={() => handleSubscribe("pro")}
                    disabled={loadingPlan === "pro"}
                  >
                    {loadingPlan === "pro" ? <Loader2 className="h-4 w-4 animate-spin" /> : proCtaLabel}
                  </Button>
                ) : isCurrentPro ? (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl font-bold border-red-200 text-red-500 hover:bg-red-50"
                    onClick={handleCancelSubscription}
                    disabled={loadingPlan === "cancel"}
                  >
                    {loadingPlan === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.unsubscribe")}
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl font-bold h-12 shadow-lg shadow-primary/20"
                    onClick={() => handleSubscribe("pro")}
                    disabled={loadingPlan === "pro"}
                  >
                    {loadingPlan === "pro" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      proCtaLabel
                    )}
                  </Button>
                )}

                <div className="space-y-2.5">
                  {[
                    t("pricing.plans.pro.features.unlimitedGen"),
                    t("pricing.plans.pro.features.pdfImport"),
                    t("pricing.plans.pro.features.brandKit"),
                    t("pricing.plans.pro.features.export"),
                    t("pricing.plans.pro.features.support"),
                    t("pricing.plans.pro.features.editableExport"),
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span className={i === 0 ? "font-bold" : ""}>{f}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {billingCycle === "monthly"
                      ? t("pricing.introLegalLine")
                      : t("pricing.noSubscription")}
                </p>
              </CardContent>
            </Card>

            {/* Business / Team */}
            <Card className="relative border-border/50 rounded-2xl hover:border-primary/20 transition-all">
              <CardHeader className="pb-2 pt-8 text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  {t("pricing.plans.business.badge")}
                </div>
                <CardTitle className="text-2xl">{t("pricing.plans.business.name")}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">{t("pricing.plans.business.description")}</p>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">{businessPrice}</span>
                    <span className="text-muted-foreground text-sm">{t("pricing.perMonth")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {billingCycle === "yearly"
                      ? t("pricing.plans.business.billingNote")
                      : t("pricing.plans.business.billingNoteMonthly")}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 pb-7">
                {isCurrentBusiness ? (
                  <Button variant="outline" className="w-full rounded-xl font-bold" disabled>
                    {t("account.active")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full rounded-xl font-bold h-12"
                    onClick={() => handleSubscribe("business")}
                  >
                    {t("pricing.contactSales")}
                  </Button>
                )}

                <div className="space-y-2.5">
                  {[
                    t("pricing.plans.business.features.allPro"),
                    t("pricing.plans.business.features.workspace"),
                    t("pricing.plans.business.features.members"),
                    t("pricing.plans.business.features.billing"),
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            SECTION 3 — ESSAI PRO (reassurance)
        ══════════════════════════════════════════════ */}
        <section>
          <div className="text-center mb-8 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t("pricing.comparison.badge")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">{t("pricing.comparison.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("pricing.comparison.subtitle")}
            </p>
          </div>

          <div className="md:hidden space-y-7">
            {visibleMobileComparisonSections.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="text-xl font-bold text-foreground">{section.title}</h3>
                {section.rows.map((row) => (
                  <div key={row.label} className="overflow-hidden rounded-xl border border-border/60 bg-background">
                    <div className="border-b border-border/60 px-4 py-4">
                      <div className="break-words text-base font-semibold text-foreground">
                        {row.label}
                      </div>
                    </div>
                    <div className="divide-y divide-border/50 px-4">
                      {comparisonPlans.map((plan) => (
                        <div key={`${row.label}-${plan.key}`} className="flex items-center justify-between gap-4 py-3">
                          <div className="min-w-0">
                            <div className="break-words text-sm font-semibold text-foreground">{plan.name}</div>
                            <div className="mt-0.5 break-words text-xs text-muted-foreground">{plan.detail}</div>
                          </div>
                          <span className="flex shrink-0 justify-end text-right text-sm font-semibold text-foreground">
                            {renderComparisonValue((row.values as Record<string, string | boolean>)[plan.key])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {hasHiddenMobileComparisonRows && (
              <div className="flex justify-center pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 rounded-lg px-5 font-bold"
                  onClick={() => setIsComparisonExpanded((current) => !current)}
                >
                  {isComparisonExpanded
                    ? t("pricing.comparison.showLess", { defaultValue: "Voir moins" })
                    : t("pricing.comparison.showMore", { defaultValue: "Afficher plus" })}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isComparisonExpanded ? "rotate-180" : ""}`} />
                </Button>
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-border/60 bg-background md:block">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="sticky left-0 z-10 bg-muted/30 px-5 py-5 text-left font-semibold text-foreground min-w-[240px]">
                    {t("pricing.comparison.featureColumn")}
                  </th>
                  {comparisonPlans.map((plan) => (
                    <th key={plan.key} className="px-4 py-5 text-left align-top min-w-[132px]">
                      <div className="font-bold text-foreground">{plan.name}</div>
                      <div className="mt-1 text-xs font-medium text-muted-foreground">{plan.detail}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonSections.map((section) => (
                  <Fragment key={section.title}>
                    <tr className="border-b border-border/60">
                      <td colSpan={comparisonPlans.length + 1} className="bg-secondary/20 px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {section.title}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={row.label} className="border-b border-border/50 last:border-b-0">
                        <td className="sticky left-0 z-10 bg-background px-5 py-4 font-medium text-foreground">
                          {row.label}
                        </td>
                        {comparisonPlans.map((plan) => (
                          <td key={`${row.label}-${plan.key}`} className="px-4 py-4 font-semibold text-foreground">
                            {renderComparisonValue((row.values as Record<string, string | boolean>)[plan.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-border/50 bg-muted/20 p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted border border-border">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t("pricing.trialAccessTitle")}</h3>
              <p className="text-muted-foreground text-sm mt-1">{t("pricing.trialAccessSubtitle")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-left max-w-md mx-auto">
              {(t("pricing.trialAccessFeatures", { returnObjects: true }) as string[]).map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════ */}
        <div className="text-center space-y-3 pb-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>{t("pricing.allCardsAccepted")}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("pricing.questions")}{" "}
            <a href="mailto:contact@slideai.fr" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              {t("pricing.contactUs")}
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
