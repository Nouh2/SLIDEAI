import { useState, useEffect } from "react";
import { supabase } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Loader2, Eye, Send, Users, RefreshCw } from "lucide-react";

const SEGMENTS = [
  { value: "trial_expired_very_hot", label: "Very hot - essai expiré + 5 decks" },
  { value: "trial_expired_hot", label: "Hot - essai expiré + 2-4 decks" },
  { value: "trial_expired_warm", label: "Warm - essai expiré + 1 deck" },
  { value: "trial_expired_cold", label: "Cold - essai expiré + 0 deck" },
  { value: "all", label: "Tous les utilisateurs" },
  { value: "trialing", label: "En essai Pro (trialing)" },
  { value: "trial_expired", label: "Essai expiré (trial_expired)" },
  { value: "legacy_free", label: "Legacy Free" },
  { value: "paid", label: "Abonnés payants" },
] as const;

const APP_URL = import.meta.env.VITE_APP_URL || "https://www.slideai.fr";
const PRO_INTRO_URL = `${APP_URL}/pricing?checkout=pro_intro&utm_source=email&utm_medium=lifecycle&utm_campaign=trial_expired_reactivation`;
const CREATE_URL = `${APP_URL}/create?utm_source=email&utm_medium=lifecycle&utm_campaign=trial_expired_reactivation`;

const DEFAULT_FORM = {
  segment: "all" as string,
  badge: "",
  title: "",
  intro: "",
  body: "",
  bullets: "",
  ctaLabel: "Ouvrir SlideAI",
  ctaUrl: APP_URL,
  note: "",
};

const SEGMENT_DEFAULTS: Record<string, Partial<typeof DEFAULT_FORM>> = {
  trial_expired_very_hot: {
    badge: "Message de Noé",
    title: "J’ai vu que vous utilisez SlideAI sérieusement",
    intro: "Vous avez créé plusieurs présentations. Je voulais vous écrire directement.",
    body:
      "Bonjour,\n\nJe suis Noé, le fondateur de SlideAI.\n\nJ’ai vu que vous avez créé plusieurs présentations avec l’outil. Ce n’est pas anodin : la plupart des gens essaient une fois puis s’arrêtent.\n\nVotre essai vient d’expirer. Avant de vous laisser partir, je voulais vous poser une question directe : qu’est-ce qui vous a bloqué pour passer à l’abonnement ?\n\nSi c’est le prix, j’ai laissé l’offre de lancement active : le premier mois est à 9,90 €, puis 19,90 €/mois, sans engagement.\n\nSi c’est autre chose, répondez directement à cet email. Je lis tout.",
    bullets: "",
    ctaLabel: "Continuer avec SlideAI - 9,90 €",
    ctaUrl: PRO_INTRO_URL,
    note: "Sans engagement. Annulation possible à tout moment.",
  },
  trial_expired_hot: {
    badge: "Votre essai SlideAI",
    title: "Votre essai SlideAI est terminé - une question",
    intro: "Vous avez créé plusieurs présentations. J’aimerais comprendre ce qui vous a freiné.",
    body:
      "Bonjour,\n\nVotre essai gratuit SlideAI est terminé.\n\nVous avez créé des présentations pendant votre essai, donc le produit a fonctionné pour vous au moins une fois.\n\nJ’aimerais comprendre ce qui s’est passé ensuite. Est-ce que c’était le prix, l’export PPTX, un besoin pas assez urgent, ou autre chose ?\n\nUne réponse directe m’aide à améliorer le produit.\n\nEt si c’est le prix qui bloque : le premier mois est à 9,90 €, puis 19,90 €/mois, sans engagement.",
    bullets: "",
    ctaLabel: "Reprendre SlideAI à 9,90 €",
    ctaUrl: PRO_INTRO_URL,
    note: "Vous pouvez aussi répondre directement à cet email.",
  },
  trial_expired_warm: {
    badge: "Votre deck SlideAI",
    title: "Vous avez créé un deck avec SlideAI",
    intro: "Si vous avez une présentation à faire cette semaine, vous pouvez reprendre là où vous en étiez.",
    body:
      "Bonjour,\n\nVous avez testé SlideAI et créé une première présentation.\n\nSi l’outil vous a aidé à partir plus vite d’une page blanche, le plus simple est de le réutiliser sur un vrai livrable.\n\nL’offre de lancement est toujours disponible : 9,90 € le premier mois, puis 19,90 €/mois, sans engagement.",
    bullets: "Générations illimitées\nExport PPTX et PDF\nBrand Kit et support prioritaire",
    ctaLabel: "Reprendre mon workflow",
    ctaUrl: PRO_INTRO_URL,
    note: "Annulation possible à tout moment.",
  },
  trial_expired_cold: {
    badge: "Essai SlideAI",
    title: "Vous n’avez pas encore vraiment essayé SlideAI",
    intro: "Votre compte existe, mais vous n’avez pas encore généré de présentation.",
    body:
      "Bonjour,\n\nVous avez créé un compte SlideAI, mais vous n’avez jamais lancé de vraie génération.\n\nSi vous avez une présentation à produire cette semaine, le test le plus rapide est simple : ouvrez SlideAI, décrivez votre sujet en quelques lignes, puis laissez l’IA préparer une première base.\n\nPas besoin de préparer un prompt parfait.",
    bullets: "Brief simple ou document importé\nPremière structure en moins d’une minute\nExport une fois le deck finalisé",
    ctaLabel: "Générer ma première présentation",
    ctaUrl: CREATE_URL,
    note: "Le meilleur test est un vrai livrable, pas une démo vide.",
  },
};

export default function AdminBroadcast() {
  const { toast } = useToast();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [audienceInfo, setAudienceInfo] = useState<{
    total: number;
    eligible: number;
  } | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    skipped: number;
    errors: { email: string; error: string }[];
  } | null>(null);

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const loadAudience = async (segment: string) => {
    setAudienceLoading(true);
    setAudienceInfo(null);
    try {
      const token = await getToken();
      if (!token) return;
      const data = await api.getBroadcastUsers(segment, token);
      setAudienceInfo({ total: data.total, eligible: data.eligible });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setAudienceLoading(false);
    }
  };

  useEffect(() => {
    loadAudience(form.segment);
  }, [form.segment]);

  const handleSegmentChange = (segment: string) => {
    const defaults = SEGMENT_DEFAULTS[segment] || {};
    setForm((current) => ({
      ...current,
      segment,
      ...defaults,
    }));
  };

  const buildParams = () => ({
    segment: form.segment,
    badge: form.badge || "Message SlideAI",
    title: form.title,
    intro: form.intro,
    body: form.body.split("\n").filter((l) => l.trim()),
    bullets: form.bullets ? form.bullets.split("\n").filter((l) => l.trim()) : undefined,
    ctaLabel: form.ctaLabel,
    ctaUrl: form.ctaUrl,
    note: form.note || undefined,
  });

  const handlePreview = async () => {
    if (!form.title || !form.intro || !form.body) {
      toast({ title: "Champs manquants", description: "Titre, intro et body sont requis.", variant: "destructive" });
      return;
    }
    setPreviewLoading(true);
    setPreview(null);
    try {
      const token = await getToken();
      if (!token) return;
      const params = buildParams();
      const data = await api.broadcastPreview(params, token);
      setPreview(data);
    } catch (err: any) {
      toast({ title: "Erreur preview", description: err.message, variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSend = async () => {
    setSendLoading(true);
    setSendResult(null);
    try {
      const token = await getToken();
      if (!token) return;
      const params = buildParams();
      const data = await api.broadcastSend(params, token);
      setSendResult(data);
      toast({
        title: "Broadcast envoyé",
        description: `${data.sent} envoyés, ${data.skipped} ignorés (opt-out).`,
      });
    } catch (err: any) {
      toast({ title: "Erreur envoi", description: err.message, variant: "destructive" });
    } finally {
      setSendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Broadcast Email</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Envoyer un email à un segment d’utilisateurs. Seuls les users avec marketing opt-in recevront l’email.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Destinataires</h2>
          <div className="space-y-2">
            <Label>Segment</Label>
            <div className="flex gap-2 items-center">
              <Select value={form.segment} onValueChange={handleSegmentChange}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadAudience(form.segment)}
                disabled={audienceLoading}
              >
                {audienceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {audienceInfo && (
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span><strong>{audienceInfo.total}</strong> users dans ce segment</span>
              </div>
              <div className="text-green-600 font-medium">
                <strong>{audienceInfo.eligible}</strong> recevront l’email (opt-in)
              </div>
              {audienceInfo.total - audienceInfo.eligible > 0 && (
                <div className="text-muted-foreground">
                  {audienceInfo.total - audienceInfo.eligible} ignorés (opt-out)
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Contenu</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Badge <span className="text-muted-foreground">(optionnel)</span></Label>
              <Input
                placeholder="ex: Offre personnelle"
                value={form.badge}
                onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sujet *</Label>
              <Input
                placeholder="Sujet de l’email"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Intro (hero sous-titre) *</Label>
            <Input
              placeholder="Une phrase courte visible dans le header de l’email"
              value={form.intro}
              onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Corps du message * <span className="text-muted-foreground text-xs">(un paragraphe par ligne)</span></Label>
            <Textarea
              placeholder={"Ligne 1 du message.\nLigne 2 du message."}
              rows={5}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Bullet points <span className="text-muted-foreground text-xs">(optionnel, un point par ligne)</span></Label>
            <Textarea
              placeholder={"Fonctionnalité A\nFonctionnalité B"}
              rows={3}
              value={form.bullets}
              onChange={(e) => setForm((f) => ({ ...f, bullets: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Texte du bouton CTA *</Label>
              <Input
                value={form.ctaLabel}
                onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>URL du bouton *</Label>
              <Input
                value={form.ctaUrl}
                onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Note bas de mail <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
            <Input
              placeholder="ex: Sans engagement, annulable à tout moment."
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePreview} disabled={previewLoading}>
            {previewLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            Prévisualiser
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={sendLoading || !audienceInfo || audienceInfo.eligible === 0}
                className="ml-auto"
              >
                {sendLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer à {audienceInfo?.eligible ?? "..."} destinataires
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer l’envoi broadcast</AlertDialogTitle>
                <AlertDialogDescription>
                  Vous êtes sur le point d’envoyer cet email à{" "}
                  <strong>{audienceInfo?.eligible}</strong> utilisateurs (segment :{" "}
                  <strong>{SEGMENTS.find((s) => s.value === form.segment)?.label}</strong>).
                  <br /><br />
                  Sujet : <strong>{form.title}</strong>
                  <br /><br />
                  Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleSend}>Envoyer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {sendResult && (
          <div className="rounded-lg border bg-card p-5 space-y-2">
            <h2 className="font-semibold text-green-600">Broadcast terminé</h2>
            <p className="text-sm">
              <strong>{sendResult.sent}</strong> envoyés ·{" "}
              <strong>{sendResult.skipped}</strong> ignorés (opt-out)
            </p>
            {sendResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-destructive">{sendResult.errors.length} erreurs :</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {sendResult.errors.map((e) => (
                    <li key={e.email}>{e.email} - {e.error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {preview && (
          <div className="rounded-lg border overflow-hidden">
            <div className="bg-muted px-4 py-2 text-sm font-medium border-b">
              Preview - {preview.subject}
            </div>
            <iframe
              srcDoc={preview.html}
              title="Email preview"
              className="w-full h-[600px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </div>
    </div>
  );
}
