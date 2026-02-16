// src/components/editor/ExportDialog.tsx
// Export dialog with PDF and PPTX options

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Globe, Copy } from 'lucide-react';
import { exportToPDF } from '@/lib/export';
import { exportToPPTX } from '@/lib/export/pptx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { api, TemplateOverlay as TemplateOverlayType } from '@/lib/api';

import { ModernSlideRenderer } from '@/components/slides/ModernSlideRenderer';
import { TemplateOverlay } from '@/components/slides/TemplateOverlay';
import type { ExportProgress } from '@/lib/export';
import { Analytics, ANALYTICS_EVENTS } from '@/lib/analytics';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accessToken: string | null;
    presentation: {
        id?: string;
        title: string;
        slides: any[];
        theme: string;
        colorScheme?: any;
        brandLogoUrl?: string;
        templateOverlay?: TemplateOverlayType;
    };
}

export function ExportDialog({ open, onOpenChange, presentation, accessToken }: ExportDialogProps) {
    const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [targetLanguage, setTargetLanguage] = useState<string>("original");
    const [previewDeck, setPreviewDeck] = useState<any>(null);
    const hiddenSlidesRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const pollTranslationStatus = async (traceId: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const interval = setInterval(async () => {
                try {
                    const status = await api.getJobStatus(traceId);
                    if (status.status === 'succeeded') {
                        clearInterval(interval);
                        resolve(status); // Return full status object
                    } else if (status.status === 'failed') {
                        clearInterval(interval);
                        reject(new Error(status.error || 'Translation failed'));
                    }
                } catch (err) {
                    clearInterval(interval);
                    reject(err);
                }
            }, 2000);
        });
    };

    // Reset local state when dialog is closed
    useEffect(() => {
        if (!open) {
            setPreviewDeck(null);
            setTargetLanguage("original");
            setError(null);
        }
    }, [open]);

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
            let exportDeck = { ...presentation };

            // Handle translation if a target language is selected
            if (targetLanguage !== "original" && accessToken) {
                setExportProgress({
                    current: 0,
                    total: presentation.slides.length,
                    status: 'preparing',
                    message: t('export.translating', { defaultValue: 'Translating deck...' })
                });

                const { traceId } = await api.translateDeck(presentation, targetLanguage, accessToken);
                const status = await pollTranslationStatus(traceId);
                const translatedDeck = status.deck;
                exportDeck = { ...presentation, ...translatedDeck };
                setPreviewDeck(exportDeck);

                // Small delay to ensure React has updated the DOM with translated content
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Get all rendered slide elements from the hidden container
            // We need to wait a tick for the hidden slides to re-render if translated
            await new Promise(resolve => setTimeout(resolve, 500));

            const slideElements = hiddenSlidesRef.current.querySelectorAll('[data-slide-export]');

            if (slideElements.length === 0) {
                throw new Error(t('export.noSlides'));
            }

            await exportToPDF(
                Array.from(slideElements) as HTMLElement[],
                exportDeck.title,
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
            let exportDeck = {
                id: presentation.id || 'export',
                title: presentation.title,
                slides: presentation.slides,
                theme: presentation.theme,
                colorScheme: presentation.colorScheme,
            };

            // Handle translation if a target language is selected
            if (targetLanguage !== "original" && accessToken) {
                setExportProgress({
                    current: 0,
                    total: presentation.slides.length,
                    status: 'preparing',
                    message: t('export.translating', { defaultValue: 'Translating deck...' })
                });

                const { traceId } = await api.translateDeck(presentation, targetLanguage, accessToken);
                const status = await pollTranslationStatus(traceId);
                const translatedDeck = status.deck;

                // Update exportDeck with translated content
                exportDeck = {
                    ...exportDeck,
                    title: translatedDeck.title || exportDeck.title,
                    slides: translatedDeck.slides || exportDeck.slides
                };
            }

            await exportToPPTX(exportDeck, setExportProgress);

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
    }, [presentation, onOpenChange, targetLanguage, accessToken]);

    const handleTranslateAndDuplicate = useCallback(async () => {
        if (!presentation || !accessToken || targetLanguage === 'original') return;

        setError(null);
        setExportProgress({
            current: 0,
            total: presentation.slides.length,
            status: 'preparing',
            message: t('export.translatingAndDuplicating', { defaultValue: 'Translating and creating copy...' })
        });

        try {
            const { traceId } = await api.translateDeck(presentation, targetLanguage, accessToken, true);
            const status = await pollTranslationStatus(traceId);

            if (status.newPresentationId) {
                setExportProgress({
                    current: presentation.slides.length,
                    total: presentation.slides.length,
                    status: 'complete',
                    message: t('export.redirecting', { defaultValue: 'Redirecting to new deck...' })
                });

                // Keep success state briefly then redirect
                setTimeout(() => {
                    navigate(`/editor/${status.newPresentationId}`);
                }, 1000);
            } else {
                throw new Error('No new presentation ID returned');
            }

        } catch (err: any) {
            console.error('Translation duplication error:', err);
            setError(err.message || t('export.genericError'));
            setExportProgress(null);
        }
    }, [presentation, targetLanguage, accessToken, navigate]);

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

                {/* Language Selection */}
                {!isExporting && !isComplete && (
                    <div className="space-y-3 py-2">
                        <Label htmlFor="language-select" className="text-sm font-medium flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            {t('export.targetLanguage', { defaultValue: 'Export Language' })}
                        </Label>
                        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                            <SelectTrigger id="language-select">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="original">{t('export.originalLanguage', { defaultValue: 'Original' })}</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="de">Deutsch</SelectItem>
                                <SelectItem value="pt">Português</SelectItem>
                                <SelectItem value="it">Italiano</SelectItem>

                            </SelectContent>
                        </Select>

                        {targetLanguage !== 'original' && (
                            <Button
                                variant="outline"
                                className="w-full mt-2 gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                                onClick={handleTranslateAndDuplicate}
                                disabled={isExporting}
                            >
                                <Copy className="w-4 h-4" />
                                {t('export.translateAndCopy', { defaultValue: 'Translate & Create Copy' })}
                            </Button>
                        )}

                        <p className="text-[10px] text-muted-foreground italic">
                            {t('export.translationDisclaimer', { defaultValue: '* Translation is handled by AI and may require manual review.' })}
                        </p>
                    </div>
                )
                }

                {/* Export Options */}
                {
                    !isExporting && !isComplete && (
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

                            {/* PPTX Option */}
                            <button
                                onClick={handlePPTXExport}
                                disabled={isExporting}
                                className="group relative flex flex-col items-center p-6 rounded-2xl border-2 border-border bg-surface/50 hover:border-primary hover:bg-primary/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-left"
                            >
                                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet className="w-7 h-7 text-orange-500" />
                                </div>
                                <h3 className="font-bold text-foreground mb-1">PowerPoint</h3>
                                <p className="text-xs text-muted-foreground text-center">
                                    {t('export.pptxDescription', { defaultValue: 'Export PowerPoint haute fidélité avec support multi-langues.' })}
                                </p>
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
                    )
                }

                {/* Progress Indicator */}
                {
                    isExporting && (
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
                    )
                }

                {/* Success State */}
                {
                    isComplete && (
                        <div className="py-8 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="font-bold text-lg text-foreground">{t('export.complete')}</p>
                            <p className="text-sm text-muted-foreground">
                                {t('export.downloaded')}
                            </p>
                        </div>
                    )
                }

                {/* Error State */}
                {
                    error && (
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
                    )
                }

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
                    {(() => {
                        // Use a local state or ref for the deck to render based on translation
                        // For the hidden slides, we need to decide if we use 'presentation' or a 'translatedDeck'
                        // Since PDF export is triggered after translation, we can just rely on presentation if we update it
                        // BUT, to avoid state race conditions, we can trigger a re-render of hidden slides 
                        // by passing the target deck here.

                        // For now, let's assume we want to render whatever is in the 'presentation' prop
                        // unless we've just translated it. 
                        // Actually, the hidden renderer should probably just use the 'presentation' but we can
                        // simulate the switch by having the translated data available.

                        // Let's use a simpler approach: the hidden slides will always use 'presentation'
                        // and we will update 'presentation' (or a copy of it) for rendering.
                        // Actually, in this component, 'presentation' is a prop. 
                        // If we want to render translated slides without changing the parent state,
                        // we use the local 'previewDeck' state if available.
                        const activeDeck = previewDeck || presentation;

                        const currentSlides = activeDeck?.slides || [];
                        const mainSlides = currentSlides.filter((s: any) => !s.isAppendix) || [];
                        const appendixSlides = currentSlides.filter((s: any) => s.isAppendix) || [];
                        const processedSlides = appendixSlides.length > 0
                            ? [...mainSlides, { isSeparator: true, id: 'appendix-separator', title: 'Appendix', type: 'section-divider', layout: 'section-divider' }, ...appendixSlides]
                            : mainSlides;

                        return processedSlides.map((slide: any, index: number) => (
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
                                        config={activeDeck.templateOverlay}
                                        logoUrl={activeDeck.brandLogoUrl}
                                        slideNumber={index + 1}
                                        totalSlides={processedSlides.length}
                                        isFirst={index === 0}
                                    >
                                        <ModernSlideRenderer
                                            slide={slide.isSeparator ? {
                                                type: 'section-divider',
                                                title: slide.title,
                                                content: { title: slide.title }
                                            } : slide}
                                            theme={activeDeck.theme}
                                            colorPalette={activeDeck.colorScheme}
                                            titleFontScale={activeDeck.theme?.titleFontScale}
                                            textFontScale={activeDeck.theme?.textFontScale}
                                            className="w-[1920px] h-[1080px] min-w-[1920px] min-h-[1080px]"
                                        />
                                    </TemplateOverlay>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </DialogContent >
        </Dialog >
    );
}
