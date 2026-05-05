
// DocumentStructureStep.tsx
// Smart Report Parsing: Hierarchical Drag & Drop Editor
// Groups detected H1/H2/H3 into meaningful chapters for the presentation plan

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    FileText, BarChart3, PieChart, LineChart, Image, Type,
    GripVertical, ChevronDown, ChevronRight, Trash2, Plus, RefreshCw, Loader2, Merge, Sparkles, Eye, EyeOff
} from 'lucide-react';
import type { DocumentSection } from '@/lib/api';
import { Switch } from '@/components/ui/switch';

type VisualType = 'image' | 'chart-bar' | 'chart-pie' | 'chart-line' | 'text-only';
const VISUAL_OPTIONS: { value: VisualType; label: string; icon: React.ReactNode }[] = [
    { value: 'image', label: 'Image illustrative', icon: <Image className="h-4 w-4" /> },
    { value: 'chart-bar', label: 'Graphique en barres', icon: <BarChart3 className="h-4 w-4" /> },
    { value: 'chart-pie', label: 'Graphique circulaire', icon: <PieChart className="h-4 w-4" /> },
    { value: 'chart-line', label: 'Graphique linéaire', icon: <LineChart className="h-4 w-4" /> },
    { value: 'text-only', label: 'Texte seul', icon: <Type className="h-4 w-4" /> },
];

interface PresentationChapter {
    id: string; // Unique ID for the chapter (can be based on first section ID)
    title: string; // Editable title
    sections: DocumentSection[]; // Sections included in this chapter
    slideCount: number; // Estimated/Manual slide count
    isExpanded: boolean;
    isSelected: boolean; // For Bulk Actions (Merge)
    isIncluded: boolean; // For Final Generation
}

interface DocumentStructureStepProps {
    document: {
        title: string;
        totalPages: number;
        totalChars: number;
        sections: DocumentSection[];
    };
    onConfirm: (selection: {
        sectionIds: string[];
        sectionVisuals: Record<string, VisualType>;
        structurePrompt: string; // NEW: The constructed plan prompt
        totalSlides: number; // NEW: The calculated total
        evidenceMode?: 'standard' | 'strict';
    }) => void;
    onCancel: () => void;
    isGenerating?: boolean;
}

export function DocumentStructureStep({
    document,
    onConfirm,
    onCancel,
    isGenerating = false,
}: DocumentStructureStepProps) {
    const [plan, setPlan] = useState<PresentationChapter[]>([]);
    const [sectionVisuals, setSectionVisuals] = useState<Record<string, VisualType>>({});
    const [suggestion, setSuggestion] = useState<{ id: string, label: string, indices: number[] } | null>(null);
    const [strictEvidenceMode, setStrictEvidenceMode] = useState(true);

    // Initial Grouping Logic on Mount
    useEffect(() => {
        const initialPlan: PresentationChapter[] = [];
        const initialVisuals: Record<string, VisualType> = {};

        let currentChapter: PresentationChapter | null = null;
        let chapterIndex = 0;

        document.sections.forEach((section, index) => {
            // Initialize visual preference (default to text/image based on chars?)
            initialVisuals[section.id] = 'text-only'; // Default, user can refine

            // Helper to start a new chapter
            const startNewChapter = () => {
                chapterIndex++;
                currentChapter = {
                    id: `chap_${chapterIndex}_${section.id}`,
                    title: section.title, // Default to section title
                    sections: [section],
                    slideCount: Math.max(1, Math.ceil(section.charCount / 1500)), // Crude estimation: 1 slide per 1500 chars
                    isExpanded: false,
                    isSelected: false,
                    isIncluded: true,
                };
                initialPlan.push(currentChapter);
            };

            // Rule 1: H1 always starts a new chapter
            if (section.level === 1) {
                startNewChapter();
            }
            // Rule 2: If no chapter exists yet (e.g. doc starts with H2), start one
            else if (!currentChapter) {
                startNewChapter();
            }
            // Rule 3: H2/H3 get appended to current chapter (subsections)
            else {
                currentChapter.sections.push(section);
                // Update estimate (add subsections complexity)
                if (currentChapter) {
                    currentChapter.slideCount += Math.max(0, Math.ceil(section.charCount / 2000));
                }
            }
        });

        setSectionVisuals(initialVisuals);

        // SMART FLATTENING: If the doc is complex (>4 sections) but we found <= 2 chapters,
        // it means H1 detection failed or the doc structure behaves like a flat report.
        if (document.sections.length > 4 && initialPlan.length <= 2) {
            const flattenedPlan = document.sections.map((s, idx) => ({
                id: `flat_${s.id}`,
                title: s.title,
                sections: [s],
                slideCount: Math.max(1, Math.ceil(s.charCount / 1500)),
                isExpanded: false,
                isSelected: false,
                isIncluded: true
            }));
            setPlan(flattenedPlan);
        } else {
            setPlan(initialPlan);
        }
    }, [document]);

    // SMART SUGGESTIONS: Run every time plan changes
    useEffect(() => {
        // Simple keyword heuristics
        const DIAGNOSTIC_KEYWORDS = ['swot', 'tows', 'pest', 'pestel', 'environnement', 'landscape', 'market analysis'];
        const indices: number[] = [];

        plan.forEach((ch, idx) => {
            const lower = ch.title.toLowerCase();
            if (DIAGNOSTIC_KEYWORDS.some(k => lower.includes(k))) {
                indices.push(idx);
            }
        });

        // Only suggest if we found at least 2 items, and they are not already merged (simple check)
        if (indices.length >= 2 && indices.length < 5) {
            setSuggestion({
                id: 'diagnostic',
                label: 'Regrouper en "Diagnostic Stratégique"',
                indices: indices
            });
        } else {
            setSuggestion(null);
        }
    }, [plan]);

    const handleDragEnd = useCallback((newOrder: PresentationChapter[]) => {
        setPlan(newOrder);
    }, []);

    const toggleSelection = useCallback((chapterId: string) => {
        setPlan(prev => prev.map(ch =>
            ch.id === chapterId ? { ...ch, isSelected: !ch.isSelected } : ch
        ));
    }, []);

    const toggleInclusion = useCallback((chapterId: string) => {
        setPlan(prev => prev.map(ch =>
            ch.id === chapterId ? { ...ch, isIncluded: !ch.isIncluded } : ch
        ));
    }, []);

    const toggleExpand = useCallback((chapterId: string) => {
        setPlan(prev => prev.map(ch =>
            ch.id === chapterId ? { ...ch, isExpanded: !ch.isExpanded } : ch
        ));
    }, []);

    const updateTitle = useCallback((chapterId: string, newTitle: string) => {
        setPlan(prev => prev.map(ch =>
            ch.id === chapterId ? { ...ch, title: newTitle } : ch
        ));
    }, []);

    const updateSectionVisual = useCallback((sectionId: string, visual: VisualType) => {
        setSectionVisuals(prev => ({
            ...prev,
            [sectionId]: visual
        }));
    }, []);

    const updateSlideCount = useCallback((chapterId: string, count: number) => {
        setPlan(prev => prev.map(ch =>
            ch.id === chapterId ? { ...ch, slideCount: Math.max(1, count) } : ch
        ));
    }, []);

    const deleteSection = useCallback((chapterId: string, sectionId: string) => {
        setPlan(prev => prev.map(ch => {
            if (ch.id !== chapterId) return ch;
            return {
                ...ch,
                sections: ch.sections.filter(s => s.id !== sectionId)
            };
        }));
    }, []);

    // MERGE LOGIC
    const handleMerge = (indicesToMerge?: number[]) => {
        // If indices provided (from suggestion), use them. Else use selected.
        const chaptersToMerge = indicesToMerge
            ? plan.filter((_, i) => indicesToMerge.includes(i))
            : plan.filter(ch => ch.isSelected);

        if (chaptersToMerge.length < 2) return;

        // Consolidate Data
        const mergedSections = chaptersToMerge.flatMap(ch => ch.sections);
        const mergedTitle = indicesToMerge ? "Diagnostic Stratégique" : chaptersToMerge[0].title;
        const totalSlides = chaptersToMerge.reduce((sum, ch) => sum + ch.slideCount, 0);

        const newChapter: PresentationChapter = {
            id: `merged_${Date.now()}`,
            title: (!indicesToMerge && chaptersToMerge.length > 1) ? `${chaptersToMerge[0].title} + ${chaptersToMerge.length - 1} autres` : mergedTitle,
            sections: mergedSections,
            slideCount: totalSlides, // Sum of merged chapters
            isExpanded: true, // Auto-expand to show user what happened
            isSelected: false, // Fix: Deselect to prevent accidental inclusion in next merge
            isIncluded: true,
        };

        // Construct new plan
        const newPlan: PresentationChapter[] = [];
        let inserted = false;

        const idsToRemove = new Set(chaptersToMerge.map(c => c.id));

        for (let i = 0; i < plan.length; i++) {
            const ch = plan[i];
            if (idsToRemove.has(ch.id)) {
                if (!inserted) {
                    newPlan.push(newChapter);
                    inserted = true;
                }
                // Skip other selected
            } else {
                newPlan.push(ch);
            }
        }

        setPlan(newPlan);
        if (indicesToMerge) setSuggestion(null); // Clear suggestion
    };

    const selectedCount = plan.filter(p => p.isSelected).length;

    // Prepare data for generation
    const handleGenerateClick = () => {
        const activeChapters = plan.filter(ch => ch.isIncluded && ch.sections.length > 0);

        // 1. Collect all Section IDs for RAG Context
        const allSectionIds = activeChapters.flatMap(ch => ch.sections.map(s => s.id));

        // 2. Build Visual Preferences map (already in state, just filter for active)
        const finalVisuals: Record<string, VisualType> = {};
        allSectionIds.forEach(id => {
            if (sectionVisuals[id]) {
                finalVisuals[id] = sectionVisuals[id];
            }
        });

        // 3. Calculate Total Slides
        const totalSlides = activeChapters.reduce((sum, ch) => sum + ch.slideCount, 0);

        // 4. Build the Structure Prompt
        // This is where we inject the "User Plan" into the AI logic
        let promptStructure = `\n\n[PLAN DE PRÉSENTATION IMPOSÉ]:\nLa présentation DOIT suivre strictement ce plan (${totalSlides} slides au total) :\n`;

        if (strictEvidenceMode) {
            promptStructure += `Mode preuves strict activé: utilise uniquement les informations présentes dans le document source. N'invente aucun chiffre, nom, fait, résultat ou recommandation non supporté par les sections sources. Si une information manque, indique clairement que le document source ne la précise pas.\n`;
        }

        activeChapters.forEach((ch, index) => {
            promptStructure += `${index + 1}. ${ch.title} (~${ch.slideCount} slides)\n`;

            // Add subsection context if available
            if (ch.sections.length > 0) {
                ch.sections.forEach(s => {
                    const visual = sectionVisuals[s.id];
                    const visualLabel = VISUAL_OPTIONS.find(o => o.value === visual)?.label || 'Texte';
                    promptStructure += `   - ${s.title} [Format souhaité: ${visualLabel}]\n`;
                });
            }
        });

        onConfirm({
            sectionIds: allSectionIds,
            sectionVisuals: finalVisuals,
            structurePrompt: promptStructure,
            totalSlides: totalSlides,
            evidenceMode: strictEvidenceMode ? 'strict' : 'standard',
        });
    };

    const totalSlides = useMemo(() => plan.filter(p => p.isIncluded).reduce((acc, ch) => acc + ch.slideCount, 0), [plan]);
    const sourceSectionCount = useMemo(() => plan.reduce((acc, ch) => acc + (ch.isIncluded ? ch.sections.length : 0), 0), [plan]);
    const includedChaptersCount = useMemo(() => plan.filter(p => p.isIncluded).length, [plan]);

    return (
        <Card className="w-full max-w-4xl mx-auto flex flex-col h-[85vh] max-h-[900px] relative border-none shadow-xl bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-4 shrink-0 border-b bg-background/50 backdrop-blur-sm z-20">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-3 text-2xl">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            Plan de Présentation
                        </CardTitle>
                        <CardDescription className="mt-2 text-base">
                            <span className="font-semibold text-foreground">{document.sections.length} sections sources détectées</span>.
                            Construisez votre plan final pour le deck.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto min-h-0 space-y-4 p-6 pb-28">
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900/50 dark:bg-blue-950/20">
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Mode preuves strict</p>
                        <p className="text-xs text-muted-foreground">
                            L'IA s'appuie uniquement sur les sections sources et ajoute une traçabilité par slide.
                        </p>
                    </div>
                    <Switch
                        checked={strictEvidenceMode}
                        onCheckedChange={setStrictEvidenceMode}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>

                {/* SUGGESTION BANNER */}
                {suggestion && (
                    <div className="bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-800 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 shadow-sm">
                        <div className="flex items-center gap-3 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                            <Sparkles className="h-5 w-5 text-indigo-500" />
                            <div>
                                <p className="font-semibold">Suggestion IA</p>
                                <p className="opacity-90">{suggestion.label}</p>
                            </div>
                        </div>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={() => handleMerge(suggestion.indices)}>
                            Appliquer
                        </Button>
                    </div>
                )}

                <Reorder.Group axis="y" values={plan} onReorder={handleDragEnd} className="space-y-4 pt-2">
                    {plan.map((chapter, index) => (
                        <Reorder.Item key={chapter.id} value={chapter} className="relative group">
                            <div className={`
                                relative rounded-xl border transition-all duration-300 overflow-hidden
                                ${chapter.isIncluded
                                    ? 'bg-card border-border/50 shadow-sm hover:shadow-md hover:border-primary/20'
                                    : 'bg-muted/30 border-transparent opacity-60 hover:opacity-80 saturate-0'}
                                ${chapter.isSelected ? 'ring-2 ring-primary ring-offset-2 z-10' : ''}
                            `}>
                                {/* Left Selection Indicator Strip */}
                                <div
                                    className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${chapter.isSelected ? 'bg-primary' : 'bg-transparent'}`}
                                />

                                {/* Chapter Header Row */}
                                <div className="flex items-center p-4 gap-4">
                                    {/* Drag Handle */}
                                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-foreground/80 p-1 transition-colors">
                                        <GripVertical className="h-5 w-5" />
                                    </div>

                                    {/* SELECTION CHECKBOX (FOR MERGE) */}
                                    <div className="flex items-center justify-center">
                                        <Checkbox
                                            checked={chapter.isSelected}
                                            onCheckedChange={() => toggleSelection(chapter.id)}
                                            className="h-5 w-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                                            title="Sélectionner pour fusionner"
                                        />
                                    </div>

                                    {/* Index Number */}
                                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                        {index + 1}
                                    </div>

                                    {/* Title Input */}
                                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={chapter.title}
                                                onChange={(e) => updateTitle(chapter.id, e.target.value)}
                                                className={`
                                                    h-auto py-1 px-2 -ml-2 text-lg font-semibold border-transparent hover:border-input/50 focus:border-primary/50 bg-transparent hover:bg-muted/30 transition-all rounded-md
                                                    ${!chapter.isIncluded && 'line-through text-muted-foreground'}
                                                `}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
                                            <Badge variant="outline" className="text-[10px] font-normal border-border/50 bg-background/50">
                                                {chapter.sections.length} source{chapter.sections.length > 1 ? 's' : ''}
                                            </Badge>
                                            {chapter.isExpanded && (
                                                <button onClick={() => toggleExpand(chapter.id)} className="hover:text-primary transition-colors flex items-center gap-1">
                                                    Masquer détails <ChevronDown className="h-3 w-3" />
                                                </button>
                                            )}
                                            {!chapter.isExpanded && (
                                                <button onClick={() => toggleExpand(chapter.id)} className="hover:text-primary transition-colors flex items-center gap-1">
                                                    Voir détails <ChevronRight className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* CONTROLS COL */}
                                    <div className="flex items-center gap-4 border-l pl-4 ml-2 border-border/40">

                                        {/* SLIDE COUNT */}
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Slides</span>
                                            <div className="flex items-center bg-muted/40 rounded-md border border-border/30 hover:bg-white hover:border-primary/30 hover:shadow-sm transition-all group/counter">
                                                <button
                                                    onClick={() => updateSlideCount(chapter.id, Math.max(1, chapter.slideCount - 1))}
                                                    className={`w-6 h-7 flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95 transition-all ${!chapter.isIncluded && 'pointer-events-none opacity-50'}`}
                                                >
                                                    <span className="text-sm font-bold">-</span>
                                                </button>
                                                <div className="w-8 text-center font-bold text-sm tabular-nums text-foreground">
                                                    {chapter.slideCount}
                                                </div>
                                                <button
                                                    onClick={() => updateSlideCount(chapter.id, Math.min(10, chapter.slideCount + 1))}
                                                    className={`w-6 h-7 flex items-center justify-center text-muted-foreground hover:text-primary active:scale-95 transition-all ${!chapter.isIncluded && 'pointer-events-none opacity-50'}`}
                                                >
                                                    <span className="text-sm font-bold">+</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* VISIBILITY TOGGLE */}
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Inclus</span>
                                            <Switch
                                                checked={chapter.isIncluded}
                                                onCheckedChange={() => toggleInclusion(chapter.id)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Subsections - Modernized */}
                                <AnimatePresence initial={false}>
                                    {chapter.isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-border/40 bg-muted/30 p-4 space-y-2">
                                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 pl-2 flex items-center gap-2">
                                                    <div className="h-px bg-border flex-1"></div>
                                                    Contenu source
                                                    <div className="h-px bg-border flex-1"></div>
                                                </div>
                                                <div className="space-y-2">
                                                    {chapter.sections.map(section => (
                                                        <div key={section.id} className="flex items-center justify-between group/section bg-background/50 rounded-lg p-2 border border-border/30 hover:border-border/60 hover:shadow-sm transition-all">
                                                            <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4">
                                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono shrink-0">
                                                                    {section.level === 1 ? 'H1' : section.level === 2 ? 'H2' : 'H3'}
                                                                </Badge>
                                                                <span className="truncate text-sm opacity-90 font-medium" title={section.title}>
                                                                    {section.title}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <Select
                                                                    value={sectionVisuals[section.id] || 'text-only'}
                                                                    onValueChange={(v) => updateSectionVisual(section.id, v as VisualType)}
                                                                >
                                                                    <SelectTrigger className="w-[140px] h-8 text-xs border-input/50 bg-background hover:bg-accent/50 focus:ring-1 focus:ring-primary/20 gap-2 px-2.5 shadow-none">
                                                                        <div className="flex items-center gap-2 truncate">
                                                                            {VISUAL_OPTIONS.find(o => o.value === (sectionVisuals[section.id] || 'text-only'))?.icon}
                                                                            <span className="truncate">
                                                                                {VISUAL_OPTIONS.find(o => o.value === (sectionVisuals[section.id] || 'text-only'))?.label}
                                                                            </span>
                                                                        </div>
                                                                    </SelectTrigger>
                                                                    <SelectContent align="end">
                                                                        {VISUAL_OPTIONS.map(opt => (
                                                                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                                                <div className="flex items-center gap-2">
                                                                                    {opt.icon}
                                                                                    <span>{opt.label}</span>
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>

                                                                <button
                                                                    onClick={() => deleteSection(chapter.id, section.id)}
                                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md p-1.5 transition-colors"
                                                                    title="Retirer cette section"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {chapter.sections.length === 0 && (
                                                        <div className="text-center py-4 bg-destructive/5 rounded-lg border border-destructive/10 text-destructive text-sm italic">
                                                            Chapitre vide - ajoutez du contenu ou supprimez-le
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            </CardContent>

            {/* Floating Operations Bar - Anchored slightly above footer */}
            {selectedCount > 1 && (
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30 animate-in slide-in-from-bottom-5 fade-in zoom-in-95 duration-200">
                    <div className="bg-foreground text-background shadow-2xl rounded-full pl-5 pr-2 py-1.5 flex items-center gap-4 border border-border/10">
                        <span className="text-sm font-semibold">{selectedCount} chapitres sélectionnés</span>
                        <div className="h-4 w-px bg-background/20"></div>
                        <Button
                            size="sm"
                            onClick={() => handleMerge()}
                            className="h-8 gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-4 shadow-lg shadow-primary/20"
                        >
                            <Merge className="h-3.5 w-3.5" />
                            Fusionner
                        </Button>
                    </div>
                </div>
            )}

            {/* Sticky Modern Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur-md flex justify-between items-center z-40 rounded-b-xl">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Slides</span>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 tabular-nums">
                                {totalSlides}
                            </span>
                            <span className="text-sm font-medium text-muted-foreground">slides finales</span>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border/50"></div>

                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Structure</span>
                        <span className="text-sm font-medium text-foreground">{includedChaptersCount} chapitres</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="ghost" onClick={onCancel} disabled={isGenerating} className="text-muted-foreground hover:text-foreground">
                        Annuler
                    </Button>
                    <Button
                        onClick={handleGenerateClick}
                        disabled={totalSlides === 0 || isGenerating}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all px-8 text-base font-semibold"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>
                                Générer les slides <ChevronRight className="ml-1 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
