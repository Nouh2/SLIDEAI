import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { createCardVariants, createStaggerContainer, viewportPreset } from "./motionPresets";
import { IsoIllustration } from "./IsoIllustration";

export function HowItWorks() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const shouldReduceMotion = useReducedMotion();
    const prefersCompactMotion = isMobile || shouldReduceMotion;

    const containerVariants = createStaggerContainer(prefersCompactMotion);
    const stepVariants = createCardVariants(prefersCompactMotion);

    const steps = [
        {
            illustration: "import" as const,
            title: t('howItWorks.steps.1.title'),
            desc: t('howItWorks.steps.1.desc'),
        },
        {
            illustration: "generate" as const,
            title: t('howItWorks.steps.2.title'),
            desc: t('howItWorks.steps.2.desc'),
        },
        {
            illustration: "deliver" as const,
            title: t('howItWorks.steps.3.title'),
            desc: t('howItWorks.steps.3.desc'),
        },
    ];

    return (
        <section className="pt-4 pb-8 md:pt-6 md:pb-12 px-4 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 md:mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-3">{t('howItWorks.title')}</h2>
                </div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportPreset}
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            variants={stepVariants}
                            className="relative flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-white/60 backdrop-blur-sm px-6 py-8 text-center shadow-[0_18px_48px_-30px_rgba(15,42,69,0.35)] transition-shadow duration-300 hover:shadow-[0_24px_60px_-30px_rgba(15,42,69,0.45)]"
                        >
                            <div className="relative w-full max-w-[220px]">
                                <IsoIllustration name={step.illustration} />
                                <div className="absolute -top-2 -left-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white shadow-md ring-4 ring-white">
                                    {index + 1}
                                </div>
                            </div>
                            <div className="space-y-2 max-w-sm">
                                <h3 className="text-xl md:text-2xl font-bold">{step.title}</h3>
                                <p className="text-base text-foreground/65">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <div className="mt-6 text-center">
                    <p className="text-base md:text-lg font-semibold text-primary">{t('howItWorks.time')}</p>
                </div>
            </div>
        </section>
    );
}
