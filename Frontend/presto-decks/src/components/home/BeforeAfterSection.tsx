import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";
import { useIsMobile } from "@/hooks/use-mobile";
import { createCardVariants, createRevealVariants, createStaggerContainer, viewportPreset } from "./motionPresets";

export function BeforeAfterSection() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isFr = i18n.language.startsWith("fr");
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const prefersCompactMotion = isMobile || shouldReduceMotion;
  const containerVariants = createStaggerContainer(prefersCompactMotion);
  const revealVariants = createRevealVariants(prefersCompactMotion, 24);
  const rowVariants = createCardVariants(prefersCompactMotion);

  const rows = isFr
    ? [
      {
        label: "Temps de préparation",
        before: "2 à 4h par présentation",
        after: "Base en quelques minutes",
      },
      {
        label: "Structure des slides",
        before: "Manuelle et répétitive",
        after: "Générée automatiquement",
      },
      {
        label: "Focus du consultant",
        before: "Mise en forme PowerPoint",
        after: "Analyse, recommandations, relation client",
      },
    ]
    : [
      {
        label: "Preparation time",
        before: "2 to 4h per presentation",
        after: "First draft in minutes",
      },
      {
        label: "Slide structure",
        before: "Manual and repetitive",
        after: "Automatically generated",
      },
      {
        label: "Consultant focus",
        before: "PowerPoint formatting work",
        after: "Analysis, recommendations, client relationships",
      },
    ];

  const handleCta = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Landing Before After CTA"
    );
    navigate("/pricing");
  };

  return (
    <section className="pt-4 pb-8 md:pt-4 md:pb-10 px-4 relative z-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          className="text-center space-y-2"
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportPreset}
        >
          <h2 className="text-3xl md:text-5xl font-bold">
            {isFr ? "Avant SlideAI vs Avec SlideAI" : "Before SlideAI vs With SlideAI"}
          </h2>
        </motion.div>

        <motion.div
          className="rounded-2xl border border-border/60 overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportPreset}
        >
          <div className="grid grid-cols-[1.05fr_0.95fr_1.1fr] md:grid-cols-3 bg-background/80 border-b border-border/60">
            <div className="min-w-0 p-3 md:p-4 font-bold text-sm md:text-lg leading-tight break-words">{isFr ? "Critere" : "Criteria"}</div>
            <div className="min-w-0 p-3 md:p-4 font-bold text-sm md:text-lg leading-tight text-muted-foreground break-words">{isFr ? "Avant" : "Before"}</div>
            <div className="min-w-0 p-3 md:p-4 font-bold text-sm md:text-lg leading-tight text-primary break-words">{isFr ? "Avec SlideAI" : "With SlideAI"}</div>
          </div>
          {rows.map((row) => (
            <motion.div key={row.label} variants={rowVariants} className="grid grid-cols-[1.05fr_0.95fr_1.1fr] md:grid-cols-3 border-b border-border/40 last:border-b-0 bg-card/40">
              <div className="min-w-0 p-3 md:p-4 text-sm md:text-base leading-snug font-medium break-words">{row.label}</div>
              <div className="min-w-0 p-3 md:p-4 text-sm md:text-base leading-snug text-muted-foreground break-words">{row.before}</div>
              <div className="min-w-0 p-3 md:p-4 text-sm md:text-base leading-snug font-semibold break-words">{row.after}</div>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center">
          <Button onClick={handleCta} size="lg" className="font-bold">
            <Sparkles className="w-4 h-4 mr-2" />
            {isFr ? "Profiter de l'offre à 9,90€" : "Get the 9.90€ offer"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
