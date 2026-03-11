import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Zap, Loader2 } from "lucide-react";
import { supabase, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";
import { api } from "@/lib/api";

export default function Pricing() {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const promotionCode = searchParams.get("promo")?.trim() || "";

  const isPackActive = Boolean(subscription?.packActive);
  const packCreditsRemaining = subscription?.packCreditsRemaining ?? 0;

  const redirectToAuth = () => {
    navigate(`/auth?returnTo=${encodeURIComponent("/pricing")}`);
  };

  const createCtaPath = user ? "/create" : `/auth?returnTo=${encodeURIComponent("/create")}`;

  const refreshSubscription = async (accessToken: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/subscription`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.ok) {
      const data = await response.json();
      setSubscription(data);
      setCurrentPlan(data.plan);
      return data;
    }

    return null;
  };

  const STRIPE_PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
    Starter: {
      monthly: "price_1Sn5Iw5KgGKgF82ebXEDerSL",
      yearly: "price_1Sn5Jx5KgGKgF82e7TVoKqcJ",
    },
    Pro: {
      monthly: "price_1Sn5IN5KgGKgF82elQlvSUIf",
      yearly: "price_1Sn5Jd5KgGKgF82erWwaHW8G",
    },
    Business: {
      monthly: "price_1Sn5JB5KgGKgF82egl8duDWF",
      yearly: "price_1Sn5KK5KgGKgF82eSgoyWSnS",
    },
  };

  const PACK_PRICE_IDS: Record<string, { priceId: string; packType: string }> = {
    "Pack Freelance": { priceId: "price_1SrfAT5KgGKgF82eZbPykn70", packType: "pack_decouverte" },
    "Pack Power": { priceId: "price_1SrfB45KgGKgF82e2AnTxmqf", packType: "pack_power" },
  };

  const getPlanLevel = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "business":
        return 3;
      case "pro":
        return 2;
      case "starter":
        return 1;
      case "free":
        return 0;
      default:
        return 0;
    }
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

  const handleSubscribe = async (planName: string) => {
    Analytics.trackEvent(ANALYTICS_EVENTS.ECOMMERCE.CATEGORY, ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN, planName);

    if (planName === "Free") {
      navigate("/app");
      return;
    }

    if (planName === "Business") {
      window.location.href = "mailto:contact@slideai.fr";
      return;
    }

    setLoadingPlan(planName);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t("auth.noAccount"));
        redirectToAuth();
        return;
      }

      if (planName === "Pro" && subscription?.canStartTrial) {
        await api.startTrial(session.access_token);
        await refreshSubscription(session.access_token);
        toast.success(t("pricing.trialStarted", { defaultValue: "Your 7-day Pro trial is now active." }));
        navigate("/create");
        return;
      }

      const priceId = STRIPE_PRICE_IDS[planName][billingCycle];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subscription/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId,
          plan: planName.toLowerCase(),
          promotionCode: promotionCode || undefined,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(t("pricing.errors.checkout"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("pricing.errors.generic"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleStartTrial = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Pricing Start Trial CTA",
    );

    if (!user) {
      navigate(createCtaPath);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate(createCtaPath);
        return;
      }

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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || t("pricing.success.cancel"));
        await refreshSubscription(session.access_token);
      } else {
        throw new Error(data.message || t("pricing.errors.cancel"));
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t("pricing.errors.cancel"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePackPurchase = async (packName: string) => {
    Analytics.trackEvent(ANALYTICS_EVENTS.ECOMMERCE.CATEGORY, ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN, packName);
    setLoadingPack(packName);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t("editor.connectionRequired"));
        redirectToAuth();
        return;
      }

      const packInfo = PACK_PRICE_IDS[packName];
      if (!packInfo) {
        toast.error(t("pricing.errors.packNotFound"));
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/subscription/checkout-pack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId: packInfo.priceId,
          packType: packInfo.packType,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(t("pricing.errors.checkout"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("pricing.errors.generic"));
    } finally {
      setLoadingPack(null);
    }
  };

  const currentPlanLevel = currentPlan ? getPlanLevel(currentPlan) : 0;

  const getPlanButton = (plan: any) => {
    const planLevel = getPlanLevel(plan.name);
    const normalizedPlanName = plan.name.toLowerCase();
    const isTrialingCurrentPlan = currentPlan === normalizedPlanName && subscription?.status === "trialing";
    const isExpiredTrial = currentPlan === normalizedPlanName && subscription?.accessState === "trial_expired";
    const isCurrentPlan = currentPlan === normalizedPlanName && !isTrialingCurrentPlan && !isExpiredTrial;

    if (isTrialingCurrentPlan) {
      return (
        <Button variant="outline" className="w-full rounded-xl font-bold" onClick={() => navigate("/create")}>
          {t("pricing.continueTrial", { defaultValue: "Continue trial" })}
        </Button>
      );
    }

    if (isCurrentPlan) {
      return (
        <Button
          variant="outline"
          className="w-full rounded-xl font-bold border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
          onClick={handleCancelSubscription}
          disabled={loadingPlan === "cancel"}
        >
          {loadingPlan === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("pricing.unsubscribe")}
        </Button>
      );
    }

    if (planLevel < currentPlanLevel) {
      return (
        <Button
          variant="ghost"
          className="w-full rounded-xl font-bold text-muted-foreground bg-muted/50 cursor-not-allowed"
          disabled
        >
          {t("pricing.included")}
        </Button>
      );
    }

    return (
      <Button
        variant={plan.popular ? "solid" : plan.variant}
        className={`w-full rounded-xl font-bold ${plan.popular ? "shadow-lg shadow-primary/20 hover:shadow-primary/40" : ""}`}
        onClick={() => handleSubscribe(plan.name)}
        disabled={loadingPlan === plan.name}
      >
        {loadingPlan === plan.name ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.cta}
      </Button>
    );
  };

  const plans = [
    {
      name: "Free",
      price: "0 EUR",
      period: t("pricing.perMonth"),
      description: t("pricing.plans.free.description"),
      features: [
        t("pricing.plans.free.features.presentations"),
        t("pricing.plans.free.features.pdfImport"),
        t("pricing.plans.free.features.storage"),
        t("pricing.plans.free.features.aiSlides"),
        t("pricing.plans.free.features.aiRegen"),
        t("pricing.plans.free.features.design"),
        t("pricing.plans.free.features.watermark"),
      ],
      limitations: [
        t("pricing.plans.free.limitations.export"),
        t("pricing.plans.free.limitations.brandKit"),
      ],
      cta: t("pricing.startFree"),
      variant: "outline" as const,
      popular: false,
      badge: null,
    },
    {
      name: "Starter",
      price: billingCycle === "yearly" ? "7 EUR" : "9 EUR",
      period: t("pricing.perMonth"),
      billingNote: billingCycle === "yearly"
        ? t("pricing.billedYearly", { price: 84 })
        : t("pricing.billedMonthly"),
      description: t("pricing.plans.starter.description"),
      features: [
        t("pricing.plans.starter.features.presentations"),
        t("pricing.plans.starter.features.pdfImport"),
        t("pricing.plans.starter.features.storage"),
        t("pricing.plans.starter.features.aiSlides"),
        t("pricing.plans.starter.features.aiRegen"),
        t("pricing.plans.starter.features.export"),
        t("pricing.plans.starter.features.sharing"),
      ],
      limitations: [],
      cta: t("pricing.chooseStarter", { defaultValue: "Choose Starter" }),
      variant: "outline" as const,
      popular: false,
      badge: null,
    },
    {
      name: "Pro",
      price: billingCycle === "yearly" ? "14 EUR" : "19 EUR",
      period: t("pricing.perMonth"),
      billingNote: billingCycle === "yearly"
        ? t("pricing.billedYearly", { price: 168 })
        : t("pricing.billedMonthly"),
      description: t("pricing.plans.pro.description"),
      features: [
        <span key="unlimited" className="font-bold">{t("pricing.plans.pro.features.unlimitedGen")}</span>,
        t("pricing.plans.pro.features.pdfImport"),
        t("pricing.plans.pro.features.storage"),
        t("pricing.plans.pro.features.unlimitedSlides"),
        t("pricing.plans.pro.features.export"),
        t("pricing.plans.pro.features.support"),
        <span key="beta-export" className="flex items-center gap-2">
          {t("pricing.plans.pro.features.beta")}
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            {t("export.beta")}
          </span>
        </span>,
      ],
      cta: t("pricing.tryFree"),
      variant: "solid" as const,
      popular: true,
      badge: t("pricing.mostPopular"),
    },
  ];

  const visiblePlans = plans.filter((plan) => plan.name !== "Free");

  const packs = [
    {
      id: "discovery",
      badge: t("pricing.packs.discovery.badge"),
      lookupKey: "Pack Freelance",
      displayName: t("pricing.packs.discovery.name"),
      subtitle: t("pricing.packs.discovery.subtitle"),
      keyLine: t("pricing.packs.discovery.keyLine"),
      priceDetail: t("pricing.packs.discovery.priceDetail"),
      price: "7 EUR",
      cta: t("pricing.packs.discovery.cta"),
    },
    {
      id: "power",
      badge: t("pricing.packs.power.badge", { defaultValue: "" }),
      lookupKey: "Pack Power",
      displayName: t("pricing.packs.power.name"),
      subtitle: t("pricing.packs.power.subtitle"),
      keyLine: t("pricing.packs.power.keyLine"),
      priceDetail: t("pricing.packs.power.priceDetail"),
      price: "15 EUR",
      cta: t("pricing.packs.power.cta"),
    },
  ];

  return (
    <div className="py-12 md:py-20">
      <section className="container px-4 md:px-6">
        <div className="text-center space-y-6 mb-12 md:mb-16 animate-fade-in-up">
          <div className="inline-flex items-center space-x-2 rounded-full glass px-4 py-2 md:px-6 md:py-3 text-xs md:text-sm mb-4">
            <Zap className="h-4 w-4 md:h-5 md:w-5 text-accent animate-pulse" />
            <span className="text-foreground/90 font-medium">{t("pricing.badge")}</span>
          </div>
          <h1 className="text-3xl md:text-6xl font-bold">
            <span className="text-gradient-animated">{t("pricing.title")}</span> {t("pricing.titleHighlight")}
          </h1>
          <p className="text-base md:text-xl text-foreground/70 max-w-2xl mx-auto px-2">
            {t("pricing.subtitle")}
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button size="lg" onClick={handleStartTrial} className="font-bold">
              <Sparkles className="h-4 w-4 mr-2" />
              {t("pricing.tryFree")}
            </Button>
            <p className="text-sm text-muted-foreground">{t("pricing.noSubscription")}</p>
            {promotionCode && (
              <div className="rounded-full border border-emerald-300/50 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                {t("pricing.winbackCodeApplied", {
                  defaultValue: "Offre de relance détectée : le code {{code}} sera appliqué au checkout.",
                  code: promotionCode,
                })}
              </div>
            )}
          </div>
        </div>

        {isPackActive && (
          <div className="max-w-3xl mx-auto mb-10">
            <Card className="border-amber-300/40 bg-amber-50/60 rounded-2xl">
              <CardContent className="p-6 text-center space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
                  {t("pricing.packActiveBannerLabel", { defaultValue: "Pack actif" })}
                </p>
                <h2 className="text-2xl font-bold">
                  {t("pricing.packActiveBannerTitle", {
                    defaultValue: "Vous avez encore {{count}} generation(s) ponctuelle(s)",
                    count: packCreditsRemaining,
                  })}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                  {t("pricing.packActiveBannerDesc", {
                    defaultValue:
                      "Les packs ajoutent des generations one-shot avec export PDF/PPTX. Pour debloquer les fonctionnalites avancees et un usage regulier, passez a Pro.",
                  })}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{t("offer.proSubscription.title")}</h2>
          <p className="text-muted-foreground">{t("offer.proSubscription.subtitle")}</p>
        </div>

        <div className="flex items-center justify-center mb-10 md:mb-12">
          <div className="relative inline-flex items-center p-1.5 rounded-full bg-secondary/30 border border-border backdrop-blur-sm">
            <div
              className={`absolute inset-y-1.5 rounded-full bg-background shadow-sm transition-all duration-300 ease-out ${billingCycle === "monthly" ? "left-1.5 w-[calc(50%-6px)]" : "left-[calc(50%)] w-[calc(50%-6px)]"}`}
            />

            <button
              onClick={() => setBillingCycle("monthly")}
              className={`relative z-10 px-6 md:px-8 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-colors duration-300 ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
            >
              {t("pricing.monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`relative z-10 px-6 md:px-8 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-colors duration-300 ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
            >
              {t("pricing.yearly")}
            </button>

            <div
              className={`absolute left-full ml-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center transition-all duration-300 ${billingCycle === "yearly" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"}`}
            >
              <div className="w-4 h-px bg-primary/30 mr-2 relative overflow-visible">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-primary/30 rotate-45" />
              </div>

              <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary shadow-sm whitespace-nowrap">
                <Sparkles className="w-3 h-3 fill-primary" />
                <span>{t("pricing.discount")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-24">
          {visiblePlans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col rounded-2xl transition-all duration-500 ${plan.popular
                ? "border-primary/50 shadow-glow scale-105 z-10"
                : "border-border/50 hover:border-primary/30 hover:shadow-card hover:-translate-y-1"
              } ${getPlanLevel(plan.name) < currentPlanLevel ? "opacity-60 grayscale-[0.5]" : ""}`}
            >
              {(plan.popular || plan.badge) && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{plan.badge || "Plus populaire"}</span>
                  </div>
                </div>
              )}

              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-xl font-bold mb-2">{plan.name}</CardTitle>
                <div className="mt-4 mb-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-bold ${plan.popular ? "text-gradient" : ""}`}>
                      {plan.price}
                    </span>
                    <span className="text-foreground/60 text-sm font-medium">{plan.period}</span>
                  </div>
                  {plan.billingNote ? (
                    <p className="text-xs text-foreground/50 mt-1 h-4">{plan.billingNote}</p>
                  ) : (
                    <div className="h-5" />
                  )}
                </div>
                <p className="text-foreground/70 text-sm min-h-[40px]">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 gap-6">
                {getPlanButton(plan)}

                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mr-2.5 mt-0.5 flex-shrink-0" />
                      <div className="text-foreground/80 leading-tight">{feature}</div>
                    </div>
                  ))}
                  {plan.limitations?.map((limitation, i) => (
                    <div key={i} className="flex items-start text-sm opacity-50">
                      <div className="h-4 w-4 mr-2.5 mt-0.5 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                      </div>
                      <span className="text-foreground/60">{limitation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mb-20 md:mb-24">
          <div className="text-center mb-8 max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground mb-3">
              {t("pricing.secondarySectionBadge", { defaultValue: "Usage ponctuel" })}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {t("pricing.secondarySectionTitle", { defaultValue: "Besoin ponctuel ?" })}
            </h2>
            <p className="text-muted-foreground">
              {t("pricing.secondarySectionSubtitle", {
                defaultValue:
                  "Les packs conviennent a un besoin one-shot. Ils incluent l export PDF/PPTX, mais pour un usage recurrent et toutes les fonctionnalites avancees, l abonnement Pro reste la meilleure option.",
              })}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {packs.map((pack) => (
              <Card
                key={pack.id}
                className="relative border-border/50 rounded-2xl bg-secondary/10 hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6 md:p-7 flex flex-col items-center text-center gap-4">
                  <div className="space-y-2">
                    {pack.badge ? (
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        {pack.badge}
                      </p>
                    ) : null}
                    <h3 className="font-bold text-2xl">{pack.displayName}</h3>
                    <p className="text-muted-foreground font-medium text-sm px-4">{pack.subtitle}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">{pack.price}</span>
                    </div>
                    <p className="text-sm font-bold text-primary">{pack.keyLine}</p>
                    <p className="text-xs text-muted-foreground">{pack.priceDetail}</p>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full rounded-xl font-bold h-auto py-4 whitespace-normal leading-tight text-base"
                    onClick={() => handlePackPurchase(pack.lookupKey)}
                    disabled={loadingPack === pack.lookupKey}
                  >
                    {loadingPack === pack.lookupKey ? <Loader2 className="h-4 w-4 animate-spin" /> : pack.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-6 flex flex-col gap-2">
            <p className="text-sm text-muted-foreground font-medium bg-secondary/30 inline-block mx-auto px-4 py-1.5 rounded-full">
              {t("pricing.packRule", {
                defaultValue: "Les packs ajoutent des generations ponctuelles et l export PDF/PPTX, sans debloquer toutes les fonctionnalites Pro.",
              })}
            </p>
          </div>
        </div>

        <div className="mt-20 text-center space-y-4 animate-fade-in-up">
          <p className="text-foreground/70 text-lg font-medium">
            {t("pricing.allCardsAccepted")}
            <span className="block md:inline md:ml-2 text-sm text-foreground/50">
              - {t("pricing.noSubscription")}
            </span>
          </p>
          <p className="text-base text-foreground/60">
            {t("pricing.questions")}{" "}
            <a href="mailto:contact@slideai.fr" className="text-primary hover:text-accent transition-colors font-semibold">
              {t("pricing.contactUs")}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
