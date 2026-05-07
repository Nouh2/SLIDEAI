import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Wand2, Layout, Zap } from "lucide-react";

import editorShowcase from "@/assets/editor-showcase.png";
import dashboardShowcase from "@/assets/dashboard-showcase.png";
import generationShowcase from "@/assets/generation-showcase.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { createRevealVariants, premiumTransition, viewportPreset } from "./motionPresets";

export function ProductShowcase() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const shouldReduceMotion = useReducedMotion();
    const prefersCompactMotion = isMobile || shouldReduceMotion;

    const features = [
        {
            id: "generation",
            title: t('productShowcase.features.generation.title', "AI Generation"),
            description: t('productShowcase.features.generation.description', "Transform your ideas into professional slides instantly with our advanced AI."),
            icon: Wand2,
            image: generationShowcase,
            reverse: false,
        },
        {
            id: "editor",
            title: t('productShowcase.features.editor.title', "Powerful Editor"),
            description: t('productShowcase.features.editor.description', "Fine-tune every detail with our intuitive, real-time editor designed for speed."),
            icon: Layout,
            image: editorShowcase,
            reverse: true,
        },
        {
            id: "dashboard",
            title: t('productShowcase.features.dashboard.title', "Smart Dashboard"),
            description: t('productShowcase.features.dashboard.description', "Manage your presentations efficiently with an organized and beautiful workspace."),
            icon: Zap,
            image: dashboardShowcase,
            reverse: false,
        },
    ];
    const textVariants = createRevealVariants(prefersCompactMotion, 26);
    const imageVariants = createRevealVariants(prefersCompactMotion, 34);

    return (
        <section className="relative pt-4 pb-8 md:pt-4 md:pb-12 px-4 overflow-hidden z-10">
            {/* Background decorations */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

            {/* Added Header */}
            <div className="max-w-4xl mx-auto text-center mb-12 space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    {t('landingProductShowcase.title')}
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground">
                    {t('landingProductShowcase.subtitle')}
                </p>
            </div>

            <div className="max-w-7xl mx-auto space-y-16 md:space-y-20">
                {features.map((feature, index) => (
                    <div
                        key={feature.id}
                        className={`flex flex-col ${feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-10 md:gap-14`}
                    >
                        {/* Text Content */}
                        <motion.div
                            className="w-full md:basis-[34%] md:flex-none space-y-5"
                            variants={textVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={viewportPreset}
                        >
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                                {feature.title}
                            </h3>
                            <p className="text-xl text-foreground/60 leading-relaxed max-w-md">
                                {feature.description}
                            </p>
                        </motion.div>

                        {/* Image/Visual Content */}
                        <motion.div
                            className="w-full md:basis-[66%] md:flex-none"
                            variants={imageVariants}
                            initial="hidden"
                            whileInView="visible"
                            transition={{ ...premiumTransition, delay: prefersCompactMotion ? 0.04 : 0.12 }}
                            viewport={viewportPreset}
                        >
                            <motion.div
                                whileHover={prefersCompactMotion ? undefined : { y: -6, scale: 1.01 }}
                                transition={premiumTransition}
                                className="relative group rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/50 bg-background will-change-transform"
                            >
                                <img
                                    src={feature.image}
                                    alt={feature.title}
                                    className="block w-full h-auto rounded-2xl"
                                />
                            </motion.div>
                        </motion.div>
                    </div>
                ))}
            </div>
        </section>
    );
}
