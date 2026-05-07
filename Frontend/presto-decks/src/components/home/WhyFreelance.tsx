import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock, Target, Briefcase, Rocket } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { createCardVariants, createStaggerContainer, viewportPreset } from "./motionPresets";

export function WhyFreelance() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const shouldReduceMotion = useReducedMotion();
    const prefersCompactMotion = isMobile || shouldReduceMotion;

    const containerVariants = createStaggerContainer(prefersCompactMotion);
    const cardVariants = createCardVariants(prefersCompactMotion);

    const points = [
        { icon: Clock, text: t('whyFreelance.points.time'), color: "text-blue-400" },
        { icon: Target, text: t('whyFreelance.points.structure'), color: "text-purple-400" },
        { icon: Briefcase, text: t('whyFreelance.points.impress'), color: "text-pink-400" },
        { icon: Rocket, text: t('whyFreelance.points.deliver'), color: "text-orange-400" },
    ];

    return (
        <section className="pt-4 pb-8 md:pt-4 md:pb-10 px-4 relative overflow-hidden z-10">
            <div className="absolute inset-x-0 top-10 -z-10 mx-auto h-64 max-w-4xl rounded-full bg-primary/10 blur-3xl opacity-15" />

            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        {t('whyFreelance.title')}
                    </h2>
                </div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportPreset}
                >
                    {points.map((point, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            whileHover={prefersCompactMotion ? undefined : { y: -5, scale: 1.008 }}
                            className="glass-premium p-6 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-primary/20 transition-[border-color,box-shadow,transform] duration-500 will-change-transform"
                        >
                            <div className={`p-3 rounded-xl bg-white/5 ${point.color}`}>
                                <point.icon className="w-6 h-6" />
                            </div>
                            <p className="text-lg md:text-xl font-medium text-foreground/90">{point.text}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
