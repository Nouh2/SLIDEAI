import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Hero } from "@/components/home/Hero";
import { DeckPreview } from "@/components/home/DeckPreview";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { WhyFreelance } from "@/components/home/WhyFreelance";
import { HowItWorks } from "@/components/home/HowItWorks";
import { OfferSection } from "@/components/home/OfferSection";
import { SubscriptionSection } from "@/components/home/SubscriptionSection";
import { FaqSection } from "@/components/home/FaqSection";
import { SEO } from "@/components/common/SEO";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full relative">
      <SEO
        title="SlideAI - Créez des slides gagnantes en 5 minutes"
        description="Générez, éditez et partagez des présentations PowerPoint professionnelles avec l'IA. Gagnez du temps et impressionnez votre audience."
      />

      {/* SlideAI DNA: Grid Background - Full Page */}
      <div className="fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Hero Section */}
      <Hero />

      {/* Pourquoi Freelance */}
      <WhyFreelance />

      {/* Comment ça marche */}
      <HowItWorks />

      {/* Outils (FeatureGrid) */}
      <FeatureGrid />

      {/* Produit en action */}
      <ProductShowcase />

      {/* Offre 7€ */}
      <OfferSection />

      {/* Abonnement Pro */}
      <SubscriptionSection />

      {/* FAQ */}
      <FaqSection />

      {/* Bottom CTA Section */}
      <section className="relative py-12 md:py-20 px-4 overflow-hidden border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 md:w-96 h-60 md:h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-40" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold px-2">
              {t('finalCta.title')}
            </h2>
            <p className="text-base md:text-lg text-foreground/60 max-w-2xl mx-auto px-4 whitespace-pre-line">
              {t('finalCta.subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 px-4">
            <Button
              size="lg"
              onClick={() => navigate("/create")}
              className="h-12 md:h-14 text-sm md:text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {t('finalCta.button')}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

