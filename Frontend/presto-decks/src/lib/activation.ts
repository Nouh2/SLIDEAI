export type ActivationUseCaseId =
  | "pdf_to_powerpoint"
  | "client_pitch"
  | "business_report"
  | "training_course";

export type ActivationUseCase = {
  id: ActivationUseCaseId;
  title: string;
  description: string;
  templateId: string;
  slideCount: number;
  prompt: string;
};

export const ACTIVATION_USE_CASES: ActivationUseCase[] = [
  {
    id: "pdf_to_powerpoint",
    title: "Transformer un PDF",
    description: "Partez d'un document ou d'un brief et obtenez une base PowerPoint claire.",
    templateId: "corporate-report",
    slideCount: 10,
    prompt:
      "Transforme mon document en presentation PowerPoint professionnelle. Structure le contenu en parties claires, garde les chiffres importants, ajoute une slide de synthese et termine par les prochaines actions.",
  },
  {
    id: "client_pitch",
    title: "Pitch client",
    description: "Une reco ou proposition commerciale prete a presenter.",
    templateId: "consulting",
    slideCount: 9,
    prompt:
      "Cree une presentation de pitch client pour presenter le contexte, le probleme, notre recommandation, le plan d'action, les benefices attendus et les prochaines etapes.",
  },
  {
    id: "business_report",
    title: "Rapport business",
    description: "Un reporting clair pour direction, equipe ou client.",
    templateId: "corporate-report",
    slideCount: 12,
    prompt:
      "Cree un rapport business mensuel avec synthese executive, indicateurs cles, faits marquants, analyse des ecarts, risques, opportunites et plan d'action priorise.",
  },
  {
    id: "training_course",
    title: "Support de cours",
    description: "Un support pedagogique structure pour expliquer un sujet.",
    templateId: "educational",
    slideCount: 12,
    prompt:
      "Cree un support de cours clair avec objectifs pedagogiques, notions cles, exemples concrets, exercices rapides, recapitulatif et slide de conclusion.",
  },
];

export function getActivationUseCase(id?: string | null) {
  return ACTIVATION_USE_CASES.find((item) => item.id === id) || null;
}
