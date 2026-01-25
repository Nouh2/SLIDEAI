// src/components/create/TemplateSelector.tsx
import { useState } from 'react';
import { useTranslation } from "react-i18next";
import { slideTemplates } from '@/data/slideTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateSelectorProps {
    selectedTemplate: string | null;
    onSelectTemplate: (templateId: string) => void;
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<string>('all');
    const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

    const categories = ['all', 'business', 'creative', 'educational', 'marketing', 'corporate'];

    const filteredTemplates = filter === 'all'
        ? slideTemplates
        : slideTemplates.filter(t => t.category === filter);

    return (
        <div className="space-y-8 w-full max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="text-center space-y-4 mb-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
                >
                    <Sparkles className="w-4 h-4" />
                    <span>{t('templateSelector.pill')}</span>
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-bold tracking-tight"
                >
                    {t('templateSelector.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t('templateSelector.highlight')}</span>
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-muted-foreground max-w-2xl mx-auto"
                >
                    {t('templateSelector.description')}
                </motion.p>
            </div>

            {/* Category Tabs */}
            <div className="flex justify-center mb-8 overflow-x-auto pb-4 no-scrollbar">
                <div className="flex bg-muted/30 p-1 rounded-full backdrop-blur-sm border border-border/50">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors duration-200 capitalize ${filter === cat ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {filter === cat && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/25"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{t(`templateSelector.categories.${cat}`)}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Micro Copy */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-muted-foreground/80 italic -mt-4 mb-8"
            >
                {t('templateSelector.microCopy')}
            </motion.p>

            {/* Templates Grid - Fluid & Modern */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-4"
            >
                <AnimatePresence mode="popLayout">
                    {filteredTemplates.map((template, index) => (
                        <motion.div
                            key={template.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            onHoverStart={() => setHoveredTemplate(template.id)}
                            onHoverEnd={() => setHoveredTemplate(null)}
                            className="group relative"
                        >
                            <div
                                onClick={() => onSelectTemplate(template.id)}
                                className={`
                                    relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300
                                    border border-border/50 bg-card hover:border-primary/50
                                    ${selectedTemplate === template.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-2xl shadow-primary/20 scale-[1.02]' : 'hover:-translate-y-2 hover:shadow-xl'}
                                `}
                            >
                                {/* Image Container */}
                                <div className="aspect-[16/9] overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />

                                    <img
                                        src={template.preview}
                                        alt={template.name}
                                        className={`
                                            w-full h-full object-cover transition-transform duration-700
                                            ${hoveredTemplate === template.id ? 'scale-110' : 'scale-100'}
                                        `}
                                    />

                                    {/* Badge */}
                                    <div className="absolute top-4 left-4 z-20">
                                        <Badge className="bg-white/90 text-primary hover:bg-white font-bold backdrop-blur-sm shadow-sm border-none">
                                            {t(`templateSelector.templates.${template.id}.badge`)}
                                        </Badge>
                                    </div>



                                    {/* Selected Indicator */}
                                    {selectedTemplate === template.id && (
                                        <div className="absolute inset-0 z-20 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg"
                                            >
                                                <CheckCircle2 className="w-8 h-8" />
                                            </motion.div>
                                        </div>
                                    )}

                                    {/* Hover Usage Examples Overlay - Advanced Option */}
                                    <div className={`absolute bottom-0 left-0 right-0 p-4 z-20 transition-all duration-300 transform ${hoveredTemplate === template.id ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                                        <div className="bg-black/70 backdrop-blur-md rounded-lg p-3 text-white">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70 mb-1">
                                                {t('templateSelector.hoverHint')}
                                            </p>
                                            <p className="text-xs font-medium leading-relaxed text-white">
                                                {t(`templateSelector.templates.${template.id}.useCases`)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <CardContent className="p-5 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg leading-none mb-1 group-hover:text-primary transition-colors">
                                                {t(`templateSelector.templates.${template.id}.name`)}
                                            </h3>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                {t(`templateSelector.categories.${template.category}`)}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                        {t(`templateSelector.templates.${template.id}.desc`)}
                                    </p>

                                    {/* Footer / Action hint */}
                                    <div className="pt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 group-hover:border-border transition-colors">
                                        <div className="flex gap-2">
                                            <Badge variant="secondary" className="text-[10px] h-5 font-normal bg-secondary/10 text-secondary-foreground hover:bg-secondary/20">
                                                {template.fonts.heading}
                                            </Badge>
                                        </div>
                                        <div className={`flex items-center gap-1 transition-all duration-300 ${hoveredTemplate === template.id || selectedTemplate === template.id ? 'text-primary translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}>
                                            <span className="font-medium">{t('templateSelector.select')}</span>
                                            <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </CardContent>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
