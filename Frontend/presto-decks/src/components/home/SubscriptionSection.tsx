import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function SubscriptionSection() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const features = [
        t('offer.proSubscription.features.unlimited'),
        t('offer.proSubscription.features.pages'),
        t('offer.proSubscription.features.export'),
        t('offer.proSubscription.features.support'),
    ];

    return (
        <section className="py-12 md:py-16 px-4 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-secondary/5 rounded-3xl p-8 md:p-12 border border-white/5">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold">{t('offer.proSubscription.title')}</h2>
                        <p className="text-lg text-muted-foreground">{t('offer.proSubscription.subtitle')}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {features.map((feature, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="p-1 rounded-full bg-primary/10 text-primary">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-end gap-6">
                        <div className="text-2xl font-bold">{t('offer.proSubscription.price')}</div>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigate("/pricing")}
                            className="h-12 border-primary/20 hover:bg-primary/5"
                        >
                            {t('offer.proSubscription.cta')}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
