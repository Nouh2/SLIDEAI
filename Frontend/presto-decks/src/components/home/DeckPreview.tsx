import { motion, useReducedMotion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { premiumEase, premiumTransition, viewportPreset } from "./motionPresets";

export function DeckPreview() {
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const shouldReduceMotion = useReducedMotion();
    const prefersCompactMotion = isMobile || shouldReduceMotion;

    const examples = [
        t('livrables.examples.audit'),
        t('livrables.examples.reco'),
        t('livrables.examples.reporting'),
        t('livrables.examples.pitch'),
        t('livrables.examples.strategy'),
    ];
    const deckTransition = {
        duration: prefersCompactMotion ? 0.78 : 0.95,
        ease: premiumEase,
    };

    return (
        <section className="relative w-full py-10 md:py-16 px-4 overflow-hidden z-10">
            {/* Section Background */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
                <div className="absolute top-1/2 left-1/4 w-60 md:w-96 h-60 md:h-96 bg-primary/10 rounded-full blur-3xl animate-float-slow opacity-30" />
            </div>

            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-10 md:mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full glass-premium text-xs md:text-sm">
                        <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary" />
                        <span className="text-foreground/80">{t('livrables.badge')}</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold">
                        {t('livrables.title')}
                    </h2>
                    <p className="text-xl text-muted-foreground">{t('livrables.subtitle')}</p>

                    {/* Livrables List */}
                    <div className="flex flex-wrap justify-center gap-3 mt-6">
                        {examples.map((ex, i) => (
                            <span key={i} className="px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-base md:text-lg font-medium text-foreground/80">
                                {ex}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 3D Deck Preview */}
                <div className="relative w-full max-w-5xl mx-auto h-[400px] md:h-[500px] perspective-1000" style={{ willChange: 'transform' }}>
                    <div className="absolute inset-0 flex items-center justify-center" style={{
                        perspective: "1200px",
                    }}>
                        {/* Slide 3 (Back) */}
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: prefersCompactMotion ? 18 : 46,
                                filter: `blur(${prefersCompactMotion ? 6 : 10}px)`,
                                rotateY: prefersCompactMotion ? 0 : -5,
                                rotateX: prefersCompactMotion ? 0 : 8,
                                z: prefersCompactMotion ? 0 : -60,
                            }}
                            whileInView={{
                                opacity: prefersCompactMotion ? 0.32 : 0.42,
                                y: prefersCompactMotion ? -18 : -42,
                                filter: "blur(0px)",
                                rotateY: prefersCompactMotion ? 0 : -5,
                                rotateX: prefersCompactMotion ? 0 : 8,
                                z: prefersCompactMotion ? 0 : -60,
                            }}
                            transition={{ ...deckTransition, delay: prefersCompactMotion ? 0.04 : 0.08 }}
                            viewport={viewportPreset}
                            className="absolute w-[65%] md:w-[60%] aspect-video rounded-2xl border border-primary/10 shadow-lg overflow-hidden"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            <div className="w-full h-full bg-gradient-surface p-6 md:p-8 flex flex-col gap-4 opacity-60">
                                <div className="h-8 w-1/2 bg-primary/20 rounded-lg animate-pulse" />
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    <div className="bg-secondary/10 rounded-lg" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-primary/10 rounded" />
                                        <div className="h-4 w-3/4 bg-primary/10 rounded" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Slide 2 (Middle) */}
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: prefersCompactMotion ? 16 : 42,
                                filter: `blur(${prefersCompactMotion ? 6 : 10}px)`,
                                rotateY: prefersCompactMotion ? 0 : -2,
                                rotateX: prefersCompactMotion ? 0 : 4,
                                z: prefersCompactMotion ? 0 : -30,
                            }}
                            whileInView={{
                                opacity: prefersCompactMotion ? 0.62 : 0.72,
                                y: prefersCompactMotion ? -8 : -18,
                                filter: "blur(0px)",
                                rotateY: prefersCompactMotion ? 0 : -2,
                                rotateX: prefersCompactMotion ? 0 : 4,
                                z: prefersCompactMotion ? 0 : -30,
                            }}
                            transition={{ ...deckTransition, delay: prefersCompactMotion ? 0.08 : 0.16 }}
                            viewport={viewportPreset}
                            className="absolute w-[70%] md:w-[65%] aspect-video rounded-2xl border border-primary/20 shadow-neon overflow-hidden"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            <div className="w-full h-full bg-gradient-surface p-6 md:p-8 flex flex-col gap-6 opacity-80">
                                <div className="h-10 w-2/3 bg-primary/20 rounded-lg" />
                                <div className="flex-1 flex gap-6">
                                    <div className="w-1/3 space-y-3">
                                        <div className="h-4 w-full bg-secondary/15 rounded" />
                                        <div className="h-4 w-full bg-secondary/15 rounded" />
                                        <div className="h-4 w-2/3 bg-secondary/15 rounded" />
                                    </div>
                                    <div className="flex-1 bg-primary/5 rounded-lg border border-primary/10" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Slide 1 (Front - Hero) */}
                        <motion.div
                            initial={{ opacity: 0, y: prefersCompactMotion ? 14 : 28, filter: `blur(${prefersCompactMotion ? 6 : 10}px)` }}
                            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            transition={{ ...deckTransition, delay: prefersCompactMotion ? 0.12 : 0.24 }}
                            viewport={viewportPreset}
                            className="absolute w-[85%] md:w-[70%] aspect-[4/5] md:aspect-video rounded-2xl border-2 border-primary/40 shadow-neon-hover overflow-hidden z-10 glass-premium"
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            <div className="w-full h-full bg-gradient-accent rounded-2xl overflow-hidden relative group">
                                {/* Animated background elements */}
                                <div className="absolute inset-0">
                                    <motion.div
                                        className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
                                        animate={prefersCompactMotion ? undefined : {
                                            x: [0, 20, 0],
                                            y: [0, -20, 0]
                                        }}
                                        transition={{ duration: 8, repeat: Infinity }}
                                    />
                                    <motion.div
                                        className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/20 rounded-full blur-3xl"
                                        animate={prefersCompactMotion ? undefined : {
                                            x: [0, -20, 0],
                                            y: [0, 20, 0]
                                        }}
                                        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 p-4 md:p-10 flex flex-col justify-center items-center text-center space-y-2 md:space-y-6 z-10">
                                    <motion.div
                                        className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm"
                                        animate={prefersCompactMotion ? undefined : { scale: [1, 1.035, 1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                                        <span className="text-primary text-[10px] md:text-sm font-bold tracking-widest uppercase">{t('deckPreview.slide.brand')}</span>
                                    </motion.div>

                                    <h2 className="text-xl md:text-4xl font-bold text-foreground leading-tight">
                                        {t('deckPreview.slide.title')}<br />
                                        <span className="text-gradient-primary">{t('deckPreview.slide.highlight')}</span>
                                    </h2>

                                    <p className="text-muted-foreground text-sm md:text-lg max-w-md leading-relaxed font-medium line-clamp-3 md:line-clamp-none">
                                        {t('deckPreview.slide.desc')}
                                    </p>
                                    <p className="text-[10px] md:text-xs text-muted-foreground/60 uppercase tracking-wider font-semibold mt-1">
                                        {t('deckPreview.slide.subFooter')}
                                    </p>

                                    {/* Indicators */}
                                    <div className="flex gap-3 mt-4 md:mt-6">
                                        <motion.div
                                            className="h-3 w-3 rounded-full bg-primary"
                                            animate={prefersCompactMotion ? undefined : { scale: [1, 1.16, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        <motion.div
                                            className="h-3 w-3 rounded-full bg-primary/60"
                                            animate={prefersCompactMotion ? undefined : { scale: [1, 1.16, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                                        />
                                        <motion.div
                                            className="h-3 w-3 rounded-full bg-primary/30"
                                            animate={prefersCompactMotion ? undefined : { scale: [1, 1.16, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Info */}
                <motion.div
                    initial={{ opacity: 0, y: prefersCompactMotion ? 14 : 28, filter: `blur(${prefersCompactMotion ? 6 : 10}px)` }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ ...premiumTransition, delay: prefersCompactMotion ? 0.08 : 0.3 }}
                    viewport={viewportPreset}
                    className="text-center mt-12 md:mt-16"
                >
                    <p className="text-lg font-medium text-gradient-primary">
                        {t('livrables.footer')}
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
