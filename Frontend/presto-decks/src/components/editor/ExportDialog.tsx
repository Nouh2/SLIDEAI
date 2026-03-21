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
import { exportToPDF, normalizeExportDeck } from '@/lib/export';
import { exportToPPTX, exportToPPTXWithImages } from '@/lib/export/pptx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { api, TemplateOverlay as TemplateOverlayType } from '@/lib/api';
import { UpgradeGate } from '@/components/common/UpgradeGate';
import { SubscriptionSnapshot, hasFeature, isExpiredTrialSubscription } from '@/lib/subscription';

import { ModernSlideRenderer } from '@/components/slides/ModernSlideRenderer';
import { TemplateOverlay } from '@/components/slides/TemplateOverlay';
import type { ExportProgress } from '@/lib/export';
import { Analytics, ANALYTICS_EVENTS } from '@/lib/analytics';

interface ExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accessToken: string | null;
    subscription?: SubscriptionSnapshot | null;
    presentation: {
        id?: string;
        title: string;
        slides: any[];
        theme: string;
        colorScheme?: any;
        fontConfig?: any;
        brandLogoUrl?: string;
        templateOverlay?: TemplateOverlayType;
    };
}

export function ExportDialog({ open, onOpenChange, presentation, accessToken, subscription }: ExportDialogProps) {
    const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [targetLanguage, setTargetLanguage] = useState<string>("original");
    const [pptxMode, setPptxMode] = useState<'pixel-perfect' | 'editable'>('pixel-perfect');
    const [previewDeck, setPreviewDeck] = useState<any>(null);
    const hiddenSlidesRef = useRef<HTMLDivElement>(null);
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const editableModeDescription = i18n.language.startsWith('fr')
        ? 'Export PowerPoint editable pour les layouts pris en charge, avec fallback image automatique pour le reste.'
        : 'Editable PowerPoint export for supported layouts, with automatic image fallback for the rest.';
    const canExportPdf = hasFeature(subscription, 'export_pdf');
    const canExportPptx = hasFeature(subscription, 'export_pptx');
    const canExportEditablePptx = hasFeature(subscription, 'export_editable_pptx');
    const exportLocked = !canExportPdf && !canExportPptx;
    const exportUpgradeTitle = i18n.language.startsWith('fr')
        ? 'Export reserve a un abonnement actif'
        : 'Export requires an active plan';
    const exportUpgradeDescription = isExpiredTrialSubscription(subscription)
        ? (i18n.language.startsWith('fr')
            ? 'Votre essai est termine. Reprenez un abonnement Starter ou Pro pour exporter vos decks.'
            : 'Your trial has ended. Upgrade to Starter or Pro to export your decks.')
        : (i18n.language.startsWith('fr')
            ? 'L export PDF et PowerPoint est disponible selon votre plan. Passez a Starter ou Pro pour le debloquer.'
            : 'PDF and PowerPoint export depend on your plan. Upgrade to Starter or Pro to unlock it.');

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
            setPptxMode('pixel-perfect');
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
            let exportDeckRaw = { ...presentation };

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
                exportDeckRaw = { ...presentation, ...translatedDeck };
                setPreviewDeck(exportDeckRaw);

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

            const exportDeck = normalizeExportDeck(exportDeckRaw);

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
        if (!presentation || !hiddenSlidesRef.current) return;

        setError(null);
        setExportProgress({
            current: 0,
            total: presentation.slides.length,
            status: 'preparing',
            message: t('export.initializing')
        });

        try {
            let exportDeckRaw = { ...presentation };

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
                exportDeckRaw = { ...presentation, ...translatedDeck };
                setPreviewDeck(exportDeckRaw);

                // Small delay to ensure React has updated the DOM with translated content
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const exportDeck = normalizeExportDeck(exportDeckRaw);
            await new Promise(resolve => setTimeout(resolve, 500));
            const slideElements = hiddenSlidesRef.current.querySelectorAll('[data-slide-export]');

            if (pptxMode === 'editable') {
                await exportToPPTX(
                    exportDeck,
                    Array.from(slideElements) as HTMLElement[],
                    setExportProgress
                );
            } else {
                // Get all rendered slide elements from the hidden container
                if (slideElements.length === 0) {
                    throw new Error(t('export.noSlides'));
                }

                await exportToPPTXWithImages(
                    Array.from(slideElements) as HTMLElement[],
                    exportDeck.title,
                    setExportProgress
                );
            }

            // Analytics.trackEvent(ANALYTICS_EVENTS.PRESENTATION.CATEGORY, ANALYTICS_EVENTS.PRESENTATION.EXPORT, 'PPTX');

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
    }, [presentation, onOpenChange, targetLanguage, accessToken, pptxMode, t]);

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

                        <div className="space-y-2 pt-2">
                            <Label htmlFor="pptx-mode-select" className="text-sm font-medium">
                                {t('export.pptxMode', { defaultValue: 'PowerPoint Mode' })}
                            </Label>
                            <Select
                                value={pptxMode}
                                onValueChange={(value) => setPptxMode(value as 'pixel-perfect' | 'editable')}
                                disabled={!canExportPptx}
                            >
                                <SelectTrigger id="pptx-mode-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pixel-perfect">
                                        {t('export.pptxModePixelPerfect', { defaultValue: 'Pixel Perfect (Recommended)' })}
                                    </SelectItem>
                                    <SelectItem value="editable" disabled={!canExportEditablePptx}>
                                        {t('export.pptxModeEditable', { defaultValue: 'Editable Objects (Beta)' })}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">
                                {!canExportPptx
                                    ? (i18n.language.startsWith('fr')
                                        ? 'L export PowerPoint est disponible a partir du plan Starter.'
                                        : 'PowerPoint export is available from Starter.')
                                    : pptxMode === 'pixel-perfect'
                                    ? t('export.pptxModePixelPerfectDesc', { defaultValue: 'Visual fidelity max. Slides are exported as images in PowerPoint.' })
                                    : t('export.pptxModeEditableDesc', { defaultValue: 'Editable PowerPoint objects, with partial fidelity depending on layout/variants.' })}
                            </p>
                        </div>
                    </div>
                )
                }

                {/* Export Options */}
                {
                    !isExporting && !isComplete && (
                        exportLocked ? (
                            <div className="py-4">
                                <UpgradeGate
                                    title={exportUpgradeTitle}
                                    description={exportUpgradeDescription}
                                    cta={i18n.language.startsWith('fr') ? 'Voir les abonnements' : 'View plans'}
                                    onUpgrade={() => {
                                        onOpenChange(false);
                                        navigate('/pricing');
                                    }}
                                />
                            </div>
                        ) : (
                        <div className="grid grid-cols-2 gap-4 py-4">
                            {/* PDF Option */}
                            <button
                                onClick={handlePDFExport}
                                disabled={isExporting || !canExportPdf}
                                className={`group relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-left ${
                                    canExportPdf
                                        ? 'border-border bg-surface/50 hover:border-primary hover:bg-primary/5'
                                        : 'border-border bg-surface/30 opacity-60 cursor-not-allowed'
                                }`}
                            >
                                <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText className="w-7 h-7 text-red-500" />
                                </div>
                                <h3 className="flex items-center gap-1 font-bold text-foreground mb-1">
                                    PDF <span className="text-[10px] font-normal text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">{t('export.beta')}</span>
                                </h3>
                                <p className="text-xs text-muted-foreground text-center">
                                    {t('export.pdfDesc', { defaultValue: 'Export functional but some minor imperfections possible.' })}
                                </p>
                            </button>

                            {/* PPTX Option */}
                            <button
                                onClick={handlePPTXExport}
                                disabled={isExporting || !canExportPptx}
                                className={`group relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-left ${
                                    canExportPptx
                                        ? 'border-border bg-surface/50 hover:border-primary hover:bg-primary/5'
                                        : 'border-border bg-surface/30 opacity-60 cursor-not-allowed'
                                }`}
                            >
                                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet className="w-7 h-7 text-orange-500" />
                                </div>
                                <h3 className="flex items-center gap-1 font-bold text-foreground mb-1">
                                    PowerPoint <span className="text-[10px] font-normal text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        {pptxMode === 'pixel-perfect' ? t('export.pixelPerfect') : t('export.editable')}
                                    </span>
                                </h3>
                                <p className="text-xs text-muted-foreground text-center">
                                    {!canExportPptx
                                        ? (i18n.language.startsWith('fr')
                                            ? 'Disponible a partir du plan Starter.'
                                            : 'Available from Starter.')
                                        : pptxMode === 'pixel-perfect'
                                        ? t('export.pptxDescription')
                                        : editableModeDescription}
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
                        // Render from the same deck shape used by the editor to minimize visual drift.
                        const activeDeck = previewDeck || presentation;

                        const currentSlides = Array.isArray(activeDeck?.slides) ? activeDeck.slides : [];
                        const mainSlides = currentSlides.filter((s: any) => !s.isAppendix) || [];
                        const appendixSlides = currentSlides.filter((s: any) => s.isAppendix) || [];
                        const processedSlides = appendixSlides.length > 0
                            ? [...mainSlides, { isSeparator: true, id: 'appendix-separator', title: 'Appendix', type: 'section-divider', layout: 'section-divider' }, ...appendixSlides]
                            : mainSlides;
                        const titleFontScale = Number(activeDeck?.themeConfig?.titleFontScale ?? activeDeck?.theme?.titleFontScale ?? 1);
                        const textFontScale = Number(activeDeck?.themeConfig?.textFontScale ?? activeDeck?.theme?.textFontScale ?? 1);

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
                                        config={activeDeck?.templateOverlay}
                                        logoUrl={activeDeck?.brandLogoUrl}
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
                                            theme={activeDeck?.theme}
                                            colorPalette={activeDeck?.colorScheme}
                                            fontConfig={activeDeck?.fontConfig}
                                            titleFontScale={titleFontScale}
                                            textFontScale={textFontScale}
                                            className="w-full h-full"
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
