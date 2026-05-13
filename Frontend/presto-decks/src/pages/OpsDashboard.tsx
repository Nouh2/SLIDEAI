import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, BarChart3, CheckCircle2, CreditCard, Mail, MousePointerClick, RefreshCcw, Rocket, Send, ShieldCheck, Sparkles, Target, TrendingUp, Users } from "lucide-react";

type TemplateFormState = {
  subject: string;
  preview: string;
  badge: string;
  title: string;
  intro: string;
  bodyText: string;
  bulletsText: string;
  ctaLabel: string;
  ctaUrl: string;
  note: string;
  spotlightTone: "info" | "warning" | "success";
  spotlightTitle: string;
  spotlightBody: string;
  statsJson: string;
};

const EMPTY_FORM: TemplateFormState = {
  subject: "",
  preview: "",
  badge: "",
  title: "",
  intro: "",
  bodyText: "",
  bulletsText: "",
  ctaLabel: "",
  ctaUrl: "",
  note: "",
  spotlightTone: "info",
  spotlightTitle: "",
  spotlightBody: "",
  statsJson: "[]",
};

function patchToForm(patch: Record<string, any> | null | undefined): TemplateFormState {
  if (!patch) return EMPTY_FORM;

  return {
    subject: patch.subject || "",
    preview: patch.preview || "",
    badge: patch.badge || "",
    title: patch.title || "",
    intro: patch.intro || "",
    bodyText: Array.isArray(patch.body) ? patch.body.join("\n\n") : "",
    bulletsText: Array.isArray(patch.bullets) ? patch.bullets.join("\n") : "",
    ctaLabel: patch.ctaLabel || "",
    ctaUrl: patch.ctaUrl || "",
    note: patch.note || "",
    spotlightTone: patch.spotlight?.tone || "info",
    spotlightTitle: patch.spotlight?.title || "",
    spotlightBody: patch.spotlight?.body || "",
    statsJson: JSON.stringify(patch.stats || [], null, 2),
  };
}

function formToPatch(form: TemplateFormState) {
  const body = form.bodyText
    .split(/\n{2,}/)
    .map((line) => line.trim())
    .filter(Boolean);
  const bullets = form.bulletsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let stats = [];
  try {
    stats = JSON.parse(form.statsJson || "[]");
  } catch {
    stats = [];
  }

  return {
    ...(form.subject ? { subject: form.subject } : {}),
    ...(form.preview ? { preview: form.preview } : {}),
    ...(form.badge ? { badge: form.badge } : {}),
    ...(form.title ? { title: form.title } : {}),
    ...(form.intro ? { intro: form.intro } : {}),
    ...(body.length ? { body } : {}),
    ...(bullets.length ? { bullets } : {}),
    ...(form.ctaLabel ? { ctaLabel: form.ctaLabel } : {}),
    ...(form.ctaUrl ? { ctaUrl: form.ctaUrl } : {}),
    ...(form.note ? { note: form.note } : {}),
    ...(form.spotlightTitle || form.spotlightBody
      ? {
          spotlight: {
            tone: form.spotlightTone,
            title: form.spotlightTitle,
            body: form.spotlightBody,
          },
        }
      : {}),
    ...(Array.isArray(stats) && stats.length ? { stats } : {}),
  };
}

function formatCurrency(cents?: number, currency = "eur") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR");
}

function formatPercent(value?: number) {
  return `${Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}%`;
}

function formatCompactNumber(value?: number) {
  return Number(value || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

export default function OpsDashboard() {
  const { toast } = useToast();
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activeTab, setActiveTab] = useState<"money" | "overview" | "activation" | "funnel" | "templates" | "flows" | "logs">("money");
  const [moneyFunnel, setMoneyFunnel] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [activationFunnel, setActivationFunnel] = useState<any>(null);
  const [emailFunnel, setEmailFunnel] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [moneyLoaded, setMoneyLoaded] = useState(false);
  const [overviewLoaded, setOverviewLoaded] = useState(false);
  const [activationLoaded, setActivationLoaded] = useState(false);
  const [funnelLoaded, setFunnelLoaded] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [flowsLoaded, setFlowsLoaded] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [moneyLoading, setMoneyLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [activationLoading, setActivationLoading] = useState(false);
  const [funnelLoading, setFunnelLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [flowsLoading, setFlowsLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(EMPTY_FORM);
  const [previewMode, setPreviewMode] = useState<"draft" | "live">("draft");
  const [preview, setPreview] = useState<any>(null);
  const [testEmail, setTestEmail] = useState("noe.tehraoui1@gmail.com");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [publishingTemplate, setPublishingTemplate] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [funnelDays, setFunnelDays] = useState("30");

  const selectedFlowNames = useMemo(
    () => new Map(flows.map((flow) => [flow.slug, flow.name])),
    [flows],
  );

  useEffect(() => {
    void bootstrapOps();
  }, []);

  useEffect(() => {
    void loadTabData(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "money" && moneyLoaded) {
      setMoneyLoaded(false);
      void loadMoneyFunnelData();
    }

    if (activeTab === "activation") {
      setActivationLoaded(false);
      void loadActivationFunnelData();
    }

    if (activeTab === "funnel") {
      setFunnelLoaded(false);
      void loadFunnelData();
    }
  }, [funnelDays]);

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateForm(EMPTY_FORM);
      setPreview(null);
      setPreviewMode("draft");
      return;
    }

    setTemplateForm(patchToForm(selectedTemplate.previewDraft?.model || selectedTemplate.draftJson));
    setPreview(selectedTemplate.previewDraft);
    setPreviewMode("draft");
  }, [selectedTemplate]);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const bootstrapOps = async () => {
    setBootstrapping(false);
  };

  const loadTabData = async (tab: "money" | "overview" | "activation" | "funnel" | "templates" | "flows" | "logs") => {
    if (tab === "money" && !moneyLoaded && !moneyLoading) {
      await loadMoneyFunnelData();
      return;
    }

    if (tab === "overview" && !overviewLoaded && !overviewLoading) {
      await loadOverviewData();
      return;
    }

    if (tab === "activation" && !activationLoaded && !activationLoading) {
      await loadActivationFunnelData();
      return;
    }

    if (tab === "funnel" && !funnelLoaded && !funnelLoading) {
      await loadFunnelData();
      return;
    }

    if (tab === "templates" && !templatesLoaded && !templatesLoading) {
      await loadTemplatesData();
      return;
    }

    if (tab === "flows" && !flowsLoaded && !flowsLoading) {
      await loadFlowsData();
      return;
    }

    if (tab === "logs" && !logsLoaded && !logsLoading) {
      await loadLogsData();
    }
  };

  const loadOverviewData = async () => {
    setOverviewLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const data = await api.getOpsOverview(accessToken);
      setOverview(data);
      setOverviewLoaded(true);
    } catch (error: any) {
      toast({
        title: "Erreur KPIs",
        description: error.message || "Impossible de charger la vue globale ops.",
        variant: "destructive",
      });
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadMoneyFunnelData = async () => {
    setMoneyLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const data = await api.getOpsMoneyFunnel(accessToken, Number(funnelDays));
      setMoneyFunnel(data);
      setMoneyLoaded(true);
    } catch (error: any) {
      toast({
        title: "Erreur funnel argent",
        description: error.message || "Impossible de charger le funnel argent.",
        variant: "destructive",
      });
    } finally {
      setMoneyLoading(false);
    }
  };

  const loadTemplatesData = async () => {
    setTemplatesLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const data = await api.getOpsTemplates(accessToken);
      setTemplates(data);
      setTemplatesLoaded(true);

      if (data.length > 0) {
        const slug = selectedTemplateSlug || data[0]?.slug;
        await loadTemplate(slug, accessToken);
      } else {
        setSelectedTemplate(null);
        setPreview(null);
        setTemplateForm(EMPTY_FORM);
      }
    } catch (error: any) {
      toast({
        title: "Erreur templates",
        description: error.message || "Impossible de charger les templates email.",
        variant: "destructive",
      });
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadFunnelData = async () => {
    setFunnelLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const data = await api.getOpsEmailFunnel(accessToken, Number(funnelDays));
      setEmailFunnel(data);
      setFunnelLoaded(true);
    } catch (error: any) {
      toast({
        title: "Erreur funnel",
        description: error.message || "Impossible de charger le funnel email.",
        variant: "destructive",
      });
    } finally {
      setFunnelLoading(false);
    }
  };

  const loadActivationFunnelData = async () => {
    setActivationLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const data = await api.getOpsActivationFunnel(accessToken, Number(funnelDays));
      setActivationFunnel(data);
      setActivationLoaded(true);
    } catch (error: any) {
      toast({
        title: "Erreur activation",
        description: error.message || "Impossible de charger le funnel activation.",
        variant: "destructive",
      });
    } finally {
      setActivationLoading(false);
    }
  };

  const loadFlowsData = async () => {
    setFlowsLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const data = await api.getOpsFlows(accessToken);
      setFlows(data);
      setFlowsLoaded(true);
    } catch (error: any) {
      toast({
        title: "Erreur flows",
        description: error.message || "Impossible de charger les flows.",
        variant: "destructive",
      });
    } finally {
      setFlowsLoading(false);
    }
  };

  const loadLogsData = async () => {
    setLogsLoading(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) return;
      const data = await api.getOpsLogs(accessToken);
      setLogs(data);
      setLogsLoaded(true);
    } catch (error: any) {
      toast({
        title: "Erreur logs",
        description: error.message || "Impossible de charger les logs email.",
        variant: "destructive",
      });
    } finally {
      setLogsLoading(false);
    }
  };

  const refreshActiveTab = async () => {
    if (activeTab === "money") {
      await loadMoneyFunnelData();
      return;
    }

    if (activeTab === "overview") {
      await loadOverviewData();
      return;
    }

    if (activeTab === "activation") {
      await loadActivationFunnelData();
      return;
    }

    if (activeTab === "funnel") {
      await loadFunnelData();
      return;
    }

    if (activeTab === "templates") {
      await loadTemplatesData();
      return;
    }

    if (activeTab === "flows") {
      await loadFlowsData();
      return;
    }

    await loadLogsData();
  };

  const loadTemplate = async (slug: string, accessToken?: string) => {
    const token = accessToken || (await getAccessToken());
    if (!token) return;
    setTemplateLoading(true);
    setSelectedTemplateSlug(slug);
    setSelectedTemplate(null);
    setPreview(null);
    try {
      const template = await api.getOpsTemplate(slug, token);
      setSelectedTemplate(template);
      setPreview(template.previewDraft);
    } catch (error: any) {
      toast({
        title: "Erreur template",
        description: error.message || "Impossible de charger ce template.",
        variant: "destructive",
      });
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate?.slug) return;
    setSavingTemplate(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await api.updateOpsTemplate(selectedTemplate.slug, formToPatch(templateForm), session.access_token);
      await loadTemplate(selectedTemplate.slug, session.access_token);
      toast({ title: "Draft sauvegardé", description: "Le template a été mis à jour." });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handlePublishTemplate = async () => {
    if (!selectedTemplate?.slug) return;
    setPublishingTemplate(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await api.publishOpsTemplate(selectedTemplate.slug, session.access_token);
      await loadTemplate(selectedTemplate.slug, session.access_token);
      toast({ title: "Template publié", description: "La version live est à jour." });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setPublishingTemplate(false);
    }
  };

  const handleRefreshPreview = async (mode: "draft" | "live") => {
    if (!selectedTemplate?.slug) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const nextPreview = await api.previewOpsTemplate(selectedTemplate.slug, mode, session.access_token);
      setPreviewMode(mode);
      setPreview(nextPreview);
    } catch (error: any) {
      toast({ title: "Erreur preview", description: error.message, variant: "destructive" });
    }
  };

  const handleSendTest = async () => {
    if (!selectedTemplate?.slug) return;
    setSendingTest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await api.sendOpsTemplateTest(selectedTemplate.slug, previewMode, testEmail, session.access_token);
      toast({ title: "Mail de test envoyé", description: `Envoi lancé vers ${testEmail}.` });
    } catch (error: any) {
      toast({ title: "Erreur email", description: error.message, variant: "destructive" });
    } finally {
      setSendingTest(false);
    }
  };

  const handleUpdateFlow = async (slug: string, payload: Record<string, any>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await api.updateOpsFlow(slug, payload, session.access_token);
      const refreshed = await api.getOpsFlows(session.access_token);
      setFlows(refreshed);
      toast({ title: "Flow mis à jour", description: `Configuration sauvegardée pour ${slug}.` });
    } catch (error: any) {
      toast({ title: "Erreur flow", description: error.message, variant: "destructive" });
    }
  };

  const handlePublishFlow = async (slug: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await api.publishOpsFlow(slug, session.access_token);
      const refreshed = await api.getOpsFlows(session.access_token);
      setFlows(refreshed);
      toast({ title: "Flow publié", description: `${slug} est maintenant live.` });
    } catch (error: any) {
      toast({ title: "Erreur flow", description: error.message, variant: "destructive" });
    }
  };

  if (bootstrapping) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chargement du backoffice marketing...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 pb-32 space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[#1fb6ff]">
            <ShieldCheck className="h-4 w-4" />
            Ops interne SlideAI
          </div>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-zinc-950">Marketing OS</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Pilotage des flows lifecycle, preview des emails, envois de test et KPIs produit/revenu.
          </p>
        </div>
        <Button variant="outline" onClick={refreshActiveTab} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Rafraîchir
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="money">Argent</TabsTrigger>
          <TabsTrigger value="overview">Vue globale</TabsTrigger>
          <TabsTrigger value="activation">Activation</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="templates">Emails</TabsTrigger>
          <TabsTrigger value="flows">Flows</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="money" className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Funnel argent</h2>
              <p className="text-sm text-muted-foreground">
                La lecture simple du business : trafic, inscription, activation produit, intention de payer, Stripe.
              </p>
            </div>
            <Select value={funnelDays} onValueChange={setFunnelDays}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
                <SelectItem value="180">180 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {moneyLoading && !moneyFunnel ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chargement du funnel argent...
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Users} label="Visiteurs" value={formatCompactNumber(moneyFunnel?.summary?.visitors)} />
            <MetricCard icon={Rocket} label="Trials" value={formatCompactNumber(moneyFunnel?.summary?.trials)} />
            <MetricCard icon={Sparkles} label="1er deck" value={formatCompactNumber(moneyFunnel?.summary?.firstDecks)} />
            <MetricCard icon={CreditCard} label="Paiements" value={formatCompactNumber(moneyFunnel?.summary?.purchases)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Etapes de conversion</CardTitle>
                <CardDescription>
                  Chaque ligne montre le volume, la conversion depuis l'étape précédente et la conversion depuis les visiteurs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(moneyFunnel?.stages || []).map((stage: any, index: number) => (
                  <div key={stage.key} className="rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef8ff] text-sm font-black text-[#1fb6ff]">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-bold text-zinc-950">{stage.label}</div>
                            <Badge variant="secondary">{stage.source}</Badge>
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">{stage.description}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-right md:min-w-[280px]">
                        <div>
                          <div className="text-xl font-black text-zinc-950">{formatCompactNumber(stage.value)}</div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Volume</div>
                        </div>
                        <div>
                          <div className="text-xl font-black text-zinc-950">{formatPercent(stage.fromPrevious)}</div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Depuis avant</div>
                        </div>
                        <div>
                          <div className="text-xl font-black text-zinc-950">{formatPercent(stage.fromStart)}</div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Depuis trafic</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-[#1fb6ff]"
                        style={{ width: `${Math.max(2, Math.min(100, stage.fromStart || 0))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Diagnostic</CardTitle>
                  <CardDescription>Le point qui bloque le plus la transformation en revenu.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      Plus grosse chute
                    </div>
                    <div className="mt-2 text-2xl font-black text-zinc-950">
                      {moneyFunnel?.bottleneck?.label || "Pas encore assez de données"}
                    </div>
                    <div className="mt-1 text-sm text-amber-800">
                      {moneyFunnel?.bottleneck
                        ? `${formatPercent(moneyFunnel.bottleneck.fromPrevious)} passent cette étape. ${formatPercent(moneyFunnel.bottleneck.dropoff)} décrochent.`
                        : "Le funnel se remplira avec les prochains utilisateurs."}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-zinc-950">
                      <CheckCircle2 className="h-4 w-4 text-[#1fb6ff]" />
                      Action conseillée
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {moneyFunnel?.recommendation || "Charge le funnel pour obtenir une recommandation."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lecture revenu</CardTitle>
                  <CardDescription>Sépare les vrais paiements Stripe des accès Pro manuels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoPair label="Pro Stripe actifs" value={formatCompactNumber(moneyFunnel?.summary?.currentPaidStripe)} />
                  <InfoPair label="Pro manuels" value={formatCompactNumber(moneyFunnel?.summary?.currentManualPro)} />
                  <InfoPair label="Packs actifs" value={formatCompactNumber(moneyFunnel?.summary?.currentPackUsers)} />
                  <InfoPair
                    label="Revenu tracké période"
                    value={formatCurrency(moneyFunnel?.summary?.revenueCents, moneyFunnel?.summary?.currency)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {overviewLoading && !overview ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chargement des KPIs...
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={BarChart3} label="Nouveaux users 30j" value={overview?.summary?.newUsers30d ?? 0} />
            <MetricCard icon={Rocket} label="Essais actifs" value={overview?.summary?.trialingCount ?? 0} />
            <MetricCard icon={Sparkles} label="Paid actifs" value={overview?.summary?.activePaidCount ?? 0} />
            <MetricCard icon={Mail} label="Emails envoyés 30j" value={overview?.summary?.sentEmails30d ?? 0} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Produit & revenu</CardTitle>
                <CardDescription>Vue rapide sur l’activation, l’usage et le revenu récurrent estimé.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <InfoPair label="Activation 30j" value={`${overview?.summary?.activationRate30d ?? 0}%`} />
                <InfoPair label="Présentations 30j" value={overview?.summary?.presentations30d ?? 0} />
                <InfoPair label="Créateurs actifs 7j" value={overview?.summary?.activeCreators7d ?? 0} />
                <InfoPair label="Legacy free" value={overview?.summary?.legacyFreeCount ?? 0} />
                <InfoPair label="Trial expiré" value={overview?.summary?.trialExpiredCount ?? 0} />
                <InfoPair label="Pack actifs" value={overview?.summary?.packActiveCount ?? 0} />
                <InfoPair
                  label="MRR estimé"
                  value={formatCurrency(overview?.summary?.mrrCents, overview?.summary?.mrrCurrency)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics site</CardTitle>
                <CardDescription>GA4 si configuré, Vercel actif côté frontend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoPair label="Source" value={overview?.acquisition?.source || "ga4"} />
                <InfoPair label="Configuré" value={overview?.acquisition?.configured ? "Oui" : "Non"} />
                <InfoPair label="Sessions 30j" value={overview?.acquisition?.sessions30d ?? "—"} />
                <InfoPair label="Users 30j" value={overview?.acquisition?.users30d ?? "—"} />
                <InfoPair label="Pages vues 30j" value={overview?.acquisition?.pageViews30d ?? "—"} />
                <InfoPair label="Vercel script" value={overview?.acquisition?.vercelClientEnabled ? "Actif" : "Actif côté app"} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance par flow</CardTitle>
              <CardDescription>Logs 30 derniers jours.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flow</TableHead>
                    <TableHead>Envoyés</TableHead>
                    <TableHead>Skipped</TableHead>
                    <TableHead>Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(overview?.flows || []).map((flow: any) => (
                    <TableRow key={flow.flowSlug}>
                      <TableCell className="font-medium">{selectedFlowNames.get(flow.flowSlug) || flow.flowSlug}</TableCell>
                      <TableCell>{flow.sent}</TableCell>
                      <TableCell>{flow.skipped}</TableCell>
                      <TableCell>{flow.pending}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activation" className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Funnel activation produit</h2>
              <p className="text-sm text-muted-foreground">
                Essai, premier deck, export/partage, checkout et achat confirmÃ©.
              </p>
            </div>
            <Select value={funnelDays} onValueChange={setFunnelDays}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
                <SelectItem value="180">180 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activationLoading && !activationFunnel ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chargement du funnel activation...
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Rocket} label="Essais dÃ©marrÃ©s" value={activationFunnel?.totals?.trialStarted ?? 0} />
            <MetricCard icon={Target} label="ActivÃ©s" value={activationFunnel?.totals?.activated ?? 0} />
            <MetricCard icon={TrendingUp} label="Trial -> paid" value={formatPercent(activationFunnel?.totals?.trialToPaidRate)} />
            <MetricCard
              icon={BarChart3}
              label="Revenu attribuÃ©"
              value={formatCurrency(activationFunnel?.totals?.revenueCents, activationFunnel?.totals?.currency)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Etapes du funnel</CardTitle>
              <CardDescription>
                Les taux sont calculÃ©s en utilisateurs uniques sur la pÃ©riode choisie.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etape</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Depuis Ã©tape prÃ©c.</TableHead>
                    <TableHead>Depuis essai</TableHead>
                    <TableHead>Drop-off</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activationFunnel?.stages || []).map((stage: any) => (
                    <TableRow key={stage.eventName}>
                      <TableCell>
                        <div className="font-medium">{stage.label}</div>
                        <div className="text-xs text-muted-foreground">{stage.eventName}</div>
                      </TableCell>
                      <TableCell>{stage.users}</TableCell>
                      <TableCell>{stage.events}</TableCell>
                      <TableCell>{formatPercent(stage.fromPrevious)}</TableCell>
                      <TableCell>{formatPercent(stage.fromStart)}</TableCell>
                      <TableCell>{formatPercent(stage.dropoffFromPrevious)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cas d'usage onboarding</CardTitle>
              <CardDescription>Ce tableau montre quels raccourcis crÃ©ent vraiment de l'activation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cas d'usage</TableHead>
                    <TableHead>SÃ©lectionnÃ©</TableHead>
                    <TableHead>GÃ©nÃ©ration lancÃ©e</TableHead>
                    <TableHead>Activation complÃ©tÃ©e</TableHead>
                    <TableHead>Taux activation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activationFunnel?.useCases || []).map((row: any) => (
                    <TableRow key={row.useCase}>
                      <TableCell className="font-medium">{row.useCase}</TableCell>
                      <TableCell>{row.selected}</TableCell>
                      <TableCell>{row.created}</TableCell>
                      <TableCell>{row.completed}</TableCell>
                      <TableCell>{formatPercent(row.selected ? (row.completed / row.selected) * 100 : 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {activationFunnel?.useCases?.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Aucun cas d'usage trackÃ© sur cette fenÃªtre.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-950">Funnel lifecycle email</h2>
              <p className="text-sm text-muted-foreground">
                Envoi, clic, conversion Stripe et revenu attribué depuis les liens email.
              </p>
            </div>
            <Select value={funnelDays} onValueChange={setFunnelDays}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
                <SelectItem value="180">180 derniers jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {funnelLoading && !emailFunnel ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chargement du funnel email...
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Mail} label="Emails envoyés" value={emailFunnel?.totals?.sent ?? 0} />
            <MetricCard icon={MousePointerClick} label="Clics email" value={emailFunnel?.totals?.clicked ?? 0} />
            <MetricCard icon={TrendingUp} label="Conversions" value={emailFunnel?.totals?.converted ?? 0} />
            <MetricCard
              icon={BarChart3}
              label="Revenu attribué"
              value={formatCurrency(emailFunnel?.totals?.revenueCents, emailFunnel?.totals?.currency)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance par email</CardTitle>
              <CardDescription>
                Un clic ou une conversion est compté une seule fois par log email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Click rate</TableHead>
                    <TableHead>Conv.</TableHead>
                    <TableHead>Conv. rate</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(emailFunnel?.items || []).map((row: any) => (
                    <TableRow key={row.emailType}>
                      <TableCell className="font-medium">{row.emailType}</TableCell>
                      <TableCell>{selectedFlowNames.get(row.flowSlug) || row.flowSlug}</TableCell>
                      <TableCell>{row.scheduled}</TableCell>
                      <TableCell>
                        <div className="font-medium">{row.sent}</div>
                        <div className="text-xs text-muted-foreground">{formatPercent(row.sendRate)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.clicked}</div>
                        <div className="text-xs text-muted-foreground">{formatPercent(row.clickRate)}</div>
                      </TableCell>
                      <TableCell>{row.converted}</TableCell>
                      <TableCell>{formatPercent(row.conversionRate)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(row.revenueCents, row.currency)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(row.revenuePerSentCents, row.currency)} / envoyé
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {emailFunnel?.items?.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Aucun email lifecycle dans cette fenêtre.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          {templatesLoading && templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chargement des templates...
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[300px_1fr_1fr]">
            <Card className="h-[760px] overflow-hidden">
              <CardHeader>
                <CardTitle>Templates</CardTitle>
                <CardDescription>{templates.length} emails pilotés depuis le CMS.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[660px] px-4 pb-4">
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <button
                        key={template.slug}
                        className={`w-full rounded-2xl border p-3 text-left transition ${selectedTemplateSlug === template.slug ? "border-[#1fb6ff] bg-[#eef8ff]" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
                        onClick={() => loadTemplate(template.slug)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-zinc-950">{template.name}</div>
                          <Badge variant="secondary">{template.category}</Badge>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Live v{template.liveVersion} · Draft v{template.draftVersion}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="h-[760px] overflow-hidden">
              <CardHeader>
                <CardTitle>{selectedTemplate?.name || "Template"}</CardTitle>
                <CardDescription>Edition draft en blocks + variables.</CardDescription>
              </CardHeader>
              <CardContent className="h-[660px] p-0">
                <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-4 py-1">
                {templateLoading && !selectedTemplate ? (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Chargement du template...
                  </div>
                ) : null}
                <div className="grid gap-3 md:grid-cols-2">
                  <InputField label="Subject" value={templateForm.subject} onChange={(value) => setTemplateForm((prev) => ({ ...prev, subject: value }))} />
                  <InputField label="Preview" value={templateForm.preview} onChange={(value) => setTemplateForm((prev) => ({ ...prev, preview: value }))} />
                  <InputField label="Badge" value={templateForm.badge} onChange={(value) => setTemplateForm((prev) => ({ ...prev, badge: value }))} />
                  <InputField label="Titre" value={templateForm.title} onChange={(value) => setTemplateForm((prev) => ({ ...prev, title: value }))} />
                  <InputField label="Intro" value={templateForm.intro} onChange={(value) => setTemplateForm((prev) => ({ ...prev, intro: value }))} />
                  <InputField label="CTA label" value={templateForm.ctaLabel} onChange={(value) => setTemplateForm((prev) => ({ ...prev, ctaLabel: value }))} />
                  <InputField label="CTA URL" value={templateForm.ctaUrl} onChange={(value) => setTemplateForm((prev) => ({ ...prev, ctaUrl: value }))} />
                  <InputField label="Note" value={templateForm.note} onChange={(value) => setTemplateForm((prev) => ({ ...prev, note: value }))} />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Spotlight tone</label>
                    <Select value={templateForm.spotlightTone} onValueChange={(value: "info" | "warning" | "success") => setTemplateForm((prev) => ({ ...prev, spotlightTone: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <InputField label="Spotlight title" value={templateForm.spotlightTitle} onChange={(value) => setTemplateForm((prev) => ({ ...prev, spotlightTitle: value }))} />
                  <InputField label="Spotlight body" value={templateForm.spotlightBody} onChange={(value) => setTemplateForm((prev) => ({ ...prev, spotlightBody: value }))} />
                </div>

                <div className="grid gap-3">
                  <TextAreaField label="Body paragraphs" value={templateForm.bodyText} onChange={(value) => setTemplateForm((prev) => ({ ...prev, bodyText: value }))} />
                  <TextAreaField label="Bullets" value={templateForm.bulletsText} onChange={(value) => setTemplateForm((prev) => ({ ...prev, bulletsText: value }))} />
                  <TextAreaField label="Stats JSON" value={templateForm.statsJson} onChange={(value) => setTemplateForm((prev) => ({ ...prev, statsJson: value }))} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    {savingTemplate ? "Sauvegarde..." : "Sauvegarder le draft"}
                  </Button>
                  <Button variant="outline" onClick={handlePublishTemplate} disabled={publishingTemplate}>
                    {publishingTemplate ? "Publication..." : "Publier en live"}
                  </Button>
                </div>
                </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="h-[760px] overflow-hidden">
              <CardHeader>
                <CardTitle>Preview & test</CardTitle>
                <CardDescription>Preview fidèle au renderer utilisé par le worker.</CardDescription>
              </CardHeader>
              <CardContent className="h-[660px] p-0">
                <ScrollArea className="h-full px-6 pb-6">
                <div className="space-y-4 py-1">
                {templateLoading && !preview ? (
                  <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    GÃ©nÃ©ration du preview...
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button variant={previewMode === "draft" ? "default" : "outline"} onClick={() => handleRefreshPreview("draft")}>Preview draft</Button>
                  <Button variant={previewMode === "live" ? "default" : "outline"} onClick={() => handleRefreshPreview("live")}>Preview live</Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inbox de test</label>
                  <div className="flex gap-2">
                    <Input value={testEmail} onChange={(event) => setTestEmail(event.target.value)} />
                    <Button onClick={handleSendTest} disabled={sendingTest} className="gap-2">
                      <Send className="h-4 w-4" />
                      {sendingTest ? "Envoi..." : "Test"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border bg-zinc-50 p-2">
                  <iframe
                    title="Email preview"
                    className="h-[560px] w-full rounded-2xl bg-white"
                    srcDoc={preview?.html || "<html><body style='font-family:sans-serif;padding:24px;'>Aucun preview</body></html>"}
                  />
                </div>
                </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flows" className="space-y-6">
          {flowsLoading && flows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chargement des flows...
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {flows.map((flow) => (
              <Card key={flow.slug}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle>{flow.name}</CardTitle>
                      <CardDescription>{flow.emailTypes?.join(" · ")}</CardDescription>
                    </div>
                    <Badge variant={flow.enabled ? "default" : "secondary"}>{flow.enabled ? "Actif" : "Pause"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border p-3">
                    <div>
                      <div className="font-medium text-zinc-950">Activer le flow</div>
                      <div className="text-xs text-muted-foreground">Coupe ou relance la planification future.</div>
                    </div>
                    <Switch
                      checked={flow.enabled}
                      onCheckedChange={(checked) => handleUpdateFlow(flow.slug, { enabled: checked })}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <InputField label="Timezone" value={flow.timezone} onChange={(value) => handleUpdateFlow(flow.slug, { timezone: value })} />
                    <InputField label="Début" value={flow.sendWindowStart} onChange={(value) => handleUpdateFlow(flow.slug, { sendWindowStart: value })} />
                    <InputField label="Fin" value={flow.sendWindowEnd} onChange={(value) => handleUpdateFlow(flow.slug, { sendWindowEnd: value })} />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border p-3">
                    <div>
                      <div className="font-medium text-zinc-950">Lundi au vendredi</div>
                      <div className="text-xs text-muted-foreground">Décale les envois hors weekend.</div>
                    </div>
                    <Switch
                      checked={flow.weekdaysOnly}
                      onCheckedChange={(checked) => handleUpdateFlow(flow.slug, { weekdaysOnly: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Live v{flow.liveVersion} · Draft v{flow.draftVersion}</span>
                    <Button variant="outline" size="sm" onClick={() => handlePublishFlow(flow.slug)}>
                      Publier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          {logsLoading && logs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Chargement des logs...
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Logs email</CardTitle>
              <CardDescription>Historique récent des envois et skips.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Flow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Programmé</TableHead>
                    <TableHead>Envoyé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.emailType}</TableCell>
                      <TableCell>{log.userEmail}</TableCell>
                      <TableCell>{log.flowSlug || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "sent" ? "default" : log.status === "pending" ? "secondary" : "outline"}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.statusReason || "—"}</TableCell>
                      <TableCell>{formatDate(log.scheduledFor)}</TableCell>
                      <TableCell>{formatDate(log.sentAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <Card className="overflow-hidden border-zinc-200 bg-white">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-black text-zinc-950">{value}</div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8ff] text-[#1fb6ff]">
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoPair({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-xl font-bold text-zinc-950">{value}</div>
    </div>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      <Textarea rows={5} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
