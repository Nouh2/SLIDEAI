// src/components/editor/ExportDialog.tsx
// Export dialog with PDF and PPTX options

import { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { exportToPDF } from '@/lib/export';
import { exportToPPTX } from '@/lib/export/pptx';
import { ModernSlideRenderer } from '@/components/slides/ModernSlideRenderer';
import type { ExportProgress } from '@/lib/export';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    presentation: {
        id?: string;
        title: string;
        slides: any[];
        theme: string;
        colorScheme?: any;
    };
}

export function ExportDialog({ open, onOpenChange, presentation }: ExportDialogProps) {
    const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const hiddenSlidesRef = useRef<HTMLDivElement>(null);

    const handlePDFExport = useCallback(async () => {
        if (!presentation || !hiddenSlidesRef.current) return;

        setError(null);
        setExportProgress({
            current: 0,
            total: presentation.slides.length,
            status: 'preparing',
            message: 'Préparation...'
        });

        try {
            // Get all rendered slide elements from the hidden container
            const slideElements = hiddenSlidesRef.current.querySelectorAll('[data-slide-export]');

            if (slideElements.length === 0) {
                throw new Error('Aucune slide trouvée');
            }

            await exportToPDF(
                Array.from(slideElements) as HTMLElement[],
                presentation.title,
                setExportProgress
            );

            // Keep success state visible briefly
            setTimeout(() => {
                setExportProgress(null);
                onOpenChange(false);
            }, 1500);

        } catch (err: any) {
            console.error('PDF export error:', err);
            setError(err.message || 'Erreur lors de l\'export');
            setExportProgress(null);
        }
    }, [presentation, onOpenChange]);

    const handlePPTXExport = useCallback(async () => {
        if (!presentation) return;

        setError(null);
        setExportProgress({
            current: 0,
            total: presentation.slides.length,
            status: 'preparing',
            message: 'Initialisation...'
        });

        try {
            await exportToPPTX(
                {
                    id: presentation.id || 'export',
                    title: presentation.title,
                    slides: presentation.slides,
                    theme: presentation.theme,
                    colorScheme: presentation.colorScheme,
                },
                setExportProgress
            );

            // Keep success state visible briefly
            setTimeout(() => {
                setExportProgress(null);
                onOpenChange(false);
            }, 1500);

        } catch (err: any) {
            console.error('PPTX export error:', err);
            setError(err.message || 'Erreur lors de l\'export PowerPoint');
            setExportProgress(null);
        }
    }, [presentation, onOpenChange]);

    const isExporting = exportProgress !== null && exportProgress.status !== 'complete';
    const isComplete = exportProgress?.status === 'complete';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-border bg-background/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Exporter la présentation</DialogTitle>
                    <DialogDescription>
                        Choisissez le format d'export pour "{presentation?.title}"
                    </DialogDescription>
                </DialogHeader>

                {/* Export Options */}
                {!isExporting && !isComplete && (
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {/* PDF Option */}
                        <button
                            onClick={handlePDFExport}
                            disabled={isExporting}
                            className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-border bg-surface/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        >
                            <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">PDF</h3>
                            <p className="text-xs text-muted-foreground text-center">
                                Haute fidélité visuelle
                            </p>
                            <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                Prêt
                            </span>
                        </button>

                        {/* PPTX Option - Coming Soon */}
                        <div
                            className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-border bg-surface/50 opacity-60 cursor-not-allowed"
                        >
                            <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                                <FileSpreadsheet className="w-7 h-7 text-orange-400" />
                            </div>
                            <h3 className="font-bold text-muted-foreground mb-1">PowerPoint</h3>
                            <p className="text-xs text-muted-foreground text-center">
                                Bientôt disponible
                            </p>
                            <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                Beta
                            </span>
                            <p className="text-[10px] text-muted-foreground text-center mt-2">
                                On y travaille ! 🚀
                            </p>
                        </div>
                    </div>
                )}

                {/* Progress Indicator */}
                {isExporting && (
                    <div className="py-8 space-y-4">
                        <div className="flex items-center justify-center gap-3 text-primary">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="font-medium">{exportProgress?.message}</span>
                        </div>
                        <Progress
                            value={(exportProgress!.current / exportProgress!.total) * 100}
                            className="h-2"
                        />
                        <p className="text-center text-sm text-muted-foreground">
                            Slide {exportProgress?.current} / {exportProgress?.total}
                        </p>
                    </div>
                )}

                {/* Success State */}
                {isComplete && (
                    <div className="py-8 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="font-bold text-lg text-foreground">Export terminé !</p>
                        <p className="text-sm text-muted-foreground">
                            Le fichier a été téléchargé
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="py-4 flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                        <p className="text-sm text-destructive">{error}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setError(null)}
                            className="ml-auto"
                        >
                            OK
                        </Button>
                    </div>
                )}

                {/* Hidden slides container for rendering */}
                <div
                    ref={hiddenSlidesRef}
                    className="fixed left-[-9999px] top-0 z-[-9999]"
                    style={{ width: 1920, height: 1080 }}
                >
                    {presentation?.slides.map((slide: any, index: number) => (
                        <div
                            key={slide.id || index}
                            data-slide-export
                            style={{ width: 1920, height: 1080, overflow: 'hidden' }}
                        >
                            <ModernSlideRenderer
                                slide={slide}
                                theme={presentation.theme}
                                colorPalette={presentation.colorScheme}
                                className="w-full h-full"
                            />
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
