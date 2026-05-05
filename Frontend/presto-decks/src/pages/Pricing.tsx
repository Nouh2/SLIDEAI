import { useState, useEffect } from "react";
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
} from "lucide-react";
import { supabase, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";
import { api } from "@/lib/api";
import { SEO } from "@/components/common/SEO";
import {
  getPlanDisplayKey,
  getPlanRank,
  isExpiredTrialSubscription,
  isPackSubscription,
  isTrialingSubscription,
} from "@/lib/subscription";

// ─── Stripe Price IDs ──────────────────────────────────────────────────────────
// Vercel env vars can override pack price IDs without a frontend code change.
const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: "price_1Sn5IN5KgGKgF82elQlvSUIf",
    yearly: "price_1Sn5Jd5KgGKgF82erWwaHW8G",
  },
  business: {
    monthly: "price_1Sn5JB5KgGKgF82egl8duDWF",
    yearly: "price_1Sn5KK5KgGKgF82eSgoyWSnS",
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

export default function Pricing() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const promotionCode = searchParams.get("promo")?.trim() || "";

  const isPackActive = isPackSubscription(subscription);
  const packCreditsRemaining = subscription?.packCreditsRemaining ?? 0;

  const redirectToAuth = () => navigate(`/auth?returnTo=${encodeURIComponent("/pricing")}`);
  const createCtaPath = user ? "/create" : `/auth?returnTo=${encodeURIComponent("/create")}`;

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

  const handleSubscribe = async (planKey: "pro" | "business") => {
    Analytics.trackEvent(ANALYTICS_EVENTS.ECOMMERCE.CATEGORY, ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN, planKey);
    if (planKey === "business") {
      window.location.href = "mailto:contact@slideai.fr";
      return;
    }
    setLoadingPlan(planKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error(t("auth.noAccount")); redirectToAuth(); return; }

      if (planKey === "pro" && subscription?.canStartTrial) {
        await api.startTrial(session.access_token);
        await refreshSubscription(session.access_token);
        toast.success(t("pricing.trialStarted", { defaultValue: "Your 7-day Pro trial is now active." }));
        navigate("/create");
        return;
      }

      const priceId = STRIPE_PRICE_IDS[planKey][billingCycle];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subscription/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ priceId, plan: planKey, promotionCode: promotionCode || undefined }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(t("pricing.errors.checkout"));
    } catch (error) {
      console.error(error);
      toast.error(t("pricing.errors.generic"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleStartTrial = () => {
    Analytics.trackEvent(ANALYTICS_EVENTS.ECOMMERCE.CATEGORY, ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN, "Pricing Start Trial CTA");
    if (!user) { navigate(createCtaPath); return; }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate(createCtaPath); return; }
      if (subscription?.canStartTrial) {
        try {
          setLoadingPlan("trial");
          await api.startTrial(session.access_token);
          await refreshSubscription(session.access_token);
          toast.success(t("pricing.trialStarted", { defaultValue: "Your 7-day Pro trial is now active." }));
          navigate("/create");
        } catch (error: any) {
          toast.error(error.message || t("pricing.errors.generic"));
        } finally {
          setLoadingPlan(null);
        }
        return;
      }
      navigate(createCtaPath);
    });
  };

  const handleCancelSubscription = async () => {
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
        body: JSON.stringify({ priceId: packInfo.priceId, packType: packInfo.packType }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(t("pricing.errors.checkout"));
    } catch (error) {
      toast.error(t("pricing.errors.generic"));
    } finally {
      setLoadingPack(null);
    }
  };

  const currentPlanLevel = getPlanRank(getPlanDisplayKey(subscription));
  const isTrialing = isTrialingSubscription(subscription);
  const isExpired = isExpiredTrialSubscription(subscription);
  const isCurrentPro = subscription?.plan === "pro" && !isTrialing && !isExpired;
  const isCurrentBusiness = subscription?.plan === "business" && !isExpired;

  const proPrice = billingCycle === "yearly" ? "14€" : "19€";
  const businessPrice = billingCycle === "yearly" ? "24€" : "29€";

  const proCtaLabel = subscription?.canStartTrial
    ? t("pricing.tryFree")
    : isCurrentPro
      ? t("pricing.unsubscribe")
      : isTrialing
        ? t("pricing.continueTrial", { defaultValue: "Continue trial" })
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
                      : t("pricing.billedMonthly")}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 pb-7">
                {isTrialing ? (
                  <Button variant="outline" className="w-full rounded-xl font-bold" onClick={() => navigate("/create")}>
                    {t("pricing.continueTrial", { defaultValue: "Continue trial" })}
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
                    disabled={loadingPlan === "pro" || loadingPlan === "trial"}
                  >
                    {loadingPlan === "pro" || loadingPlan === "trial" ? (
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

                {subscription?.canStartTrial && (
                  <p className="text-xs text-center text-muted-foreground">{t("pricing.noSubscription")}</p>
                )}
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
            SECTION 3 — ACCÈS GRATUIT (reassurance)
        ══════════════════════════════════════════════ */}
        <section className="max-w-2xl mx-auto">
          <div className="rounded-2xl border border-border/50 bg-muted/20 p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted border border-border">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t("pricing.freeAccessTitle")}</h3>
              <p className="text-muted-foreground text-sm mt-1">{t("pricing.freeAccessSubtitle")}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-left max-w-md mx-auto">
              {(t("pricing.freeAccessFeatures", { returnObjects: true }) as string[]).map((f, i) => (
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
