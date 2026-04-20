import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { DemoFlowSection } from "@/components/home/DemoFlowSection";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";
import { useLocalePath } from "@/hooks/use-locale-path";
import { homePageContent } from "@/content/seo/marketingPages";

export function Hero() {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const { localize } = useLocalePath();
    const isFr = i18n.language.startsWith("fr");
    const pageContent = isFr ? homePageContent.fr : homePageContent.en;
    const heroContent = pageContent.hero;
    const pageLabel = isFr ? "/" : "/en";

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

    const handleHeroCta = () => {
        Analytics.trackEvent(
            ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
            ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
            `Landing Hero CTA - ${pageLabel}`
        );
        navigate(`/auth?returnTo=${encodeURIComponent("/create")}`);
    };

    const handleExamplesCta = () => {
        Analytics.trackEvent("Navigation", "Examples Click", `Landing Hero Secondary CTA - ${pageLabel}`);
        navigate(localize("/examples"));
    };

    return (
        <section
            className="min-h-0 flex flex-col items-center justify-center pt-4 pb-4 px-4 md:pt-4 md:pb-8 relative z-10 overflow-hidden"
            style={{ willChange: "transform" }}
        >
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse-glow" />
                <div
                    className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-secondary/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse-glow"
                    style={{ animationDelay: "1s" }}
                />
            </div>

            <motion.div
                className="max-w-6xl w-full space-y-4 md:space-y-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="flex justify-center">
                    <div className="inline-flex items-center space-x-2 rounded-full glass-premium px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm backdrop-blur-xl border border-white/10 shadow-glow">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        <span className="text-foreground/80 font-medium text-xs md:text-sm uppercase tracking-wider">
                            {heroContent.badge}
                        </span>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="text-center space-y-3 md:space-y-4">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight px-2 max-w-5xl mx-auto">
                        {heroContent.headline}
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                        {heroContent.subtitle}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                        {heroContent.segments.map((segment) => (
                            <span
                                key={segment}
                                className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-sm md:text-base font-medium bg-secondary/20 border border-secondary/30 text-foreground/80"
                            >
                                {segment}
                            </span>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <SocialProofSection />
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 pt-2">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Button
                            size="lg"
                            onClick={handleHeroCta}
                            className="h-14 px-8 text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground"
                        >
                            <Sparkles className="w-5 h-5 mr-2" />
                            {heroContent.primaryCta}
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={handleExamplesCta}
                            className="h-14 px-8 text-base font-bold rounded-xl"
                        >
                            {heroContent.secondaryCta}
                        </Button>
                    </div>
                    <p className="text-base text-muted-foreground">{heroContent.trialNote}</p>

                    <div className="flex flex-col md:flex-row items-center gap-3 text-sm md:text-base text-muted-foreground">
                        {heroContent.microProofs.map((proof, index) => (
                            <div key={proof} className="contents">
                                {index > 0 && <div className="hidden md:block w-1 h-1 bg-muted-foreground/30 rounded-full" />}
                                <div className="flex items-center gap-2">
                                    <span className="text-green-500">✓</span>
                                    <span>{proof}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 flex flex-col items-center gap-2 animate-fade-in-up delay-300">
                        <div className="text-base md:text-lg font-semibold text-primary text-center">
                            {isFr ? "Des decks plus vite, sans repartir de zero" : "Build decks faster without starting from scratch"}
                        </div>
                        <div className="text-sm text-muted-foreground text-center">
                            {isFr
                                ? "Essai sans carte, export editable, workflow pense pour des livrables reels"
                                : "No-card trial, editable export, workflow built for real deliverables"}
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {heroContent.trustChips.map((chip) => (
                                <span
                                    key={chip}
                                    className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-sm md:text-base font-medium bg-background/60 border border-border/60"
                                >
                                    {chip}
                                </span>
                            ))}
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="w-full">
                    <DemoFlowSection />
                </motion.div>
            </motion.div>
        </section>
    );
}
