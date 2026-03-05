import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";
import generationShowcase from "@/assets/generation-showcase.png";
import editorShowcase from "@/assets/editor-showcase.png";
import dashboardShowcase from "@/assets/dashboard-showcase.png";

export function DemoFlowSection() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFr = i18n.language.startsWith("fr");
  const ctaPath = user ? "/create" : `/auth?returnTo=${encodeURIComponent("/create")}`;

  const steps = isFr
    ? [
      { title: "1. Import", desc: "Ajoutez votre document ou votre brief.", image: generationShowcase },
      { title: "2. Generation", desc: "Obtenez une base de deck structuree.", image: editorShowcase },
      { title: "3. Livraison", desc: "Ajustez et exportez en PPTX/PDF.", image: dashboardShowcase },
    ]
    : [
      { title: "1. Import", desc: "Add your document or brief.", image: generationShowcase },
      { title: "2. Generate", desc: "Get a structured deck draft.", image: editorShowcase },
      { title: "3. Deliver", desc: "Polish and export to PPTX/PDF.", image: dashboardShowcase },
    ];

  const handleCta = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Landing Demo 60s CTA"
    );
    navigate(ctaPath);
  };

  return (
    <section className="py-8 md:py-10 px-4 relative z-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-5xl font-bold">
            {isFr ? "Demo produit en 60 secondes" : "60-second product demo"}
          </h2>
          <p className="text-lg text-muted-foreground">
            {isFr ? "Le flux complet: document -> slides -> livraison client." : "Full flow: document -> slides -> client delivery."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div key={step.title} className="rounded-2xl border border-border/60 bg-card/60 overflow-hidden">
              <div className="aspect-video bg-muted/40">
                <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-1">
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="text-base text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button onClick={handleCta} size="lg" className="font-bold">
            <Sparkles className="w-4 h-4 mr-2" />
            {isFr ? "Demarrer mon essai 7 jours" : "Start my 7-day trial"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
