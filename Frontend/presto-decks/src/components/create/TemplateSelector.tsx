// src/components/create/TemplateSelector.tsx
import { useState } from 'react';
import { slideTemplates, SlideTemplate } from '@/data/slideTemplates';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateSelectorProps {
    selectedTemplate: string | null;
    onSelectTemplate: (templateId: string) => void;
}

export function TemplateSelector({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) {
    const [filter, setFilter] = useState<string>('all');

    const categories = ['all', 'business', 'creative', 'educational', 'marketing', 'corporate'];

    const filteredTemplates = filter === 'all'
        ? slideTemplates
        : slideTemplates.filter(t => t.category === filter);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Choose Your Style
                </h2>
                <p className="text-muted-foreground">
                    Select a template that matches your presentation goal
                </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2">
                {categories.map((cat) => (
                    <Button
                        key={cat}
                        variant={filter === cat ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter(cat)}
                        className="capitalize"
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {/* Templates Grid */}
            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
                <AnimatePresence mode="popLayout">
                    {filteredTemplates.map((template) => (
                        <motion.div
                            key={template.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card
                                onClick={() => onSelectTemplate(template.id)}
                                className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${selectedTemplate === template.id
                                        ? 'ring-2 ring-primary shadow-xl'
                                        : 'hover:ring-1 hover:ring-primary/30'
                                    }`}
                            >
                                <CardContent className="p-0">
                                    {/* Preview Image */}
                                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                                        <img
                                            src={template.preview}
                                            alt={template.name}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Overlay with color scheme */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <div className="flex gap-1">
                                                <div
                                                    className="w-3 h-3 rounded-full border border-white/20"
                                                    style={{ backgroundColor: template.colors.primary }}
                                                />
                                                <div
                                                    className="w-3 h-3 rounded-full border border-white/20"
                                                    style={{ backgroundColor: template.colors.secondary }}
                                                />
                                                <div
                                                    className="w-3 h-3 rounded-full border border-white/20"
                                                    style={{ backgroundColor: template.colors.accent }}
                                                />
                                            </div>
                                        </div>

                                        {/* Selected Check */}
                                        {selectedTemplate === template.id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg"
                                            >
                                                <Check className="h-5 w-5 text-white" />
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-sm">{template.name}</h3>
                                            <Badge variant="outline" className="capitalize text-[10px]">
                                                {template.category}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {template.description}
                                        </p>

                                        {/* Fonts info */}
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1 border-t">
                                            <span className="font-medium">Fonts:</span>
                                            <span className="truncate">{template.fonts.heading}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No templates found in this category</p>
                </div>
            )}
        </div>
    );
}
