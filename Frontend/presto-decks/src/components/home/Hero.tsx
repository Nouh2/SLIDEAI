import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { DeckPreview } from "@/components/home/DeckPreview";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

type HeroVariant = "time" | "quality";
const HERO_AB_KEY = "slideai_hero_ab_v1";

export function Hero() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isFr = i18n.language.startsWith("fr");
    const [variant, setVariant] = useState<HeroVariant>("time");

    useEffect(() => {
        const stored = localStorage.getItem(HERO_AB_KEY) as HeroVariant | null;
        if (stored === "time" || stored === "quality") {
            setVariant(stored);
            return;
        }
        const assigned: HeroVariant = Math.random() < 0.5 ? "time" : "quality";
        localStorage.setItem(HERO_AB_KEY, assigned);
        setVariant(assigned);
    }, []);

    useEffect(() => {
        Analytics.trackEvent("Experiment", "Hero Variant Viewed", `hero_ab_v1_${variant}`);
    }, [variant]);
    const segments = [
        t('hero.segments.consulting'),
        t('hero.segments.audit'),
        t('hero.segments.marketing'),
        t('hero.segments.freelance'),
    ];
    const anchorLinks = [
        { href: "#creer-powerpoint-avec-ia", label: t("hero.anchorLinks.createWithAI") },
        { href: "#pourquoi-outil-ia-presentation", label: t("hero.anchorLinks.whyTool") },
        { href: "#generer-presentation-automatiquement", label: t("hero.anchorLinks.autoGenerate") },
        { href: "#creer-premiere-presentation-30-secondes", label: t("hero.anchorLinks.startNow") },
    ];
    const trustChips = [
        t('socialProof.trustChips.security'),
        t('socialProof.trustChips.gdpr'),
        t('socialProof.trustChips.noCard'),
    ];

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
            `Landing Hero CTA - 7d Trial (${variant})`
        );
        navigate(`/auth?returnTo=${encodeURIComponent("/create")}`);
    };

    const headline = variant === "time"
        ? t("hero.title")
        : isFr
            ? "Des slides B2B client-ready sans sacrifier la qualite"
            : "Client-ready B2B slides without sacrificing quality";

    const subtitle = variant === "time"
        ? t("hero.subtitle")
        : isFr
            ? "SlideAI structure votre presentation, applique un design propre, et vous laisse finaliser vite avant livraison client."
            : "SlideAI structures your presentation, applies a clean design, and lets you finalize fast before client delivery.";

    return (
        <section className="min-h-[70vh] flex flex-col items-center justify-center py-6 px-4 md:py-10 relative z-10 overflow-hidden"
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
                        <span className="text-foreground/80 font-medium text-xs md:text-sm uppercase tracking-wider">{t('hero.badge')}</span>
                    </div>
                </motion.div>

                {/* Headline */}
                <motion.div variants={itemVariants} className="text-center space-y-4 md:space-y-6">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight px-2 max-w-5xl mx-auto">
                        {headline}
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                        {subtitle}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                        {segments.map((segment) => (
                            <span
                                key={segment}
                                className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-sm md:text-base font-medium bg-secondary/20 border border-secondary/30 text-foreground/80"
                            >
                                {segment}
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                        {anchorLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="text-sm md:text-base text-primary hover:text-primary/80 underline underline-offset-4"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 pt-8">
                    <Button
                        size="lg"
                        onClick={handleHeroCta}
                        className="h-14 px-8 text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        {t('hero.cta')}
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <p className="text-base text-muted-foreground">{t('hero.trialNote')}</p>

                    {/* Micro-proofs */}
                    <div className="flex flex-col md:flex-row items-center gap-4 text-sm md:text-base text-muted-foreground">
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

                    <div className="pt-6 flex flex-col items-center gap-3 animate-fade-in-up delay-300">
                        <div className="text-base md:text-lg font-semibold text-primary text-center">{t('socialProof.stats.generatedCount')}</div>
                        <div className="text-sm text-muted-foreground text-center">{t('socialProof.stats.rating')}</div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {trustChips.map((chip) => (
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

                {/* Deck Preview Section */}
                <motion.div variants={itemVariants} className="w-full pt-8 md:pt-12">
                    <DeckPreview />
                </motion.div>

            </motion.div>
        </section>
    );
}
