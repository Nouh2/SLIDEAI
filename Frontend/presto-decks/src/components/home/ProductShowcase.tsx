import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Wand2, Layout, Share2, Zap } from "lucide-react";

import editorShowcase from "@/assets/editor-showcase.png";
import dashboardShowcase from "@/assets/dashboard-showcase.png";
import generationShowcase from "@/assets/generation-showcase.png";

export function ProductShowcase() {
    const { t } = useTranslation();

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

    return (
        <section className="relative py-12 md:py-20 px-4 overflow-hidden z-10">
            {/* Background decorations */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

            {/* Added Header */}
            <div className="max-w-4xl mx-auto text-center mb-20 space-y-6">
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                    {t('landingProductShowcase.title')}
                </h2>
                <p className="text-lg md:text-xl text-muted-foreground">
                    {t('landingProductShowcase.subtitle')}
                </p>
            </div>

            <div className="max-w-7xl mx-auto space-y-32">
                {features.map((feature, index) => (
                    <div
                        key={feature.id}
                        className={`flex flex-col ${feature.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}
                    >
                        {/* Text Content */}
                        <motion.div
                            className="flex-1 space-y-6"
                            initial={{ opacity: 0, x: feature.reverse ? 50 : -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            viewport={{ once: true, margin: "-100px" }}
                        >
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold leading-tight">
                                {feature.title}
                            </h3>
                            <p className="text-lg text-foreground/60 leading-relaxed max-w-lg">
                                {feature.description}
                            </p>
                        </motion.div>

                        {/* Image/Visual Content */}
                        <motion.div
                            className="flex-1 w-full"
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                            viewport={{ once: true, margin: "-100px" }}
                        >
                            <div className="relative group rounded-2xl overflow-hidden shadow-2xl ring-1 ring-border/50 bg-card/50 backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />
                                <img
                                    src={feature.image}
                                    alt={feature.title}
                                    className="w-full h-auto rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                                />
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>
        </section>
    );
}
