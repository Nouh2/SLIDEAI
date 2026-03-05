import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

export function SocialProofSection() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const isFr = i18n.language.startsWith("fr");
  const ctaPath = user ? "/create" : `/auth?returnTo=${encodeURIComponent("/create")}`;

  const logos = isFr
    ? ["Cabinet RH", "Cabinet SEO", "Conseil en strategie", "Marketing B2B", "Freelance Ops", "Agence Growth"]
    : ["HR Consulting", "SEO Consulting", "Strategy Advisory", "B2B Marketing", "Freelance Ops", "Growth Agency"];

  const useCases = isFr
    ? [
      {
        title: "Consultant RH",
        before: "Diagnostic + plan de transformation a presenter au CODIR.",
        after: "Structure de deck produite en quelques minutes puis finalisation rapide.",
      },
      {
        title: "Consultant SEO",
        before: "Audit client mensuel avec beaucoup de slides d'analyse.",
        after: "Plan type genere automatiquement, avec focus sur recommandations.",
      },
      {
        title: "Directeur marketing",
        before: "Presentation trimestrielle de strategie, canaux et roadmap.",
        after: "Narratif clair et slides prêtes a partager plus vite en comite.",
      },
    ]
    : [
      {
        title: "HR Consultant",
        before: "Org diagnostic and transformation plan for leadership reviews.",
        after: "Deck structure generated in minutes, then fast final polishing.",
      },
      {
        title: "SEO Consultant",
        before: "Monthly client audits with many analysis slides.",
        after: "Standard structure generated automatically with recommendation focus.",
      },
      {
        title: "Marketing Director",
        before: "Quarterly strategy decks across channels and roadmap.",
        after: "Clear storyline and client-ready slides delivered faster.",
      },
    ];

  const caseStudy = isFr
    ? {
      title: "Mini etude de cas",
      context: "Contexte: mission de transformation RH pour une entreprise de 500 salaries.",
      before: "Avant: 2 a 4 heures pour structurer et designer le support de restitution.",
      after: "Avec SlideAI: premiere base en quelques minutes, puis ajustements finaux rapides.",
    }
    : {
      title: "Mini case study",
      context: "Context: HR transformation project for a 500-employee company.",
      before: "Before: 2 to 4 hours to structure and design the executive deck.",
      after: "With SlideAI: first draft in minutes, then quick final adjustments.",
    };

  const handleCta = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Landing Social Proof CTA"
    );
    navigate(ctaPath);
  };

  return (
    <section className="py-8 md:py-10 px-4 relative z-10">
      <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-5xl font-bold">
            {isFr ? "Preuve sociale B2B" : "B2B Social Proof"}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {isFr
              ? "Concu pour les equipes qui produisent des presentations clients chaque semaine."
              : "Built for teams that ship client-facing decks every single week."}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {logos.map((logo) => (
            <div
              key={logo}
              className="rounded-xl border border-border/70 bg-background/70 py-3 px-4 text-center text-sm md:text-base font-semibold text-foreground/80"
            >
              {logo}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {useCases.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-3">
              <h3 className="text-lg md:text-xl font-bold">{item.title}</h3>
              <p className="text-base text-muted-foreground">{item.before}</p>
              <p className="text-base font-medium text-foreground/90">{item.after}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8 space-y-3">
          <h3 className="text-xl md:text-2xl font-bold">{caseStudy.title}</h3>
          <p className="text-base md:text-lg text-foreground/80">{caseStudy.context}</p>
          <p className="text-base md:text-lg text-muted-foreground">{caseStudy.before}</p>
          <p className="text-base md:text-lg font-medium text-foreground">{caseStudy.after}</p>
        </div>

        <div className="text-center">
          <Button size="lg" onClick={handleCta} className="font-bold">
            <Sparkles className="w-4 h-4 mr-2" />
            {isFr ? "Demarrer mon essai 7 jours" : "Start my 7-day trial"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
