// src/components/editor/SourceCitation.tsx
// Evidence Linking component - displays source page reference for slide content

import { FileText, ShieldCheck, ShieldAlert } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface SourceRef {
    sectionTitle: string;
    pageStart: number;
    pageEnd: number;
    originalText?: string;
    verified?: boolean;
}

interface SourceCitationProps {
    sourceRef: SourceRef | null | undefined;
    className?: string;
}

/**
 * SourceCitation component displays source traceability information
 * for slides generated from parsed documents.
 * 
 * Shows a badge with page number that expands to show full source details.
 */
export function SourceCitation({ sourceRef, className = "" }: SourceCitationProps) {
    if (!sourceRef) return null;

    const pageLabel = sourceRef.pageStart === sourceRef.pageEnd
        ? `p.${sourceRef.pageStart}`
        : `p.${sourceRef.pageStart}-${sourceRef.pageEnd}`;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium 
                        bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 
                        rounded-full border border-blue-500/20 transition-colors cursor-pointer
                        ${className}`}
                    title="Voir la source"
                >
                    <FileText className="w-3 h-3" />
                    {pageLabel}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden shadow-xl" align="start" side="right">
                <div className="bg-muted/40 p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FileText className="w-4 h-4 text-primary" />
                        Source du Contenu
                    </div>
                    {sourceRef.verified !== undefined && (
                        <Badge variant="outline" className={`text-[10px] ${sourceRef.verified ? "border-emerald-500/30 text-emerald-600" : "border-amber-500/30 text-amber-600"}`}>
                            {sourceRef.verified ? (
                                <ShieldCheck className="w-3 h-3 mr-1" />
                            ) : (
                                <ShieldAlert className="w-3 h-3 mr-1" />
                            )}
                            {sourceRef.verified ? "Vérifiée" : "À vérifier"}
                        </Badge>
                    )}
                </div>

                <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Section</label>
                        <p className="text-sm font-medium text-foreground">{sourceRef.sectionTitle}</p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pages</label>
                        <Badge variant="outline" className="text-xs flex w-fit">
                            {sourceRef.pageStart === sourceRef.pageEnd
                                ? `Page ${sourceRef.pageStart}`
                                : `Pages ${sourceRef.pageStart} à ${sourceRef.pageEnd}`}
                        </Badge>
                    </div>

                    {sourceRef.originalText && (
                        <div className="space-y-2 pt-2 border-t border-border/50">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Extrait Original</label>
                            <div className="text-xs bg-muted/50 p-3 rounded-lg border border-border/50 text-muted-foreground italic leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                                "{sourceRef.originalText}"
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
