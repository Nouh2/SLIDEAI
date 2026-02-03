import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { DeckPreview } from "@/components/home/DeckPreview";

export function Hero() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };

    return (
        <section className="min-h-[70vh] flex flex-col items-center justify-center py-10 px-4 md:py-16 relative z-10 overflow-hidden"
            style={{ willChange: 'transform' }}>

            {/* Animated background elements */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse-glow" />
                <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-secondary/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
            </div>

            <motion.div
                className="max-w-5xl w-full space-y-8 md:space-y-10"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Badge */}
                <motion.div variants={itemVariants} className="flex justify-center">
                    <div className="inline-flex items-center space-x-2 rounded-full glass-premium px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm backdrop-blur-xl border border-white/10 shadow-glow">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-foreground/80 font-medium text-[10px] md:text-xs uppercase tracking-wider">{t('hero.badge')}</span>
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.div variants={itemVariants} className="text-center space-y-4 md:space-y-6">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight px-2 max-w-5xl mx-auto">
                        {t('hero.title')}
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                        {t('hero.subtitle')}
                    </p>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 pt-8">
                    <Button
                        size="lg"
                        onClick={() => navigate("/create")}
                        className="h-14 px-8 text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {t('hero.cta')}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>

                    {/* Micro-proofs */}
                    <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span className="text-green-500">✔</span>
                            <span>{t('hero.microProofs.target')}</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-muted-foreground/30 rounded-full" />
                        <div className="flex items-center gap-2">
                            <span className="text-green-500">✔</span>
                            <span>{t('hero.microProofs.roi')}</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-muted-foreground/30 rounded-full" />
                        <div className="flex items-center gap-2">
                            <span className="text-green-500">✔</span>
                            <span>{t('hero.microProofs.features')}</span>
                        </div>
                    </div>

                    {/* SOCIAL PROOF */}
                    <div className="pt-8 flex flex-col items-center gap-3 animate-fade-in-up delay-300">
                        <div className="flex -space-x-3">
                            <img className="w-10 h-10 rounded-full border-2 border-background" src="https://i.pravatar.cc/100?img=1" alt="User" />
                            <img className="w-10 h-10 rounded-full border-2 border-background" src="https://i.pravatar.cc/100?img=5" alt="User" />
                            <img className="w-10 h-10 rounded-full border-2 border-background" src="https://i.pravatar.cc/100?img=8" alt="User" />
                            <img className="w-10 h-10 rounded-full border-2 border-background" src="https://i.pravatar.cc/100?img=12" alt="User" />
                        </div>
                        <div className="text-sm font-medium">
                            <span className="text-primary font-bold">{t('socialProof.stats.generatedCount').split(' ')[0]}</span> {t('socialProof.stats.generatedCount').split(' ').slice(1).join(' ')}
                        </div>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                                <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">{t('socialProof.stats.rating')}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Deck Preview Section */}
                <motion.div variants={itemVariants} className="w-full pt-12 md:pt-20">
                    <DeckPreview />
                </motion.div>


            </motion.div>
        </section>
    );
}

