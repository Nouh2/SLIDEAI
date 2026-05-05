import { FileText, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SourceRef } from "./SourceCitation";

interface EvidenceSidebarProps {
  slides: Array<{ id?: string; title?: string; sourceRef?: SourceRef | null }>;
  selectedSlide: number;
  evidenceMode?: string;
  onSelectSlide: (index: number) => void;
  onClose: () => void;
}

export function EvidenceSidebar({ slides, selectedSlide, evidenceMode, onSelectSlide, onClose }: EvidenceSidebarProps) {
  const sourcedSlides = slides
    .map((slide, index) => ({ slide, index }))
    .filter(({ slide }) => Boolean(slide.sourceRef));
  const unsourcedCount = slides.filter((slide, index) => index > 0 && !slide.sourceRef && !slide.title?.toLowerCase().includes("annexe")).length;
  const strict = evidenceMode === "strict";

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            Sources
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Traçabilité des slides générées depuis document.
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Mode</span>
          <Badge variant="outline" className={strict ? "border-emerald-500/30 text-emerald-600" : ""}>
            {strict ? "Preuves strict" : "Standard"}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border p-3">
            <div className="text-2xl font-bold">{sourcedSlides.length}</div>
            <div className="text-xs text-muted-foreground">slides sourcées</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-2xl font-bold">{unsourcedCount}</div>
            <div className="text-xs text-muted-foreground">à contrôler</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sourcedSlides.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Aucune source attachée à ce deck. Les sources apparaissent après génération depuis un document structuré.
          </div>
        ) : (
          sourcedSlides.map(({ slide, index }) => {
            const source = slide.sourceRef!;
            const active = selectedSlide === index;
            const pages = source.pageStart === source.pageEnd ? `p.${source.pageStart}` : `p.${source.pageStart}-${source.pageEnd}`;

            return (
              <button
                key={`${slide.id || index}-${source.sectionTitle}`}
                onClick={() => onSelectSlide(index)}
                className={`w-full rounded-lg border p-3 text-left transition ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">Slide {index + 1}</p>
                    <p className="text-sm font-medium truncate">{slide.title || "Sans titre"}</p>
                  </div>
                  {source.verified === false ? (
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  <Badge variant="outline" className="text-[10px]">{pages}</Badge>
                  <p className="text-xs text-muted-foreground line-clamp-2">{source.sectionTitle}</p>
                </div>
                {source.originalText && (
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                    {source.originalText}
                  </p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

