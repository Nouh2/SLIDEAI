import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, Variants } from "framer-motion";

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
        <section className="min-h-[70vh] flex flex-col items-center justify-center py-10 px-4 md:py-16 relative z-10 overflow-hidden will-change-transform">

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
                </motion.div>


            </motion.div>
        </section>
    );
}

