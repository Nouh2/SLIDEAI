import { useMemo, useState } from "react";
import { Reorder, motion } from "framer-motion";
import { ArrowRight, BarChart3, FileText, GripVertical, Image, LayoutGrid, ListChecks, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { SlideTemplate } from "@/data/slideTemplates";

type StoryboardVisual = "text" | "data" | "comparison" | "timeline" | "visual";

export interface StoryboardSection {
  id: string;
  title: string;
  slideCount: number;
  visual: StoryboardVisual;
  included: boolean;
}

export interface PromptStoryboardSelection {
  sections: StoryboardSection[];
  structurePrompt: string;
  totalSlides: number;
}

interface PromptStoryboardStepProps {
  template?: SlideTemplate | null;
  requestedSlides: number;
  prompt: string;
  onBack: () => void;
  onConfirm: (selection: PromptStoryboardSelection) => void;
  isGenerating?: boolean;
}

const VISUAL_OPTIONS: Array<{ value: StoryboardVisual; label: string; icon: React.ReactNode }> = [
  { value: "text", label: "Analyse", icon: <FileText className="h-4 w-4" /> },
  { value: "data", label: "Données / KPI", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "comparison", label: "Comparaison", icon: <LayoutGrid className="h-4 w-4" /> },
  { value: "timeline", label: "Roadmap", icon: <ListChecks className="h-4 w-4" /> },
  { value: "visual", label: "Visuel", icon: <Image className="h-4 w-4" /> },
];

const DELIVERABLE_PLANS: Record<string, Array<{ title: string; visual: StoryboardVisual }>> = {
  "marketing-campaign": [
    { title: "Contexte marque et objectif de campagne", visual: "text" },
    { title: "Audience cible et insight consommateur", visual: "comparison" },
    { title: "Idée créative et messages clés", visual: "visual" },
    { title: "Canaux, calendrier et budget", visual: "timeline" },
    { title: "KPIs et critères de succès", visual: "data" },
  ],
  "seo-audit": [
    { title: "Synthèse exécutive de l'audit", visual: "data" },
    { title: "Diagnostic technique SEO", visual: "text" },
    { title: "Opportunités contenu et mots-clés", visual: "comparison" },
    { title: "Autorité, concurrence et priorités", visual: "data" },
    { title: "Roadmap d'actions SEO", visual: "timeline" },
  ],
  "sales-proposal": [
    { title: "Contexte client et enjeux", visual: "text" },
    { title: "Solution proposée et périmètre", visual: "comparison" },
    { title: "Méthodologie de collaboration", visual: "timeline" },
    { title: "Prix, options et livrables inclus", visual: "data" },
    { title: "Prochaines étapes", visual: "timeline" },
  ],
  "business-review": [
    { title: "Résumé exécutif", visual: "data" },
    { title: "Performance sur la période", visual: "data" },
    { title: "Risques et opportunités", visual: "comparison" },
    { title: "Priorités du prochain trimestre", visual: "timeline" },
  ],
  "financial-audit": [
    { title: "Synthèse financière", visual: "data" },
    { title: "Analyse revenus, coûts et marges", visual: "data" },
    { title: "Liquidité, dette et risques", visual: "comparison" },
    { title: "Recommandations financières", visual: "text" },
  ],
  "product-roadmap": [
    { title: "Vision produit et objectifs", visual: "text" },
    { title: "Besoins utilisateurs et priorités", visual: "comparison" },
    { title: "Roadmap par horizon", visual: "timeline" },
    { title: "Dépendances, risques et arbitrages", visual: "comparison" },
    { title: "Métriques de succès", visual: "data" },
  ],
  "cybersecurity-audit": [
    { title: "Posture de sécurité actuelle", visual: "data" },
    { title: "Risques critiques et vulnérabilités", visual: "comparison" },
    { title: "Plan de remédiation priorisé", visual: "timeline" },
    { title: "Gouvernance et prochaines étapes", visual: "text" },
  ],
  "board-deck": [
    { title: "Executive summary", visual: "data" },
    { title: "Performance business", visual: "data" },
    { title: "Décisions stratégiques à prendre", visual: "comparison" },
    { title: "Risques, impact financier et demandes", visual: "text" },
  ],
  consulting: [
    { title: "Executive summary", visual: "data" },
    { title: "Analyse de situation", visual: "text" },
    { title: "Options stratégiques", visual: "comparison" },
    { title: "Recommandation et business case", visual: "data" },
    { title: "Roadmap de mise en œuvre", visual: "timeline" },
  ],
  "corporate-report": [
    { title: "Périmètre et contexte", visual: "text" },
    { title: "Synthèse des constats", visual: "data" },
    { title: "Analyse détaillée", visual: "text" },
    { title: "Risques et recommandations", visual: "comparison" },
    { title: "Plan d'action", visual: "timeline" },
  ],
  "startup-pitch": [
    { title: "Proposition de valeur", visual: "visual" },
    { title: "Problème et opportunité", visual: "data" },
    { title: "Solution et différenciation", visual: "comparison" },
    { title: "Preuves, traction et ROI", visual: "data" },
    { title: "Offre et prochaines étapes", visual: "timeline" },
  ],
};

function distributeSlides(basePlan: Array<{ title: string; visual: StoryboardVisual }>, requestedSlides: number): StoryboardSection[] {
  const target = Math.max(3, requestedSlides || 8);
  const baseCount = basePlan.length || 4;
  const perSection = Math.floor(target / baseCount);
  let remainder = target % baseCount;

  return basePlan.map((item, index) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return {
      id: `story_${index}_${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      title: item.title,
      slideCount: Math.max(1, perSection + extra),
      visual: item.visual,
      included: true,
    };
  });
}

function buildPlanPrompt(sections: StoryboardSection[], totalSlides: number) {
  const activeSections = sections.filter((section) => section.included);
  let prompt = `\n\n[STORYBOARD VALIDÉ PAR L'UTILISATEUR]:\nLa présentation DOIT suivre strictement ce storyboard (${totalSlides} slides au total). Respecte l'ordre, les titres de parties, le nombre de slides et le type de contenu attendu.\n`;

  activeSections.forEach((section, index) => {
    const visual = VISUAL_OPTIONS.find((option) => option.value === section.visual)?.label || "Analyse";
    prompt += `${index + 1}. ${section.title} (~${section.slideCount} slides, contenu attendu: ${visual})\n`;
  });

  prompt += "\nNe remplace pas ce storyboard par une structure générique. Si le sujet manque de détails, complète prudemment tout en restant cohérent avec ces parties.";
  return prompt;
}

export function PromptStoryboardStep({ template, requestedSlides, prompt, onBack, onConfirm, isGenerating = false }: PromptStoryboardStepProps) {
  const initialPlan = useMemo(() => {
    const templateId = template?.id || "startup-pitch";
    return distributeSlides(DELIVERABLE_PLANS[templateId] || DELIVERABLE_PLANS["startup-pitch"], requestedSlides);
  }, [requestedSlides, template?.id]);

  const [sections, setSections] = useState<StoryboardSection[]>(initialPlan);

  const totalSlides = useMemo(
    () => sections.filter((section) => section.included).reduce((sum, section) => sum + section.slideCount, 0),
    [sections],
  );

  const updateSection = (id: string, patch: Partial<StoryboardSection>) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  };

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: `story_custom_${Date.now()}`,
        title: "Nouvelle partie",
        slideCount: 1,
        visual: "text",
        included: true,
      },
    ]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.length <= 1 ? prev : prev.filter((section) => section.id !== id));
  };

  const confirm = () => {
    const activeSections = sections.filter((section) => section.included && section.title.trim());
    onConfirm({
      sections: activeSections,
      totalSlides,
      structurePrompt: buildPlanPrompt(activeSections, totalSlides),
    });
  };

  return (
    <Card className="w-full max-w-5xl mx-auto border-border/60 shadow-xl bg-background/95">
      <CardHeader className="border-b border-border/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ListChecks className="h-5 w-5" />
              </span>
              Storyboard du livrable
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
              {template?.name || "Livrable personnalisé"} · {prompt.trim().slice(0, 110)}
              {prompt.trim().length > 110 ? "..." : ""}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Total</div>
            <div className="text-2xl font-bold text-foreground">{totalSlides} slides</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-3">
          {sections.map((section, index) => (
            <Reorder.Item key={section.id} value={section}>
              <motion.div
                layout
                className={`rounded-xl border bg-card p-4 transition ${section.included ? "border-border/70" : "border-border/30 opacity-60"}`}
              >
                <div className="grid gap-3 md:grid-cols-[auto_auto_1fr_150px_112px_auto] md:items-center">
                  <div className="cursor-grab text-muted-foreground active:cursor-grabbing">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {index + 1}
                  </div>
                  <Input
                    value={section.title}
                    onChange={(event) => updateSection(section.id, { title: event.target.value })}
                    className="h-10 border-border/70 bg-background font-medium"
                  />
                  <Select value={section.visual} onValueChange={(value) => updateSection(section.id, { visual: value as StoryboardVisual })}>
                    <SelectTrigger className="h-10 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISUAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            {option.icon}
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background px-2 py-1">
                    <button
                      type="button"
                      onClick={() => updateSection(section.id, { slideCount: Math.max(1, section.slideCount - 1) })}
                      className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold tabular-nums">{section.slideCount}</span>
                    <button
                      type="button"
                      onClick={() => updateSection(section.id, { slideCount: Math.min(10, section.slideCount + 1) })}
                      className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <Switch checked={section.included} onCheckedChange={(checked) => updateSection(section.id, { included: checked })} />
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Supprimer cette partie"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={addSection} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une partie
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onBack} disabled={isGenerating}>
              Retour
            </Button>
            <Button onClick={confirm} disabled={totalSlides === 0 || isGenerating} className="gap-2 bg-primary text-white hover:bg-primary/90">
              {isGenerating ? "Génération..." : "Valider et générer"}
              {!isGenerating && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

