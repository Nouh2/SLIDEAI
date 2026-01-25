import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock, Target, Briefcase, Rocket } from "lucide-react";

export function WhyFreelance() {
    const { t } = useTranslation();

    const points = [
        { icon: Clock, text: t('whyFreelance.points.time'), color: "text-blue-400" },
        { icon: Target, text: t('whyFreelance.points.structure'), color: "text-purple-400" },
        { icon: Briefcase, text: t('whyFreelance.points.impress'), color: "text-pink-400" },
        { icon: Rocket, text: t('whyFreelance.points.deliver'), color: "text-orange-400" },
    ];

    return (
        <section className="py-12 md:py-16 px-4 relative overflow-hidden z-10">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        {t('whyFreelance.title')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {points.map((point, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-premium p-6 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-primary/20 transition-all"
                        >
                            <div className={`p-3 rounded-xl bg-white/5 ${point.color}`}>
                                <point.icon className="w-6 h-6" />
                            </div>
                            <p className="text-lg font-medium text-foreground/90">{point.text}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
