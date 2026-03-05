import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FileText, Wand2, Send } from "lucide-react";

export function HowItWorks() {
    const { t } = useTranslation();

    const steps = [
        {
            icon: FileText,
            title: t('howItWorks.steps.1.title'),
            desc: t('howItWorks.steps.1.desc'),
        },
        {
            icon: Wand2,
            title: t('howItWorks.steps.2.title'),
            desc: t('howItWorks.steps.2.desc'),
        },
        {
            icon: Send,
            title: t('howItWorks.steps.3.title'),
            desc: t('howItWorks.steps.3.desc'),
        },
    ];

    return (
        <section className="py-8 md:py-10 px-4 relative z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -z-10" />
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('howItWorks.title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting line (desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            className="relative flex flex-col items-center text-center space-y-4"
                        >
                            <div className="w-24 h-24 rounded-full glass-premium flex items-center justify-center border border-primary/20 shadow-lg relative z-10 bg-background/50 backdrop-blur-xl">
                                <step.icon className="w-10 h-10 text-primary" />
                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-black border-4 border-background">
                                    {index + 1}
                                </div>
                            </div>
                            <div className="space-y-2 max-w-xs">
                                <h3 className="text-xl md:text-2xl font-bold">{step.title}</h3>
                                <p className="text-base md:text-lg text-muted-foreground">{step.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <p className="text-xl md:text-2xl font-medium text-gradient-secondary">{t('howItWorks.time')}</p>
                </div>
            </div>
        </section>
    );
}
