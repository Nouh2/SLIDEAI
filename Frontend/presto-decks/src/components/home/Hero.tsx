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
        <section className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 md:py-24 relative overflow-hidden will-change-transform">
            {/* SlideAI DNA: Grid Background */}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

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
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight px-2">
                        {t('hero.title1')} <br />
                        <span className="text-gradient relative inline-block">
                            {t('hero.title2')}
                            <svg className="absolute w-full h-2 md:h-3 -bottom-1 left-0 text-primary opacity-50" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        </span>{" "}
                        {t('hero.title3')}
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                        {t('hero.subtitle')}
                    </p>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                    <Button
                        size="lg"
                        onClick={() => navigate("/create")}
                        className="h-14 px-8 text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {t('hero.cta')}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => navigate("/examples")}
                        className="h-14 px-8 text-base font-bold rounded-xl border-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all"
                    >
                        {t('hero.viewExamples')}
                    </Button>
                </motion.div>


            </motion.div>
        </section>
    );
}

