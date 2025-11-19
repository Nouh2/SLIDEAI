export interface Slide {
  title: string;
  bullets: string[];
  layout: string;
  accent: string;
  bg: string;
  illustration: {
    type: string;
    name: string;
  };
}

export interface Example {
  title: string;
  prompt: string;
  theme: string;
  thumbnail?: string;
  slides: Slide[];
}

export const examples: Example[] = [
  {
    title: "Pitch Deck Série A",
    prompt: "Fais-moi un pitch deck Série A de 10 slides pour investisseurs dans la tech.",
    theme: "Modern-01",
    slides: [
      {
        title: "Problème & Opportunité",
        bullets: [
          "Les équipes perdent 5h par deck en moyenne",
          "Incohérence graphique = perte de crédibilité",
          "Timing : explosion des usages IA → standard à créer"
        ],
        layout: "title-left-bullets-right-illustration",
        accent: "#5B8CFF",
        bg: "gradient-to-br from-[#0B0F19] to-[#111827]",
        illustration: { type: "icon", name: "alert-triangle" }
      },
      {
        title: "Solution",
        bullets: [
          "Génération de slides en 5 minutes",
          "Templates adaptatifs à la charte",
          "Export .pptx, PDF, Google Slides"
        ],
        layout: "title-top-bullets-bottom",
        accent: "#22C55E",
        bg: "from-[#0B0F19] to-[#0F172A] bg-gradient-to-b",
        illustration: { type: "icon", name: "wand-2" }
      },
      {
        title: "Traction",
        bullets: ["2 000 utilisateurs bêta", "NPS 63", "Taux d'export PPTX : 48%"],
        layout: "title-left-metrics-right",
        accent: "#5B8CFF",
        bg: "bg-[#0B0F19]",
        illustration: { type: "icon", name: "trending-up" }
      }
    ]
  },
  {
    title: "Cours : Changement climatique",
    prompt: "Crée un cours PowerPoint de 12 slides sur le changement climatique pour des étudiants de licence.",
    theme: "Minimal-Grid",
    slides: [
      {
        title: "Introduction : définitions & enjeux",
        bullets: ["Climat vs météo", "Tendances globales", "Pourquoi c'est critique"],
        layout: "title-top-bullets-bottom",
        accent: "#0EA5E9",
        bg: "bg-[#F7F8FB]",
        illustration: { type: "icon", name: "globe-2" }
      },
      {
        title: "Causes principales",
        bullets: ["CO2, CH4, N2O", "Industrie & transport", "Agriculture"],
        layout: "title-left-bullets-right-illustration",
        accent: "#0EA5E9",
        bg: "bg-white",
        illustration: { type: "icon", name: "factory" }
      },
      {
        title: "Conséquences",
        bullets: ["Fonte des glaces", "Montée des eaux", "Extrêmes météo"],
        layout: "title-top-columns",
        accent: "#0EA5E9",
        bg: "bg-[#F7F8FB]",
        illustration: { type: "icon", name: "cloud-lightning" }
      }
    ]
  },
  {
    title: "Plan marketing Q3",
    prompt: "Prépare un plan marketing Q3 pour une startup SaaS B2B.",
    theme: "Bold-Contrast",
    slides: [
      {
        title: "Objectifs Q3",
        bullets: ["+30% leads", "+20% conv.", "Retention: +10%"],
        layout: "title-left-metrics-right",
        accent: "#F59E0B",
        bg: "bg-black",
        illustration: { type: "icon", name: "target" }
      },
      {
        title: "Canaux",
        bullets: ["LinkedIn Ads", "Webinars", "SEO"],
        layout: "title-top-bullets-bottom",
        accent: "#F59E0B",
        bg: "from-black to-[#111827] bg-gradient-to-br",
        illustration: { type: "icon", name: "megaphone" }
      }
    ]
  }
];
