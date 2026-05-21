import { useMemo, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProjectThumbnail } from "@/components/dashboard/ProjectThumbnail";
import { PaymentSuccess } from "@/components/dashboard/PaymentSuccess";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FolderOpen, Copy, Trash2, Calendar, Loader2, Users, Zap, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Analytics } from "@/lib/analytics";
import { ACTIVATION_USE_CASES, ActivationUseCaseId } from "@/lib/activation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getPlanDisplayKey, isLegacySubscription, isPackSubscription, isTrialingSubscription } from "@/lib/subscription";
import { HearAboutUsDialog } from "@/components/common/HearAboutUsDialog";
import { FeatureDiscoveryCard, PlanType } from "@/components/common/FeatureDiscoveryCard";

interface Presentation {
  id: string;
  user_id: string;
  title: string;
  slides: any;
  theme: string;
  status: string;
  createdAt: string;
  created_at?: string;
}

type TabType = "owned" | "shared";

const normalizePresentation = (presentation: Presentation): Presentation => ({
  ...presentation,
  createdAt: presentation.createdAt || presentation.created_at || new Date().toISOString(),
});

const formatPresentationDate = (value: string | undefined, locale: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US");
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [activeTab, setActiveTab] = useState<TabType>("owned");
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ownedPresentations, setOwnedPresentations] = useState<Presentation[]>([]);
  const [sharedPresentations, setSharedPresentations] = useState<Presentation[]>([]);
  const [viewOnlyPresentations, setViewOnlyPresentations] = useState<Presentation[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);
  const trialActivationTrackedRef = useRef(false);

  const [showSuccess, setShowSuccess] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!(params.get("session_id") || params.get("pack_success"));
  });

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const packSuccess = searchParams.get("pack_success");

    if (sessionId || packSuccess) {
      if (!showSuccess) setShowSuccess(true);

      const trackCheckoutReturn = async () => {
        if (!sessionId) {
          if (packSuccess) {
            Analytics.trackGaEvent("purchase_returned", {
              checkout_type: "pack",
              payment_status: "unknown",
            });
          }
          return;
        }

        const storageKey = `slideai-purchase-tracked-${sessionId}`;
        if (localStorage.getItem(storageKey)) return;
        localStorage.setItem(storageKey, "pending");

        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            localStorage.removeItem(storageKey);
            return;
          }

          const checkoutSession = await api.getCheckoutSession(sessionId, session.access_token);
          const value = typeof checkoutSession.amountTotal === "number"
            ? checkoutSession.amountTotal / 100
            : undefined;
          const checkoutType = checkoutSession.mode === "payment" ? "pack" : "subscription";
          const itemId = checkoutSession.priceId
            || checkoutSession.plan
            || checkoutSession.packType
            || checkoutSession.id;

          Analytics.trackPurchase({
            transactionId: checkoutSession.id,
            value,
            currency: checkoutSession.currency || "EUR",
            plan: checkoutSession.plan,
            packType: checkoutSession.packType,
            checkoutType,
            paymentStatus: checkoutSession.paymentStatus,
            coupon: checkoutSession.introOffer,
            attribution: checkoutSession.attribution,
            items: [
              {
                item_id: itemId,
                item_name: checkoutSession.productName || checkoutSession.plan || checkoutSession.packType || "SlideAI checkout",
                item_category: checkoutType,
                price: value,
                quantity: 1,
              },
            ],
          });

          localStorage.setItem(storageKey, "tracked");
        } catch (error) {
          localStorage.removeItem(storageKey);
          console.error("[Analytics] Unable to track Stripe purchase", error);
        }
      };

      void trackCheckoutReturn();

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("session_id");
      newParams.delete("pack_success");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showSuccess]);

  useEffect(() => {
    const fetchPresentations = async () => {
      if (showSuccess) return;

      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      try {
        const [result, subResult] = await Promise.all([
          api.getPresentations(session.access_token),
          api.getMySubscription(session.access_token),
        ]);

        setOwnedPresentations((result.owned || []).map(normalizePresentation));
        setSharedPresentations((result.shared || []).map(normalizePresentation));
        setViewOnlyPresentations((result.viewOnly || []).map(normalizePresentation));
        setSubscription(subResult);
        setCurrentUserId(session.user.id);
        setCurrentUserEmail(session.user.email ?? null);
        setCurrentAccessToken(session.access_token);
      } catch (error: any) {
        console.error("Error fetching presentations:", error);
        toast({
          title: t("common.error"),
          description: t("dashboard.loadError"),
          variant: "destructive",
        });
      }

      setIsLoading(false);
    };

    fetchPresentations();
  }, [navigate, toast, t]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      const { error } = await supabase
        .from("presentations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setOwnedPresentations((prev) => prev.filter((p) => p.id !== id));

      toast({
        title: t("dashboard.presentationDeleted"),
        description: t("dashboard.presentationDeletedMsg"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("dashboard.deleteError"),
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (presentation: Presentation) => {
    if (!currentAccessToken) {
      toast({
        title: t("common.error"),
        description: t("create.sessionExpired"),
        variant: "destructive",
      });
      return;
    }

    try {
      setDuplicatingId(presentation.id);
      const duplicated = await api.duplicatePresentation(presentation.id, currentAccessToken);
      setOwnedPresentations((prev) => [duplicated, ...prev]);
      setActiveTab("owned");
      toast({
        title: t("dashboard.duplicateSuccess", { defaultValue: "Présentation dupliquée" }),
        description: t("dashboard.duplicateSuccessMsg", { defaultValue: "La copie est disponible dans vos présentations." }),
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error?.message || t("dashboard.duplicateError", { defaultValue: "Impossible de dupliquer cette présentation." }),
        variant: "destructive",
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  const currentList = activeTab === "owned"
    ? ownedPresentations
    : [
      ...sharedPresentations.map((p) => ({ ...p, _accessType: "edit" as const })),
      ...viewOnlyPresentations.map((p) => ({ ...p, _accessType: "view" as const })),
    ];

  const totalSharedCount = sharedPresentations.length + viewOnlyPresentations.length;
  const isPackActive = isPackSubscription(subscription);
  const isTrialing = isTrialingSubscription(subscription);
  const isExpiredTrial = subscription?.accessState === "trial_expired";
  const isRetiredAccess = isLegacySubscription(subscription) || subscription?.plan === "starter";
  const displayPlanKey = getPlanDisplayKey(subscription);
  const planLabel = isPackActive
    ? t("dashboard.packActive", { defaultValue: "Pack actif" })
    : isTrialing
      ? t("dashboard.proTrial", { defaultValue: "Essai Pro" })
      : isExpiredTrial
        ? t("dashboard.trialExpired", { defaultValue: "Essai expiré" })
        : isRetiredAccess
          ? t("dashboard.freeLegacy", { defaultValue: "Accès historique" })
          : displayPlanKey
            ? `${t("dashboard.plan")} ${t(`pricing.plans.${displayPlanKey}.name`)}`
            : t("dashboard.plan");

  const planMeta = isTrialing
    ? (i18n.language === "fr"
        ? `Essai: ${subscription?.trialDaysLeft ?? 0} jour(s) restant(s)`
        : `Trial: ${subscription?.trialDaysLeft ?? 0} day(s) left`)
    : isExpiredTrial
      ? t("dashboard.paymentRequired", { defaultValue: "Abonnement requis pour continuer" })
      : subscription?.creditsRemaining === -1
        ? t("dashboard.unlimitedPresentations")
        : isPackActive
        ? t("dashboard.packRemaining", {
            defaultValue: "{{count}} generation(s) ponctuelle(s) restante(s)",
            count: subscription?.packCreditsRemaining ?? subscription?.creditsRemaining ?? 0,
          })
        : `${subscription?.creditsRemaining ?? 0} ${t("dashboard.generations", { defaultValue: "génération(s)" })}`;

  const hasCreatedPresentation = ownedPresentations.length > 0;
  const trialDaysLeft = subscription?.trialDaysLeft ?? 0;
  const handleTrialCreateClick = (useCase?: ActivationUseCaseId) => {
    Analytics.trackGaEvent("trial_activation_cta_click", {
      surface: "dashboard_trial_banner",
      action: "create_presentation",
      use_case: useCase || "manual",
      trial_days_left: trialDaysLeft,
      has_created_presentation: hasCreatedPresentation,
    });
    navigate(useCase ? `/create?activation=${useCase}` : "/create?onboarding=1");
  };
  const handleTrialProClick = () => {
    Analytics.trackGaEvent("trial_conversion_cta_click", {
      surface: "dashboard_trial_banner",
      action: "checkout_pro_intro",
      trial_days_left: trialDaysLeft,
      has_created_presentation: hasCreatedPresentation,
    });
    navigate("/pricing?checkout=pro_intro");
  };

  useEffect(() => {
    if (!isTrialing || trialActivationTrackedRef.current) return;
    trialActivationTrackedRef.current = true;
    Analytics.trackGaEvent("trial_activation_banner_view", {
      surface: "dashboard",
      trial_days_left: trialDaysLeft,
      has_created_presentation: hasCreatedPresentation,
    });
  }, [isTrialing, trialDaysLeft, hasCreatedPresentation]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = currentList.filter((p) => {
      const matchText = p.title.toLowerCase().includes(q);
      const matchTheme = filter === "all" ? true : p.theme?.toLowerCase()?.includes(filter);
      return matchText && matchTheme;
    });

    list = list.sort((a, b) => {
      if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "name") return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [currentList, search, filter, sortBy]);

  if (showSuccess) {
    return <PaymentSuccess onContinue={() => setShowSuccess(false)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12 space-y-8">
      {currentUserId && currentAccessToken && (
        <HearAboutUsDialog
          userId={currentUserId}
          userEmail={currentUserEmail ?? undefined}
          accessToken={currentAccessToken}
          hearAboutAnswered={subscription?.hearAboutAnswered}
        />
      )}
      {currentUserId && (
        <FeatureDiscoveryCard
          userId={currentUserId}
          planType={
            isPackActive ? "pack"
            : subscription?.plan === "business" ? "business"
            : getPlanDisplayKey(subscription) && !isRetiredAccess ? "pro"
            : null
          }
        />
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">
            {t("dashboard.title")}
          </h1>
          <div className="flex flex-col gap-3 mt-1">
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground text-base">{t("dashboard.subtitle")}</p>
              {subscription && (
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isPackActive ? "bg-amber-500" : "bg-primary"}`} />
                  <div className={`px-3 py-1 rounded-full border flex items-center gap-2 transition-all cursor-default group ${
                    isPackActive
                      ? "bg-amber-50 border-amber-200 hover:bg-amber-100/80"
                      : "bg-primary/10 border-primary/20 hover:bg-primary/20"
                  }`}>
                    <Zap className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${isPackActive ? "text-amber-700" : "text-primary"}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${isPackActive ? "text-amber-700" : "text-primary"}`}>
                      {planLabel}
                    </span>
                    <span className={`w-px h-3 mx-1 ${isPackActive ? "bg-amber-200" : "bg-primary/20"}`} />
                    <span className={`text-xs font-medium ${isPackActive ? "text-amber-700/90" : "text-primary/80"}`}>
                      {planMeta}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isPackActive && (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {t("dashboard.packNote", {
                  defaultValue:
                    "Votre pack ajoute des generations ponctuelles et l export PDF/PPTX. Les fonctionnalites avancees restent reservees a Pro.",
                })}
              </p>
            )}
          </div>
        </div>
        <Button size="lg" asChild variant="solid">
          <Link to="/create">
            <Plus className="mr-2 h-5 w-5" />
            {t("dashboard.newPresentation")}
          </Link>
        </Button>
      </div>

      {isTrialing && (
        <div className="rounded-2xl border border-primary/25 bg-primary/5 px-5 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-background/80 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {t("dashboard.trialActivationBadge", { count: trialDaysLeft })}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t("dashboard.trialActivationTitle")}
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  {t("dashboard.trialActivationSubtitle")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  {
                    label: t("dashboard.trialActivationSteps.create"),
                    done: hasCreatedPresentation,
                  },
                  {
                    label: t("dashboard.trialActivationSteps.export"),
                    done: false,
                  },
                  {
                    label: t("dashboard.trialActivationSteps.keepPro"),
                    done: false,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.done ? "text-primary" : "text-muted-foreground/50"}`} />
                    <span className={item.done ? "font-semibold text-foreground" : "text-muted-foreground"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {ACTIVATION_USE_CASES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTrialCreateClick(item.id)}
                    className="rounded-xl border border-border/70 bg-background/80 px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-background"
                  >
                    <div className="text-sm font-bold text-foreground">{item.title}</div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              <Button variant="solid" onClick={() => handleTrialCreateClick()} className="font-bold">
                <Plus className="mr-2 h-4 w-4" />
                {t("dashboard.trialActivationCreateCta")}
              </Button>
              <Button variant="outline" onClick={handleTrialProClick} className="font-bold">
                {t("dashboard.trialActivationProCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {isExpiredTrial && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 px-5 py-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-bold text-foreground">
              {i18n.language.startsWith("fr")
                ? "Votre essai Pro est terminé."
                : "Your Pro trial has ended."}
            </p>
            <p className="text-sm text-muted-foreground">
              {i18n.language.startsWith("fr")
                ? "Pour générer, exporter ou continuer votre workflow, prenez un Pack Mission à 19 € ou passez à Pro."
                : "To generate, export, or continue your workflow, get a Mission Pack for €19 or upgrade to Pro."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button size="sm" variant="solid" asChild>
              <Link to="/pricing?checkout=pro_intro">
                <Sparkles className="mr-1.5 h-4 w-4" />
                {i18n.language.startsWith("fr") ? "Continuer a 9,90 EUR" : "Continue for EUR9.90"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/pricing#packs">
                <Sparkles className="mr-1.5 h-4 w-4" />
                {i18n.language.startsWith("fr") ? "Voir les packs" : "See packs"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <Button variant={activeTab === "owned" ? "solid" : "ghost"} onClick={() => setActiveTab("owned")} className="rounded-b-none">
          <FolderOpen className="w-4 h-4 mr-2" />
          {t("dashboard.myPresentations")}
          {ownedPresentations.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-muted rounded-full">
              {ownedPresentations.length}
            </span>
          )}
        </Button>
        <Button variant={activeTab === "shared" ? "solid" : "ghost"} onClick={() => setActiveTab("shared")} className="rounded-b-none">
          <Users className="w-4 h-4 mr-2" />
          {t("dashboard.sharedWithMe")}
          {totalSharedCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-muted rounded-full">
              {totalSharedCount}
            </span>
          )}
        </Button>
      </div>

      <Card className="bg-surface border-border">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t("dashboard.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 bg-surface/50 border-border rounded-2xl focus:border-primary transition-all"
              />
            </div>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="bg-surface/50 border-border rounded-2xl h-12 hover:border-primary transition-all">
                <SelectValue placeholder={t("dashboard.filterByTheme")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.allThemes")}</SelectItem>
                <SelectItem value="startup">{t("dashboard.themes.startup")}</SelectItem>
                <SelectItem value="corporate">{t("dashboard.themes.corporate")}</SelectItem>
                <SelectItem value="creative">{t("dashboard.themes.creative")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-surface/50 border-border rounded-2xl h-12 hover:border-primary transition-all">
                <SelectValue placeholder={t("dashboard.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{t("dashboard.mostRecent")}</SelectItem>
                <SelectItem value="oldest">{t("dashboard.oldest")}</SelectItem>
                <SelectItem value="name">{t("dashboard.nameAZ")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((presentation) => (
          <Card
            key={presentation.id}
            className="group bg-surface border-border hover:scale-[1.02] hover:border-primary/50 transition-all duration-300 overflow-hidden"
          >
            <CardContent className="p-0">
              <div className="relative overflow-hidden bg-muted aspect-video">
                <ProjectThumbnail presentation={presentation} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />

                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-surface/80 backdrop-blur-sm border border-border text-xs font-semibold z-10">
                  {presentation.slides?.slides?.length || 0} {t("dashboard.slides")}
                </div>
                {activeTab === "shared" && (
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 z-10 ${
                    (presentation as any)._accessType === "view"
                      ? "bg-violet-500/20 border border-violet-500/50 text-violet-400"
                      : "bg-blue-500/20 border border-blue-500/50 text-blue-400"
                  }`}>
                    <Users className="w-3 h-3" />
                    {(presentation as any)._accessType === "view" ? t("dashboard.readOnly") : t("dashboard.collaborative")}
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {presentation.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {t("dashboard.theme")}: {t(`dashboard.themes.${presentation.theme}`)}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatPresentationDate(presentation.createdAt, i18n.language)}</span>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                    {t(`dashboard.statuses.${presentation.status}`)}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  {activeTab === "shared" && (presentation as any)._accessType === "view" ? (
                    <Button size="sm" variant="solid" asChild className="flex-1">
                      <Link to={`/viewer?id=${presentation.id}`}>
                        <FolderOpen className="mr-1 h-4 w-4" />
                        {t("dashboard.view")}
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="solid" asChild className="flex-1">
                      <Link to={`/editor?id=${presentation.id}`}>
                        <FolderOpen className="mr-1 h-4 w-4" />
                        {t("dashboard.open")}
                      </Link>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    title={t("dashboard.duplicate")}
                    onClick={() => handleDuplicate(presentation)}
                    disabled={duplicatingId === presentation.id}
                  >
                    {duplicatingId === presentation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>

                  {activeTab === "owned" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-destructive/20 hover:border-destructive hover:text-destructive"
                          title={t("dashboard.delete")}
                          disabled={deletingId === presentation.id}
                        >
                          {deletingId === presentation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("dashboard.deleteConfirmTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("dashboard.deleteConfirmMessage")} "{presentation.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("dashboard.cancel")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(presentation.id)}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                          >
                            {t("dashboard.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary mb-6">
            {activeTab === "owned" ? (
              <FolderOpen className="h-8 w-8 text-white" />
            ) : (
              <Users className="h-8 w-8 text-white" />
            )}
          </div>
          <h3 className="text-2xl font-bold mb-2">
            {activeTab === "owned" ? t("dashboard.noPresentation") : t("dashboard.noSharedPresentation")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {activeTab === "owned" ? t("dashboard.createFirst") : t("dashboard.askColleagues")}
          </p>
          {activeTab === "owned" && (
            <Button size="lg" asChild variant="solid">
              <Link to="/create">
                <Plus className="mr-2 h-5 w-5" />
                {t("dashboard.createPresentation")}
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
