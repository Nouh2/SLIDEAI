import React from 'react';
import { cn } from "@/lib/utils";
import {
    Wand2,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateNarrativeSegments, DynamicSegment } from '@/lib/narrative-utils';

interface NarrativeFlowSidebarProps {
    slides: any[];
    onOptimizeFlow: () => void;
    onSelectSlide: (index: number) => void;
}

export const NarrativeFlowSidebar: React.FC<NarrativeFlowSidebarProps> = ({ slides, onOptimizeFlow, onSelectSlide }) => {
    const segments = React.useMemo(() => calculateNarrativeSegments(slides), [slides]);
    const [expandedSegments, setExpandedSegments] = React.useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        segments.forEach(s => {
            initial[s.id] = true;
        });
        return initial;
    });

    const toggleSegment = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedSegments(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Sync expanded segments when segments list changes
    React.useEffect(() => {
        setExpandedSegments(prev => {
            const next = { ...prev };
            let hasChanges = false;
            segments.forEach(s => {
                if (next[s.id] === undefined) {
                    next[s.id] = true;
                    hasChanges = true;
                }
            });
            return hasChanges ? next : prev;
        });
    }, [segments]);

    return (
        <div className="w-64 h-full border-r border-border bg-surface flex flex-col shrink-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex flex-col">
                    <h3 className="font-bold text-xs uppercase tracking-tight text-muted-foreground">Narrative Flow</h3>
                    <p className="text-[10px] text-muted-foreground">Dynamic structure analysis</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={onOptimizeFlow}
                    title="Optimize Flow with AI"
                >
                    <Wand2 className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {segments.map((segment) => (
                    <div
                        key={segment.id}
                        className="group flex flex-col p-2.5 rounded-xl transition-all border border-transparent hover:border-border hover:bg-muted/30"
                    >
                        <div
                            className="flex items-center justify-between mb-1.5 cursor-pointer"
                            onClick={(e) => toggleSegment(segment.id, e)}
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={cn(
                                    "p-1.5 rounded-lg shrink-0 border transition-transform",
                                    expandedSegments[segment.id] ? "scale-100" : "scale-90 opacity-70",
                                    segment.color.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('text-') || c.startsWith('border-')).join(' ')
                                )}>
                                    <segment.icon className="w-3.5 h-3.5" />
                                </div>
                                <span className={cn(
                                    "text-sm font-semibold truncate leading-none",
                                    !expandedSegments[segment.id] && "text-muted-foreground font-medium"
                                )}>
                                    {segment.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className="text-[10px] font-bold bg-muted border border-border px-1.5 py-0.5 rounded-md text-muted-foreground">
                                    {segment.slideCount}
                                </span>
                                {expandedSegments[segment.id] ? (
                                    <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                                )}
                            </div>
                        </div>

                        {expandedSegments[segment.id] && (
                            <div className="mt-2 space-y-1 pl-6 border-l border-border/50 ml-3 animate-in fade-in slide-in-from-left-1 duration-200">
                                {segment.slideTitles.slice(0, 10).map((title, i) => (
                                    <div
                                        key={i}
                                        className="text-[10px] text-muted-foreground truncate hover:text-primary cursor-pointer transition-colors flex items-center gap-1.5 group/item"
                                        onClick={() => onSelectSlide(segment.startIndex + i)}
                                    >
                                        <span className="opacity-40 group-hover/item:opacity-100 shrink-0 min-w-[14px]">{i + 1}.</span>
                                        <span className="truncate">{title}</span>
                                    </div>
                                ))}
                                {segment.slideTitles.length > 10 && (
                                    <div
                                        className="text-[9px] text-muted-foreground italic pl-3 hover:text-primary cursor-pointer"
                                        onClick={() => onSelectSlide(segment.startIndex + 10)}
                                    >
                                        + {segment.slideTitles.length - 10} more slides...
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-1 pl-3 mt-3">
                            {Array.from({ length: Math.min(segment.slideCount, 12) }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-1 w-1.5 rounded-full bg-border"
                                    style={{
                                        backgroundColor: i === 0 ? 'var(--slide-primary, #6366f1)' : undefined,
                                        opacity: 1 - (i * 0.08)
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-muted/20 border-t border-border mt-auto">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Flow Guide</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                    Categories are created automatically. Use <span className="font-semibold text-primary">Section Divider</span> slides to start new segments.
                </p>
            </div>
        </div>
    );
};

