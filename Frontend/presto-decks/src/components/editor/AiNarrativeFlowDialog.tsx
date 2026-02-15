import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2, ArrowRight, CheckCircle2, AlertCircle, Layout } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { calculateNarrativeSegments, DynamicSegment } from '@/lib/narrative-utils';
import { cn } from '@/lib/utils';

interface AiNarrativeFlowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    slides: any[];
    onApplyReorder: (newSlides: any[]) => void;
}

export const AiNarrativeFlowDialog: React.FC<AiNarrativeFlowDialogProps> = ({
    open,
    onOpenChange,
    slides,
    onApplyReorder
}) => {
    const { t } = useTranslation();
    const [analyzing, setAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState<any[] | null>(null);

    // Dynamic analysis logic using segments
    const analyzeFlow = async () => {
        setAnalyzing(true);
        setSuggestions(null);

        // Simulate API call
        setTimeout(() => {
            const currentSegments = calculateNarrativeSegments(slides);
            const newSlides = [...slides];
            const moves: string[] = [];
            let improved = false;

            // 1. Move Appendix slides to the end if they are in the middle
            const appendixIndices = newSlides.map((s, i) => s.isAppendix ? i : -1).filter(i => i !== -1);
            if (appendixIndices.length > 0) {
                const lastSlideIndex = newSlides.length - 1;
                const minAppendixIndex = Math.min(...appendixIndices);
                const maxNonAppendixIndex = Math.max(...newSlides.map((s, i) => !s.isAppendix ? i : -1).filter(i => i !== -1));

                if (minAppendixIndex < maxNonAppendixIndex) {
                    const appendixSlides = newSlides.filter(s => s.isAppendix);
                    const nonAppendixSlides = newSlides.filter(s => !s.isAppendix);

                    // Reassemble
                    newSlides.length = 0;
                    newSlides.push(...nonAppendixSlides, ...appendixSlides);
                    moves.push("Group all Appendix slides at the end of the presentation.");
                    improved = true;
                }
            }

            // 2. Check for "Opening" slides (Title, Agenda) being at the start
            const agendaIndex = newSlides.findIndex(s =>
                (s.title && (s.title.toLowerCase().includes('agenda') || s.title.toLowerCase().includes('sommaire'))) ||
                (s.layout && s.layout.toLowerCase().includes('agenda'))
            );

            if (agendaIndex > 2) {
                const [agendaSlide] = newSlides.splice(agendaIndex, 1);
                newSlides.splice(1, 0, agendaSlide); // Move to 2nd position
                moves.push(`Move '${agendaSlide.title || 'Agenda'}' to position 2 for logical onboarding.`);
                improved = true;
            }

            // 3. Section size balance (Heuristic)
            // If a section has > 10 slides, suggest breaking it up (visual only for now)
            currentSegments.forEach(seg => {
                if (seg.slideCount > 10 && seg.id !== 'appendix') {
                    moves.push(`Segment '${seg.label}' is very long (${seg.slideCount} slides). Consider adding a sub-section divider.`);
                }
            });

            if (moves.length === 0) {
                setSuggestions([]);
            } else {
                setSuggestions([{
                    newOrder: [...newSlides],
                    reason: improved ? "Refined structure based on narrative patterns" : "Structural suggestions found",
                    changes: moves,
                    improved: improved
                }]);
            }

            setAnalyzing(false);
        }, 2000);
    };

    const handleApply = () => {
        if (suggestions && suggestions.length > 0 && suggestions[0].improved) {
            onApplyReorder(suggestions[0].newOrder);
            onOpenChange(false);
        }
    };

    React.useEffect(() => {
        if (open) {
            analyzeFlow();
        } else {
            setSuggestions(null);
            setAnalyzing(false);
        }
    }, [open]);

    // Preview segments
    const previewSegments = suggestions && suggestions[0] ? calculateNarrativeSegments(suggestions[0].newOrder) : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Wand2 className="h-5 w-5 text-purple-600" />
                        AI Flow Optimizer
                    </DialogTitle>
                    <DialogDescription>
                        Our AI analyzes your sections and slide contents to suggest the most effective narrative arc.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-12">
                            <div className="relative">
                                <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
                                <Layout className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium">Analyzing Narrative Structure...</p>
                                <p className="text-xs text-muted-foreground mt-1">Evaluating segments, sections, and slide transitions</p>
                            </div>
                        </div>
                    ) : suggestions && suggestions.length > 0 ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-1">Optimizations</h4>
                                    <div className="space-y-2">
                                        {suggestions[0].changes.map((change: string, i: number) => (
                                            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-200/50 dark:border-purple-800/50">
                                                <div className="mt-1 p-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                                    <ArrowRight className="h-3 w-3 text-purple-600" />
                                                </div>
                                                <span className="text-xs leading-relaxed">{change}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground px-1">Suggested Flow</h4>
                                    <ScrollArea className="h-[240px] rounded-lg border bg-muted/20 p-3">
                                        <div className="space-y-2">
                                            {previewSegments.map((seg, i) => (
                                                <div key={seg.id} className="flex flex-col gap-1 p-2 rounded-md bg-background border border-border shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("p-1 rounded-md", seg.color)}>
                                                            <seg.icon className="w-3 h-3" />
                                                        </div>
                                                        <span className="text-[11px] font-bold truncate">{seg.label}</span>
                                                        <span className="ml-auto text-[9px] font-medium bg-muted px-1.5 py-0.5 rounded">
                                                            {seg.slideCount} slides
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>

                            {!suggestions[0].improved && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-800/50">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Your current structure already follows logical best practices!</span>
                                </div>
                            )}
                        </div>
                    ) : suggestions && suggestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-8">
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="text-center">
                                <h4 className="font-medium mb-1">Excellent Narrative!</h4>
                                <p className="text-sm text-muted-foreground">
                                    Your story structure is coherent and well-organized.
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6">
                        Close
                    </Button>
                    {suggestions && suggestions[0]?.improved && (
                        <Button
                            onClick={handleApply}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                        >
                            Apply Optimized Order
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
