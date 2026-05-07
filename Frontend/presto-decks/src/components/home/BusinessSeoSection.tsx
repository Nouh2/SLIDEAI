import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { seoLandingLinks } from "@/content/seo/marketingPages";
import { useIsMobile } from "@/hooks/use-mobile";
import { createCardVariants, createRevealVariants, createStaggerContainer, viewportPreset } from "./motionPresets";

export function BusinessSeoSection() {
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const prefersCompactMotion = isMobile || shouldReduceMotion;
  const containerVariants = createStaggerContainer(prefersCompactMotion);
  const revealVariants = createRevealVariants(prefersCompactMotion, 24);
  const cardVariants = createCardVariants(prefersCompactMotion);

  return (
    <section className="pt-4 pb-8 md:pt-4 md:pb-10 px-4 relative z-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div
          className="text-center space-y-3"
          variants={revealVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportPreset}
        >
          <h2 className="text-3xl md:text-5xl font-bold">Pages a forte intention pour vos presentations IA</h2>
          <p className="max-w-3xl mx-auto text-muted-foreground">
            Un cluster de pages pour capter les recherches les plus proches de l'action, puis renvoyer vers l'essai ou les exemples.
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 xl:grid-cols-4 gap-5"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={viewportPreset}
        >
          {seoLandingLinks.map((page) => (
            <motion.div key={page.href} variants={cardVariants}>
              <Link
                to={page.href}
                className="block h-full rounded-2xl border border-border/60 bg-card/50 p-6 transition-[border-color,box-shadow,transform] duration-500 hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
                  {page.shortLabel}
                </div>
                <h3 className="text-xl font-bold mb-3">{page.title}</h3>
                <p className="text-sm leading-7 text-muted-foreground">{page.description}</p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
