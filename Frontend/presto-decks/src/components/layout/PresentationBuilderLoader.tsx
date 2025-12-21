import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Layout, Type, Image as ImageIcon, CheckCircle2 } from "lucide-react";

interface PresentationBuilderLoaderProps {
    status?: string; // e.g., "Designing slides...", "Writing content..."
}

export function PresentationBuilderLoader({ status }: PresentationBuilderLoaderProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [builtElements, setBuiltElements] = useState<string[]>([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // Simulation steps for a single slide building process
    const buildSteps = [
        { id: "layout", label: "Structuring layout...", icon: Layout },
        { id: "title", label: "Drafting headlines...", icon: Type },
        { id: "content", label: "Generating smart content...", icon: Sparkles },
        { id: "visuals", label: "Designing visuals...", icon: ImageIcon },
    ];

    // Mock slide layouts to cycle through
    const slideTypologies = ["title", "content", "split"];

    useEffect(() => {
        // Interval to advance the "building" steps
        const stepInterval = setInterval(() => {
            setCurrentStep((prev) => {
                if (prev < buildSteps.length - 1) {
                    return prev + 1;
                }
                // Once a slide is complete, reset for the next one after a pause
                return prev;
            });
        }, 800);

        return () => clearInterval(stepInterval);
    }, [currentSlideIndex]);

    // Effect to cycle slides
    useEffect(() => {
        if (currentStep === buildSteps.length - 1) {
            const timeout = setTimeout(() => {
                setCurrentSlideIndex((prev) => (prev + 1) % slideTypologies.length);
                setCurrentStep(0);
                setBuiltElements([]); // Reset built elements
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [currentStep]);

    const activeStep = buildSteps[currentStep];

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-8 relative">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />

            {/* Main Stage: The Slide Being Built */}
            <div className="relative w-full aspect-video bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden mb-8 transform scale-100 transition-all duration-500">
                {/* Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

                {/* Animated Slide Content */}
                <div className="absolute inset-8 flex flex-col gap-4">
                    <AnimatePresence mode="wait">
                        {slideTypologies[currentSlideIndex] === "title" && (
                            <motion.div
                                key="title-slide"
                                className="flex-1 flex flex-col items-center justify-center gap-6"
                            >
                                {/* Title Element */}
                                {currentStep >= 1 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="w-3/4 h-8 bg-primary/10 rounded-lg"
                                    />
                                )}
                                {/* Subtitle Element */}
                                {currentStep >= 2 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="w-1/2 h-4 bg-muted-foreground/10 rounded-lg"
                                    />
                                )}
                            </motion.div>
                        )}

                        {slideTypologies[currentSlideIndex] === "content" && (
                            <motion.div
                                key="content-slide"
                                className="flex-1 flex flex-col gap-4"
                            >
                                {/* Title */}
                                {currentStep >= 0 && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "60%" }}
                                        className="h-6 bg-primary/10 rounded-lg mb-4"
                                    />
                                )}
                                {/* Bullets */}
                                <div className="space-y-3">
                                    {currentStep >= 1 && (
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            className="w-full h-3 bg-muted/20 rounded-full"
                                        />
                                    )}
                                    {currentStep >= 2 && (
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.1 }}
                                            className="w-[90%] h-3 bg-muted/20 rounded-full"
                                        />
                                    )}
                                    {currentStep >= 3 && (
                                        <motion.div
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="w-[85%] h-3 bg-muted/20 rounded-full"
                                        />
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {slideTypologies[currentSlideIndex] === "split" && (
                            <motion.div
                                key="split-slide"
                                className="flex-1 flex gap-6"
                            >
                                <div className="flex-1 space-y-4 pt-4">
                                    {currentStep >= 1 && (
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="h-6 w-3/4 bg-primary/10 rounded-lg"
                                        />
                                    )}
                                    {currentStep >= 2 && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="space-y-2"
                                        >
                                            <div className="h-2 w-full bg-muted/20 rounded-full" />
                                            <div className="h-2 w-full bg-muted/20 rounded-full" />
                                            <div className="h-2 w-2/3 bg-muted/20 rounded-full" />
                                        </motion.div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    {currentStep >= 3 && (
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0, rotate: 5 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            className="w-full h-full bg-secondary/5 rounded-lg border border-secondary/10 flex items-center justify-center p-4"
                                        >
                                            <ImageIcon className="w-8 h-8 text-secondary/40" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Construction Overlay (Mouse/Cursor Effect placeholder) */}
                <motion.div
                    className="absolute z-10 pointer-events-none"
                    animate={{
                        x: [100, 300, 150, 400],
                        y: [100, 200, 300, 150],
                    }}
                    transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut"
                    }}
                >
                    <div className="relative">
                        <Wand2 className="w-6 h-6 text-primary fill-primary/20 -rotate-12" />
                        <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                    </div>
                </motion.div>
            </div>

            {/* Progress & Status */}
            <div className="w-full space-y-4 text-center">
                <motion.div
                    key={activeStep.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="p-3 rounded-full bg-background border border-border shadow-sm">
                        <activeStep.icon className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {status || activeStep.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Building slide {currentSlideIndex + 1}...
                        </p>
                    </div>
                </motion.div>

                {/* Steps Integration */}
                <div className="flex justify-center gap-2 pt-4">
                    {buildSteps.map((s, i) => (
                        <div
                            key={s.id}
                            className={`h-1 rounded-full transition-all duration-300 ${i <= currentStep ? "w-8 bg-primary" : "w-2 bg-muted"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
