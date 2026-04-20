import { useRef } from "react";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Clock, Target, Briefcase, Rocket } from "lucide-react";

export function WhyFreelance() {
    const { t } = useTranslation();
    const sectionRef = useRef<HTMLElement | null>(null);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start 82%", "end 28%"],
    });

    const sectionOpacity = useTransform(scrollYProgress, [0, 0.2, 1], [0.45, 1, 1]);
    const headingY = useTransform(scrollYProgress, [0, 1], [32, -10]);
    const gridY = useTransform(scrollYProgress, [0, 1], [48, -12]);
    const glowOpacity = useTransform(scrollYProgress, [0, 0.4, 1], [0.08, 0.18, 0.1]);

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.12,
                delayChildren: 0.08,
            },
        },
    };

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 42, scale: 0.97 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
            },
        },
    };

    const points = [
        { icon: Clock, text: t('whyFreelance.points.time'), color: "text-blue-400" },
        { icon: Target, text: t('whyFreelance.points.structure'), color: "text-purple-400" },
        { icon: Briefcase, text: t('whyFreelance.points.impress'), color: "text-pink-400" },
        { icon: Rocket, text: t('whyFreelance.points.deliver'), color: "text-orange-400" },
    ];

    return (
        <motion.section
            ref={sectionRef}
            style={{ opacity: sectionOpacity }}
            className="pt-4 pb-8 md:pt-4 md:pb-10 px-4 relative overflow-hidden z-10"
        >
            <motion.div
                style={{ opacity: glowOpacity }}
                className="absolute inset-x-0 top-10 -z-10 mx-auto h-64 max-w-4xl rounded-full bg-primary/10 blur-3xl"
            />

            <div className="max-w-6xl mx-auto">
                <motion.div className="text-center mb-10" style={{ y: headingY }}>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        {t('whyFreelance.title')}
                    </h2>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
                    style={{ y: gridY }}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.22 }}
                >
                    {points.map((point, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            whileHover={{ y: -6, scale: 1.01 }}
                            className="glass-premium p-6 rounded-2xl flex items-center gap-4 border border-white/5 hover:border-primary/20 transition-all duration-300"
                        >
                            <div className={`p-3 rounded-xl bg-white/5 ${point.color}`}>
                                <point.icon className="w-6 h-6" />
                            </div>
                            <p className="text-lg md:text-xl font-medium text-foreground/90">{point.text}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </motion.section>
    );
}
