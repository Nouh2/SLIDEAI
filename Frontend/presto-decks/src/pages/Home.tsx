import { useNavigate } from "react-router-dom";
import { Hero } from "@/components/home/Hero";
import { DeckPreview } from "@/components/home/DeckPreview";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { SocialProof } from "@/components/home/SocialProof";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

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
      <section className="relative py-20 md:py-32 px-4 overflow-hidden border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-40" />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Prêt à créer votre<br />
              <span className="text-gradient-secondary">présentation de rêve ?</span>
            </h2>
            <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
              Rejoignez des milliers de professionnels qui transforment leurs idées en présentations exceptionnelles avec SlideAI
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate("/create")}
              className="h-14 text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Commencer maintenant
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/pricing")}
              className="h-14 text-base font-bold rounded-xl border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all"
            >
              Voir les tarifs
            </Button>
          </div>

          <p className="text-sm text-foreground/50 font-medium">
            ✨ Gratuit pour les 5 premières présentations · Pas de carte bancaire requise
          </p>
        </div>
      </section>
    </div>
  );
}
