import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Hero } from "@/components/home/Hero";
import { DeckPreview } from "@/components/home/DeckPreview";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { SocialProof } from "@/components/home/SocialProof";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <Hero />

      {/* Deck Preview Section */}
      <DeckPreview />

      {/* Features Section */}
      <FeatureGrid />

      {/* Social Proof Section */}
      <SocialProof />

      {/* Bottom CTA Section */}
      <section className="relative py-12 md:py-32 px-4 overflow-hidden border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 md:w-96 h-60 md:h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-40" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold px-2">
              {t('home.ctaTitle')}<br />
              <span className="text-gradient-secondary">{t('home.ctaTitleHighlight')}</span>
            </h2>
            <p className="text-base md:text-lg text-foreground/60 max-w-2xl mx-auto px-4">
              {t('home.ctaSubtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 px-4">
            <Button
              size="lg"
              onClick={() => navigate("/create")}
              className="h-12 md:h-14 text-sm md:text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {t('home.ctaButton')}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="h-12 md:h-14 text-sm md:text-base font-bold rounded-xl border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all w-full sm:w-auto"
            >
              {t('home.viewPricing')}
            </Button>
          </div>

          <p className="text-xs md:text-sm text-foreground/50 font-medium px-4">
            {t('home.freeNote')}
          </p>
        </div>
      </section>
    </div>
  );
}

