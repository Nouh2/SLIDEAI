import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, FileText, LogOut, Loader2, Mail, Hash, Zap, Clock, Shield, Sparkles, Lock, Palette } from "lucide-react";
import { BrandKitManager } from "@/components/brand/BrandKitManager";
import { supabase } from "@/contexts/AuthContext";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

export default function Account() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [presentations, setPresentations] = useState<any[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      fetchUserData(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        if (session.user.id !== user?.id) {
          fetchUserData(session.user);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchUserData = async (_currentUser: SupabaseUser) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [subData, presData] = await Promise.all([
        api.getMySubscription(session.access_token).catch(() => null),
        api.getPresentations(session.access_token).catch(() => ({ owned: [] })),
      ]);

      setSubscription(subData);
      setPresentations(presData.owned || []);
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleStartTrial = async () => {
    setStartingTrial(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const nextSubscription = await api.startTrial(session.access_token);
      setSubscription(nextSubscription);
      toast({
        title: t("common.success"),
        description: t("account.trialStarted", { defaultValue: "Your 7-day Pro trial is now active." }),
      });
      navigate("/create");
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setStartingTrial(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        title: t("common.error"),
        description: t("account.passwordMismatch"),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t("common.error"),
        description: t("account.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: t("account.passwordUpdated"),
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPackActive = Boolean(subscription?.packActive);
  const isFree = !subscription || (subscription.plan === "free" && !isPackActive);
  const isUnlimited = subscription?.creditsRemaining === -1;
  const isTrialing = subscription?.status === "trialing";
  const canStartTrial = Boolean(subscription?.canStartTrial);
  const planColor = isPackActive ? "text-amber-700" : isFree ? "text-muted-foreground" : "text-primary";
  const planName = isPackActive
    ? t("account.packActive", { defaultValue: "Active pack" })
    : subscription?.plan
      ? t(`pricing.plans.${subscription.plan}.name`)
      : t("pricing.plans.free.name");

  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              {t("account.title")}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              {t("account.subtitle")}
            </p>
          </div>
          {(isFree || isPackActive || canStartTrial) && (
            <Button
              onClick={canStartTrial ? handleStartTrial : () => navigate("/pricing")}
              disabled={startingTrial}
              className="hidden md:flex bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {startingTrial ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {canStartTrial
                ? t("account.startTrial", { defaultValue: "Start 7-day Pro trial" })
                : t("account.upgradeToProBtn")}
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4 p-1 bg-secondary/30 backdrop-blur-sm rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <User className="mr-2 h-4 w-4" />
              {t("account.overview")}
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <CreditCard className="mr-2 h-4 w-4" />
              {t("account.subscription")}
            </TabsTrigger>
            <TabsTrigger value="branding" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <Palette className="mr-2 h-4 w-4" />
              {t("account.branding")}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <Clock className="mr-2 h-4 w-4" />
              {t("account.activity")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-8 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {t("account.profile")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50 group-hover:bg-secondary/30 transition-colors">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("account.email")}</p>
                      <p className="font-semibold truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50 group-hover:bg-secondary/30 transition-colors">
                    <div className="p-3 bg-purple-500/10 rounded-full">
                      <Hash className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("account.userId")}</p>
                      <p className="font-mono text-xs text-muted-foreground truncate" title={user?.id}>{user?.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50 group-hover:bg-secondary/30 transition-colors">
                    <div className="p-3 bg-blue-500/10 rounded-full">
                      <Shield className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("account.provider")}</p>
                      <p className="font-medium capitalize">{user?.app_metadata?.provider || t("account.emailMethod", { defaultValue: "Email" })}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/50 space-y-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      {t("account.changePassword")}
                    </h4>
                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder={t("account.newPassword")}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl"
                      />
                      <Input
                        type="password"
                        placeholder={t("account.confirmPassword")}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="rounded-xl"
                      />
                      <Button size="sm" className="w-full rounded-xl" onClick={handleChangePassword} disabled={updatingPassword}>
                        {updatingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t("account.updatePassword")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-indigo-500/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-indigo-500" />
                    {t("account.statistics")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 text-center">
                      <p className="text-3xl font-bold text-primary">{presentations.length}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t("account.presentationsCount")}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 text-center">
                      <p className={`text-3xl font-bold ${isPackActive ? "text-amber-600" : "text-indigo-500"}`}>
                        {isUnlimited ? "∞" : (subscription?.creditsRemaining ?? 0)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{t("account.creditsRemaining")}</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <Button
                      variant="destructive"
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700 border-none shadow-none"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                      {t("account.signOut")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6 mt-8 animate-fade-in">
            <Card className="max-w-3xl mx-auto border-border/50 shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600" />
              <CardHeader className="text-center pb-8 pt-10">
                <CardTitle className="text-2xl font-bold mb-2">{t("account.yourSubscription")}</CardTitle>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Badge variant="outline" className={`px-4 py-1 text-base ${planColor} border-primary/20 bg-primary/5`}>
                    {planName}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`px-4 py-1 text-base ${
                      isPackActive
                        ? "text-amber-700 border-amber-300/40 bg-amber-100/60"
                        : "text-green-600 border-green-600/20 bg-green-500/5"
                    }`}
                  >
                    {isPackActive
                      ? t("account.packBadge", { defaultValue: "One-shot credits" })
                      : isTrialing
                        ? t("account.trialBadge", { defaultValue: "Trial" })
                        : t("account.active")}
                  </Badge>
                </div>
                {isTrialing && (
                  <p className="text-sm text-muted-foreground mt-4">
                    {t("account.trialEndsIn", {
                      defaultValue: `Trial ends in ${subscription?.trialDaysLeft ?? 0} day(s).`,
                      count: subscription?.trialDaysLeft ?? 0,
                    })}
                  </p>
                )}
                {isPackActive && (
                  <p className="text-sm text-muted-foreground mt-4 max-w-md mx-auto">
                    {t("account.packActiveNote", {
                      defaultValue:
                        "Votre pack ajoute des generations ponctuelles et l export PDF/PPTX. Les fonctionnalites avancees restent reservees a Pro.",
                    })}
                  </p>
                )}
              </CardHeader>
              <CardContent className="max-w-lg mx-auto pb-10 space-y-8">
                {!isUnlimited && !isPackActive && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-muted-foreground">{t("account.creditsAvailable")}</span>
                      <span className="text-xl font-bold text-foreground">{subscription?.creditsRemaining ?? 0}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(((subscription?.creditsRemaining || 0) / (subscription?.creditsTotal || 15)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {t("account.upgradeNote")}
                    </p>
                  </div>
                )}

                {isPackActive && (
                  <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">
                      {t("account.packActiveTitle", { defaultValue: "Generations ponctuelles disponibles" })}
                    </p>
                    <p className="text-4xl font-bold text-amber-700">{subscription?.packCreditsRemaining ?? subscription?.creditsRemaining ?? 0}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("account.packActiveDetail", {
                        defaultValue:
                          "Ce pack vous permet de continuer a generer ponctuellement et d exporter en PDF/PPTX, tout en gardant le reste des fonctionnalites du plan gratuit.",
                      })}
                    </p>
                  </div>
                )}

                {isUnlimited && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <h3 className="font-bold text-lg text-foreground">{t("account.unlimitedAccess")}</h3>
                    <p className="text-muted-foreground">{t("account.unlimitedNote")}</p>
                  </div>
                )}

                <div className="pt-6 border-t border-border/50 flex flex-col gap-3">
                  {canStartTrial ? (
                    <Button
                      onClick={handleStartTrial}
                      className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity"
                      disabled={startingTrial}
                    >
                      {startingTrial ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                      {t("account.startTrial", { defaultValue: "Start 7-day Pro trial" })}
                    </Button>
                  ) : isPackActive ? (
                    <>
                      <Button onClick={() => navigate("/pricing")} className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity">
                        {t("account.upgradeToPro")} <Sparkles className="ml-2 h-5 w-5" />
                      </Button>
                      <Button onClick={() => navigate("/pricing")} variant="outline" className="w-full h-12">
                        {t("account.buyAnotherPack", { defaultValue: "Buy another pack" })}
                      </Button>
                    </>
                  ) : isFree ? (
                    <Button onClick={() => navigate("/pricing")} className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity">
                      {t("account.upgradeToPro")} <Sparkles className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <Button onClick={() => navigate("/pricing")} variant="outline" className="w-full h-12">
                      {t("account.manageSubscription")}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground text-center max-w-xs mx-auto">
                    {isPackActive
                      ? t("account.packFooter", {
                          defaultValue: "Les packs sont des achats one-shot. L abonnement Pro reste recommande pour un usage regulier.",
                        })
                      : t("account.stripeNote")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6 mt-8 animate-fade-in">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>{t("account.brandingTitle")}</CardTitle>
                <CardDescription>{t("account.brandingDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <BrandKitManager mode="manage" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t("account.recentPresentations")}</h3>
              <Button variant="outline" size="sm" onClick={() => navigate("/app")}>{t("account.viewAll")}</Button>
            </div>

            {presentations.length > 0 ? (
              <div className="grid gap-4">
                {presentations.slice(0, 5).map((pres) => (
                  <div
                    key={pres.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-secondary/50 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate("/app")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{pres.title || t("common.untitled")}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pres.created_at).toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-US", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {t("account.draft")}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border/50 bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-secondary/50 mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">{t("account.noPresentation")}</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    {t("account.noPresentationNote")}
                  </p>
                  <Button onClick={() => navigate("/create")}>
                    <Sparkles className="mr-2 h-4 w-4" /> {t("account.createPresentation")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
