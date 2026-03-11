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
import { BarChart3, Mail, Rocket, RefreshCcw, Send, ShieldCheck, Sparkles } from "lucide-react";

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

export default function OpsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(EMPTY_FORM);
  const [previewMode, setPreviewMode] = useState<"draft" | "live">("draft");
  const [preview, setPreview] = useState<any>(null);
  const [testEmail, setTestEmail] = useState("noe.tehraoui1@gmail.com");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [publishingTemplate, setPublishingTemplate] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const selectedFlowNames = useMemo(
    () => new Map(flows.map((flow) => [flow.slug, flow.name])),
    [flows],
  );

  useEffect(() => {
    loadOps();
  }, []);

  useEffect(() => {
    if (selectedTemplate?.slug) {
      setTemplateForm(patchToForm(selectedTemplate.draftJson));
      setPreview(selectedTemplate.previewDraft);
      setPreviewMode("draft");
    }
  }, [selectedTemplate?.slug]);

  const loadOps = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [overviewData, templatesData, flowsData, logsData] = await Promise.all([
        api.getOpsOverview(session.access_token),
        api.getOpsTemplates(session.access_token),
        api.getOpsFlows(session.access_token),
        api.getOpsLogs(session.access_token),
      ]);

      setOverview(overviewData);
      setTemplates(templatesData);
      setFlows(flowsData);
      setLogs(logsData);

      const slug = selectedTemplateSlug || templatesData[0]?.slug;
      if (slug) {
        await loadTemplate(slug, session.access_token);
      }
    } catch (error: any) {
      toast({
        title: "Erreur ops",
        description: error.message || "Impossible de charger le backoffice ops.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (slug: string, accessToken?: string) => {
    const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) return;
    const template = await api.getOpsTemplate(slug, token);
    setSelectedTemplateSlug(slug);
    setSelectedTemplate(template);
    setPreview(template.previewDraft);
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

  if (loading) {
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
    <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
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
        <Button variant="outline" onClick={loadOps} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Rafraîchir
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue globale</TabsTrigger>
          <TabsTrigger value="templates">Emails</TabsTrigger>
          <TabsTrigger value="flows">Flows</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[300px_1fr_1fr]">
            <Card className="h-[760px]">
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

            <Card className="h-[760px]">
              <CardHeader>
                <CardTitle>{selectedTemplate?.name || "Template"}</CardTitle>
                <CardDescription>Edition draft en blocks + variables.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            <Card className="h-[760px]">
              <CardHeader>
                <CardTitle>Preview & test</CardTitle>
                <CardDescription>Preview fidèle au renderer utilisé par le worker.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flows" className="space-y-6">
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
