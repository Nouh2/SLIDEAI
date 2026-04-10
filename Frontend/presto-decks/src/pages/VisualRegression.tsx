import { useEffect, useMemo, useRef } from 'react';
import React from 'react';
import { ModernSlideRenderer } from '@/components/slides/ModernSlideRenderer';
import { captureSlide } from '@/lib/export/pdfExporter';
import { normalizeExportDeck } from '@/lib/export';
import { getVisualRegressionDeck } from '@/data/visualRegressionFixtures';

declare global {
    interface Window {
        __VISUAL_READY__?: boolean;
        __VISUAL_ERROR__?: string;
        __captureExportSlide__?: (index: number) => Promise<string>;
    }
}

class SlideErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch() {
        // no-op: visual runner will detect big diffs on fallback content.
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                        color: '#111827',
                        background: '#ffffff',
                        border: '2px dashed #ef4444',
                    }}
                >
                    Slide render error
                </div>
            );
        }
        return this.props.children;
    }
}

export default function VisualRegression() {
    const maxSlidesFromQuery = useMemo(() => {
        const raw = new URLSearchParams(window.location.search).get('max');
        if (!raw) return undefined;
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
    }, []);
    const offsetFromQuery = useMemo(() => {
        const raw = new URLSearchParams(window.location.search).get('offset');
        if (!raw) return 0;
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
    }, []);
    const normalizedDeck = useMemo(
        () => normalizeExportDeck(getVisualRegressionDeck(maxSlidesFromQuery, offsetFromQuery)),
        [maxSlidesFromQuery, offsetFromQuery],
    );
    const slideRefs = useRef<Array<HTMLDivElement | null>>([]);

    useEffect(() => {
        let isMounted = true;
        const setup = async () => {
            if ('fonts' in document) {
                await Promise.race([
                    (document as any).fonts.ready,
                    new Promise((resolve) => setTimeout(resolve, 10000)),
                ]);
            }

            // Let the browser settle layout/paint before exposing capture hooks.
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            await new Promise((resolve) => setTimeout(resolve, 200));

            window.__captureExportSlide__ = async (index: number) => {
                const el = slideRefs.current[index];
                if (!el) throw new Error(`Slide ${index} not found`);
                // Use native 1x capture for regression checks to avoid resampling noise.
                return captureSlide(el, 1);
            };

            if (isMounted) {
                window.__VISUAL_READY__ = true;
            }
        };

        setup().catch((error: any) => {
            window.__VISUAL_ERROR__ = error?.message || 'Unknown setup error';
            window.__VISUAL_READY__ = false;
        });

        return () => {
            isMounted = false;
            window.__VISUAL_READY__ = false;
            window.__VISUAL_ERROR__ = undefined;
            window.__captureExportSlide__ = undefined;
        };
    }, []);

    return (
        <main className="bg-black min-h-screen p-4 space-y-8">
            <style>{`
                *, *::before, *::after {
                    animation: none !important;
                    transition: none !important;
                    caret-color: transparent !important;
                    box-shadow: none !important;
                    text-shadow: none !important;
                    filter: none !important;
                    mix-blend-mode: normal !important;
                    background-blend-mode: normal !important;
                    backdrop-filter: none !important;
                    -webkit-backdrop-filter: none !important;
                    mask-image: none !important;
                    -webkit-mask-image: none !important;
                }
            `}</style>
            {normalizedDeck.slides.map((slide, index) => (
                <section key={slide.id} data-qa-slide={index}>
                    <div
                        ref={(el) => { slideRefs.current[index] = el; }}
                        data-qa-slide-root={index}
                        data-qa-slide-type={slide.type || slide.layout || ''}
                        data-qa-slide-key={`${slide.layout || slide.type || 'unknown'}:${slide.variation || 'default'}`}
                        style={{
                            width: 1920,
                            height: 1080,
                            overflow: 'hidden',
                            background: '#fff',
                        }}
                    >
                        <SlideErrorBoundary>
                            <ModernSlideRenderer
                                slide={slide}
                                theme={normalizedDeck.theme}
                                renderMode="export"
                                colorPalette={normalizedDeck.colorScheme}
                                titleFontScale={normalizedDeck.themeConfig.titleFontScale}
                                textFontScale={normalizedDeck.themeConfig.textFontScale}
                                className="w-[1920px] h-[1080px]"
                            />
                        </SlideErrorBoundary>
                    </div>
                </section>
            ))}
        </main>
    );
}
