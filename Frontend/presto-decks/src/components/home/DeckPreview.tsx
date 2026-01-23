import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

import { useTranslation } from "react-i18next";

export function DeckPreview() {
    const { t } = useTranslation();
    return (
        <section className="relative w-full py-12 md:py-20 px-4 overflow-hidden">
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
                        <span className="text-foreground/80">{t('deckPreview.badge')}</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold">
                        {t('deckPreview.title.main')}<br />
                        <span className="text-gradient-secondary">{t('deckPreview.title.highlight')}</span>
                    </h2>
                </div>

                {/* 3D Deck Preview */}
                <div className="relative w-full max-w-5xl mx-auto h-[280px] md:h-[500px] perspective-1000">
                    <div className="absolute inset-0 flex items-center justify-center" style={{
                        perspective: "1200px",
                    }}>
                        {/* Slide 3 (Back) */}
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.85 }}
                            whileInView={{ opacity: 0.4, y: -50, scale: 0.88 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="absolute w-[65%] md:w-[60%] aspect-video rounded-2xl border border-primary/10 shadow-lg overflow-hidden"
                            style={{
                                transform: "translateZ(-60px) rotateY(-5deg) rotateX(8deg)",
                            }}
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
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            whileInView={{ opacity: 0.7, y: -20, scale: 0.94 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="absolute w-[70%] md:w-[65%] aspect-video rounded-2xl border border-primary/20 shadow-neon overflow-hidden"
                            style={{
                                transform: "translateZ(-30px) rotateY(-2deg) rotateX(4deg)",
                            }}
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
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="absolute w-[75%] md:w-[70%] aspect-video rounded-2xl border-2 border-primary/40 shadow-neon-hover overflow-hidden z-10 glass-premium"
                            style={{
                                transform: "translateZ(0px)",
                            }}
                        >
                            <div className="w-full h-full bg-gradient-accent rounded-2xl overflow-hidden relative group">
                                {/* Animated background elements */}
                                <div className="absolute inset-0">
                                    <motion.div
                                        className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
                                        animate={{
                                            x: [0, 20, 0],
                                            y: [0, -20, 0]
                                        }}
                                        transition={{ duration: 8, repeat: Infinity }}
                                    />
                                    <motion.div
                                        className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/20 rounded-full blur-3xl"
                                        animate={{
                                            x: [0, -20, 0],
                                            y: [0, 20, 0]
                                        }}
                                        transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center items-center text-center space-y-4 md:space-y-6 z-10">
                                    <motion.div
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-primary text-xs md:text-sm font-bold tracking-widest uppercase">{t('deckPreview.slide.brand')}</span>
                                    </motion.div>

                                    <h2 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
                                        {t('deckPreview.slide.title')}<br />
                                        <span className="text-gradient-primary">{t('deckPreview.slide.highlight')}</span>
                                    </h2>

                                    <p className="text-muted-foreground text-sm md:text-base max-w-md leading-relaxed font-medium">
                                        {t('deckPreview.slide.desc')}
                                    </p>

                                    {/* Indicators */}
                                    <div className="flex gap-3 mt-4 md:mt-6">
                                        <motion.div
                                            className="h-3 w-3 rounded-full bg-primary"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        <motion.div
                                            className="h-3 w-3 rounded-full bg-primary/60"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                                        />
                                        <motion.div
                                            className="h-3 w-3 rounded-full bg-primary/30"
                                            animate={{ scale: [1, 1.2, 1] }}
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
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-12 md:mt-16"
                >
                    <p className="text-muted text-sm md:text-base">
                        {t('deckPreview.footer')}
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
