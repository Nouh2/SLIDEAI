import { motion, useReducedMotion } from "framer-motion";
import { Zap, Palette, Brain, Clock, Share2, Layers } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { createCardVariants, premiumTransition, viewportPreset } from "./motionPresets";

export function FeatureGrid() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const shouldReduceMotion = useReducedMotion();
  const prefersCompactMotion = isMobile || shouldReduceMotion;
  const cardVariants = createCardVariants(prefersCompactMotion);

  const features = [
    {
      id: 1,
      title: t('tools.items.fastGen.title'),
      description: t('tools.items.fastGen.desc'),
      icon: Zap,
      size: "col-span-1 md:col-span-2 row-span-1",
      gradient: "from-primary/20 to-secondary/20",
      accent: "primary",
    },
    {
      id: 2,
      title: t('tools.items.smartDesign.title'),
      description: t('tools.items.smartDesign.desc'),
      icon: Brain,
      size: "col-span-1 row-span-1",
      gradient: "from-secondary/20 to-accent/20",
      accent: "secondary",
    },
    {
      id: 3,
      title: t('tools.items.smartPalettes.title'),
      description: t('tools.items.smartPalettes.desc'),
      icon: Palette,
      size: "col-span-1 row-span-1",
      gradient: "from-accent/20 to-primary/20",
      accent: "accent",
    },
    {
      id: 4,
      title: t('tools.items.fastEdit.title'),
      description: t('tools.items.fastEdit.desc'),
      icon: Clock,
      size: "col-span-1 md:col-span-2 row-span-1",
      gradient: "from-primary/20 to-accent/20",
      accent: "primary",
    },
    {
      id: 5,
      title: t('tools.items.shareExport.title'),
      description: t('tools.items.shareExport.desc'),
      icon: Share2,
      size: "col-span-1 md:col-span-3 row-span-1",
      gradient: "from-secondary/20 to-primary/20",
      accent: "secondary",
    },
  ];
  return (
    <section className="relative pt-4 pb-8 md:pt-4 md:pb-12 px-4 overflow-hidden z-10">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-0 right-1/4 w-60 md:w-96 h-60 md:h-96 bg-secondary/10 rounded-full blur-3xl animate-float-slow opacity-40" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full glass-premium text-sm md:text-base">
            <Layers className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary" />
            <span className="text-foreground/80">{t('tools.pill')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">
            {t('tools.title')}
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-max">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.id}
                variants={cardVariants}
                initial="hidden"
                whileInView="visible"
                transition={{ ...premiumTransition, delay: prefersCompactMotion ? index * 0.035 : index * 0.07 }}
                viewport={viewportPreset}
                className={`${feature.size} group`}
              >
                <motion.div
                  whileHover={prefersCompactMotion ? undefined : { y: -6, scale: 1.008 }}
                  transition={premiumTransition}
                  className={`glass-premium p-6 md:p-8 h-full rounded-2xl border border-primary/10 hover:border-primary/30 transition-[border-color,box-shadow] duration-500 cursor-pointer overflow-hidden relative will-change-transform`}
                >
                  {/* Background gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} />

                  {/* Animated accent line */}
                  <div className={`absolute top-0 left-0 h-1 bg-gradient-to-r from-${feature.accent} to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative z-10 space-y-4">
                    <motion.div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300"
                      whileHover={prefersCompactMotion ? undefined : { rotate: 8 }}
                    >
                      <Icon className="w-6 h-6" />
                    </motion.div>

                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-base md:text-lg text-foreground/60 group-hover:text-foreground/80 transition-colors mt-2 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    {/* Hover indicator */}
                    <motion.div
                      className="flex items-center gap-2 text-sm md:text-base text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -10 }}
                      whileHover={prefersCompactMotion ? undefined : { x: 0 }}
                    >
                      <span className="font-medium">{t('tools.learnMore')}</span>
                      <motion.span animate={prefersCompactMotion ? undefined : { x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.7, ease: "easeInOut" }}>
                        →
                      </motion.span>
                    </motion.div>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-300 -z-10" />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
