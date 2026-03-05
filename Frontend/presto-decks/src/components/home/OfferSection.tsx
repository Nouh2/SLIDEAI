import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

export function OfferSection() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const features = [
        t('offer.freelancePack.features.presents'),
        t('offer.freelancePack.features.import'),
        t('offer.freelancePack.features.design'),
        t('offer.freelancePack.features.export'),
        t('offer.freelancePack.features.noCard'),
    ];
    const handleTrialCta = () => {
        Analytics.trackEvent(
            ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
            ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
            "Landing Trial Section CTA - 7d Trial"
        );
        navigate(`/auth?returnTo=${encodeURIComponent("/create")}`);
    };

    return (
        <section className="py-8 md:py-10 px-4 relative overflow-hidden z-10">
            <div className="absolute inset-0 bg-primary/5 -z-10" />
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="glass-premium rounded-3xl p-8 md:p-12 border border-primary/20 shadow-2xl relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />

                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="flex-1 space-y-6">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-2">{t('offer.freelancePack.title')}</h2>
                                <p className="text-muted-foreground text-lg">{t('offer.freelancePack.subtitle')}</p>
                            </div>

                            <div className="space-y-3">
                                {features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="p-1 rounded-full bg-green-500/10 text-green-500">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <span className="text-lg font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-base text-muted-foreground/80 italic border-l-2 border-primary/30 pl-3">
                                {t('offer.freelancePack.uniquenessNote')}
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-6 bg-background/50 p-8 rounded-2xl border border-white/5 min-w-[280px]">
                            <div className="text-center">
                                <span className="text-4xl font-bold">{t('offer.freelancePack.price')}</span>
                            </div>
                            <Button
                                size="lg"
                                onClick={handleTrialCta}
                                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {t('offer.freelancePack.cta')}
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">{t('offer.freelancePack.helper')}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
