// src/components/editor/ExportDialog.tsx
// Export dialog with PDF and PPTX options

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import { TemplateOverlay } from '@/components/slides/TemplateOverlay';
import type { ExportProgress } from '@/lib/export';
import { Analytics, ANALYTICS_EVENTS } from '@/lib/analytics';

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
    const { t } = useTranslation();

    const handlePDFExport = useCallback(async () => {
        if (!presentation || !hiddenSlidesRef.current) return;

        setError(null);
        setExportProgress({
            current: 0,
            total: presentation.slides.length,
            status: 'preparing',
            message: t('export.preparing')
        });

        try {
            // Get all rendered slide elements from the hidden container
            const slideElements = hiddenSlidesRef.current.querySelectorAll('[data-slide-export]');

            if (slideElements.length === 0) {
                throw new Error(t('export.noSlides'));
            }

            await exportToPDF(
                Array.from(slideElements) as HTMLElement[],
                presentation.title,
                setExportProgress
            );

            Analytics.trackEvent(ANALYTICS_EVENTS.PRESENTATION.CATEGORY, ANALYTICS_EVENTS.PRESENTATION.EXPORT, 'PDF');

            // Keep success state visible briefly
            setTimeout(() => {
                setExportProgress(null);
                onOpenChange(false);
            }, 1500);

        } catch (err: any) {
            console.error('PDF export error:', err);
            setError(err.message || t('export.genericError'));
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
            message: t('export.initializing')
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
            setError(err.message || t('export.pptxError'));
            setExportProgress(null);
        }
    }, [presentation, onOpenChange]);

    const isExporting = exportProgress !== null && exportProgress.status !== 'complete';
    const isComplete = exportProgress?.status === 'complete';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-border bg-background/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{t('export.title')}</DialogTitle>
                    <DialogDescription>
                        {t('export.subtitle', { title: presentation?.title })}
                    </DialogDescription>
                </DialogHeader>

                {/* Export Options */}
                {!isExporting && !isComplete && (
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {/* PDF Option */}
                        <button
                            onClick={handlePDFExport}
                            disabled={isExporting}
                            className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-border bg-surface/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-left"
                        >
                            <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <FileText className="w-7 h-7 text-red-500" />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">PDF <span className="text-xs font-normal text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full ml-1">Bêta</span></h3>
                            <p className="text-xs text-muted-foreground text-center">
                                Export fonctionnel mais quelques imperfections mineures possibles.
                            </p>
                        </button>

                        {/* PPTX Option - Coming Soon */}
                        <button
                            disabled={true}
                            className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-border bg-surface/30 opacity-60 cursor-not-allowed"
                        >
                            <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 grayscale">
                                <FileSpreadsheet className="w-7 h-7 text-orange-500" />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">PowerPoint</h3>
                            <p className="text-xs text-muted-foreground text-center">
                                Bientôt disponible - En cours d'amélioration pour une fidélité parfaite.
                            </p>
                            <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                Bientôt
                            </span>
                        </button>

                        {/* Google Slides Option */}
                        <button
                            disabled={true}
                            className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-border bg-surface/30 opacity-60 cursor-not-allowed col-span-2 md:col-span-1 md:col-start-1 md:col-end-3 mx-auto w-full max-w-[50%] hidden md:flex"
                        >
                            <div className="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 grayscale">
                                <FileSpreadsheet className="w-7 h-7 text-yellow-500" />
                            </div>
                            <h3 className="font-bold text-foreground mb-1">Google Slides</h3>
                            <p className="text-xs text-muted-foreground text-center">
                                Arrive prochainement
                            </p>
                            <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                Bientôt
                            </span>
                        </button>
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
                            {t('export.progressSlide', { current: exportProgress?.current, total: exportProgress?.total })}
                        </p>
                    </div>
                )}

                {/* Success State */}
                {isComplete && (
                    <div className="py-8 flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <p className="font-bold text-lg text-foreground">{t('export.complete')}</p>
                        <p className="text-sm text-muted-foreground">
                            {t('export.downloaded')}
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

                {/* Hidden slides container for PDF rendering */}
                <div
                    ref={hiddenSlidesRef}
                    aria-hidden="true"
                    style={{
                        position: 'fixed',
                        left: -9999,
                        top: 0,
                        width: 1920,
                        height: 1080,
                        overflow: 'visible',
                        pointerEvents: 'none',
                        zIndex: -9999,
                    }}
                >
                    {presentation?.slides.map((slide: any, index: number) => (
                        <div
                            key={slide.id || index}
                            data-slide-export
                            data-slide-index={index}
                            style={{
                                position: 'absolute',
                                top: index * 1100,
                                left: 0,
                                width: 1920,
                                height: 1080,
                                overflow: 'hidden',
                                background: '#fff',
                            }}
                        >
                            <div style={{ width: 1920, height: 1080, overflow: 'hidden' }}>
                                <TemplateOverlay
                                    config={presentation.templateOverlay}
                                    logoUrl={presentation.brandLogoUrl}
                                    slideNumber={index + 1}
                                    totalSlides={presentation.slides.length}
                                    isFirst={index === 0}
                                >
                                    <ModernSlideRenderer
                                        slide={slide}
                                        theme={presentation.theme}
                                        colorPalette={presentation.colorScheme}
                                        className="w-[1920px] h-[1080px] min-w-[1920px] min-h-[1080px]"
                                    />
                                </TemplateOverlay>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
