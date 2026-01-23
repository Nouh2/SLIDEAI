import React from 'react';
import { useTranslation } from 'react-i18next';
import { SlideData } from '@/lib/api';
import { adaptToLayout, SlideLayoutType } from '@/lib/slide-adapter';
import { ModernSlideRenderer } from '@/components/slides/ModernSlideRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { LayoutGrid, List, Columns, Maximize, BarChart, PieChart, Table, Hash } from 'lucide-react';

interface LayoutSwitcherProps {
    currentSlide: SlideData;
    theme: string;
    colors: any;
    onUpdateSlide: (newSlide: SlideData) => void;
}

export function LayoutSwitcher({ currentSlide, theme, colors, onUpdateSlide }: LayoutSwitcherProps) {
    const [originalSlide, setOriginalSlide] = React.useState<SlideData | null>(null);
    const { t } = useTranslation();

    // Initial capture
    React.useEffect(() => {
        if (currentSlide && !originalSlide) {
            setOriginalSlide(JSON.parse(JSON.stringify(currentSlide)));
        } else if (currentSlide && originalSlide && currentSlide.id !== originalSlide.id) {
            setOriginalSlide(JSON.parse(JSON.stringify(currentSlide)));
        }
    }, [currentSlide?.id]);

    if (!currentSlide) return null;

    // Detect Layout Family based on content - MIRRORING ModernSlideRenderer logic
    const getLayoutContext = (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();

        // Priority 1: Strict Types
        if (type === 'table' || type.includes('pricing') || (slide.content?.table && !slide.content.chart)) return 'table';
        if (type.includes('chart') || (type.includes('graph') && !type.includes('infographic'))) return 'chart';
        if (type.includes('start') || type.includes('cover') || type.includes('hero')) return 'cover';
        if (type.includes('section') || type.includes('divider')) return 'section';

        // Priority 2: Semantic Types
        if (type.includes('stat') || type.includes('metric') || type.includes('kpi')) return 'stats';
        if (type.includes('timeline') || type.includes('roadmap') || type.includes('process')) return 'timeline';
        if (type.includes('compare') || type.includes('versus') || type.includes('comparison')) return 'comparison';
        if (type.includes('showcase') || type.includes('product')) return 'showcase';
        if (type.includes('infographic') || type.includes('funnel') || type.includes('pyramid')) return 'infographic';
        if (type.includes('image') || type.includes('gallery') || slide.images?.length > 1) return 'image';
        if (type.includes('bento') || type.includes('grid') || type.includes('feature')) return 'bento';

        // Priority 3: Content Fallback
        if (type.includes('quote')) return 'content'; // Quote fits in content columns usually
        if (type.includes('text') && type.includes('column')) return 'text-columns'; // Explicit text columns
        if (type.includes('content') || type.includes('bullet') || type.includes('text') || slide.content?.bullets) return 'content';

        return 'content'; // Default fallback
    };

    const context = getLayoutContext(currentSlide);

    // Define NATIVE variations for the current component type
    const getNativeVariations = (ctx: string) => {
        switch (ctx) {
            case 'content':
                return [
                    { id: 'classic', label: 'Classic', icon: List },
                    { id: 'split-card', label: 'Split Card', icon: Columns },
                    { id: 'hero-block', label: 'Hero Block', icon: LayoutGrid },
                    { id: 'magazine', label: 'Magazine', icon: Columns },
                    { id: 'minimal-offset', label: 'Minimal', icon: List },
                ];
            case 'text-columns':
                return [
                    { id: 'classic', label: 'Classic', icon: Columns },
                    { id: 'modern-cards', label: 'Modern Cards', icon: LayoutGrid },
                    { id: 'numbered-editorial', label: 'Editorial', icon: List },
                    { id: 'side-highlight', label: 'Highlight', icon: Columns },
                    { id: 'vertical-separators', label: 'Vertical', icon: Columns },
                    { id: 'bento-text', label: 'Bento Text', icon: LayoutGrid },
                ];
            case 'section':
                return [
                    { id: 'default', label: 'Clean', icon: Maximize },
                    { id: 'big-number-outline', label: 'Big Number', icon: Hash },
                    { id: 'minimal-bar', label: 'Minimal Bar', icon: Columns },
                    { id: 'abstract-mesh', label: 'Mesh', icon: LayoutGrid },
                ];
            case 'stats':
                return [
                    { id: 'classic-grid', label: 'Classic Grid', icon: LayoutGrid },
                    { id: 'metric-cards', label: 'Metric Cards', icon: List },
                    { id: 'big-hero-stat', label: 'Hero Stat', icon: Maximize },
                    { id: 'data-progress', label: 'Progress', icon: BarChart },
                    { id: 'trend-focus', label: 'Trend Focus', icon: BarChart },
                ];
            case 'bento':
                return [
                    { id: 'default', label: 'Classic Grid', icon: LayoutGrid },
                    { id: 'magazine-grid', label: 'Magazine', icon: Columns },
                    { id: 'feature-focus', label: 'Feature List', icon: List },
                    { id: 'asymmetric-masonry', label: 'Masonry', icon: LayoutGrid },
                ];
            case 'table':
                return [
                    { id: 'default', label: 'Clean Table', icon: Table },
                    { id: 'data-grid', label: 'Data Grid', icon: LayoutGrid },
                    { id: 'feature-matrix', label: 'Feature Matrix', icon: Columns },
                    { id: 'pricing-tiers', label: 'Pricing', icon: Hash },
                ];
            case 'cover':
                return [
                    { id: 'centered-minimal', label: 'Centered', icon: Maximize },
                    { id: 'full-split', label: 'Split', icon: Columns },
                    { id: 'diagonal-hero', label: 'Diagonal', icon: LayoutGrid },
                    { id: 'typographic-giant', label: 'Typographic', icon: Hash },
                    { id: 'gradient-mesh', label: 'Gradient', icon: LayoutGrid },
                    { id: 'boxed-modern', label: 'Boxed', icon: Maximize },
                    { id: 'cinematic', label: 'Cinematic', icon: Maximize },
                ];
            case 'timeline':
                return [
                    { id: 'horizontal-line', label: 'Horizontal', icon: List },
                    { id: 'vertical-alternating', label: 'Vertical', icon: Columns },
                    { id: 'connected-cards', label: 'Cards', icon: LayoutGrid },
                    { id: 'stepped-process', label: 'Steps', icon: List },
                ];
            case 'comparison':
                return [
                    { id: 'balanced-split', label: 'Split', icon: Columns },
                    { id: 'versus-cards', label: 'VS Cards', icon: LayoutGrid },
                    { id: 'feature-grid', label: 'Grid', icon: Table },
                    { id: 'before-after', label: 'Before/After', icon: Columns },
                    { id: 'pros-cons', label: 'Pros/Cons', icon: List },
                ];
            case 'infographic':
                return [
                    { id: 'funnel', label: 'Funnel', icon: List },
                    { id: 'process', label: 'Process', icon: Columns },
                    { id: 'pyramid', label: 'Pyramid', icon: Maximize },
                    { id: 'cycle-flow', label: 'Cycle', icon: LayoutGrid },
                    { id: 'hub-spoke', label: 'Hub & Spoke', icon: Hash },
                ];
            case 'image':
                return [
                    { id: 'default', label: 'Standard', icon: Maximize },
                    { id: 'text-mask', label: 'Text Mask', icon: Hash },
                    { id: 'split-curtain', label: 'Curtain', icon: Columns },
                    { id: 'polaroid-pile', label: 'Polaroids', icon: LayoutGrid },
                ];

            case 'showcase':
                return [
                    { id: 'default', label: 'Standard', icon: Maximize },
                    { id: 'split', label: 'Split', icon: Columns },
                    { id: 'floating', label: 'Floating', icon: LayoutGrid },
                    { id: 'minimal', label: 'Minimal', icon: List },
                ];
            default:
                // Fallback for generic content -> Offer Adapter conversions if native variations unsupported
                return [
                    { id: 'bullets', label: 'Bullets', icon: List, isAdapter: true },
                    { id: 'columns', label: 'Columns', icon: Columns, isAdapter: true },
                    { id: 'bento', label: 'Bento', icon: LayoutGrid, isAdapter: true }
                ];
        }
    };

    const variations = getNativeVariations(context);

    // Handler
    const handleSelectVariation = (v: any) => {
        if (v.isAdapter) {
            // Full Adapter conversion (Type change)
            const adapted = adaptToLayout(currentSlide, v.id as SlideLayoutType);
            onUpdateSlide(adapted);
        } else {
            // Native Variation change (Prop change only)
            onUpdateSlide({
                ...currentSlide,
                variation: v.id
            });
        }

    };

    const handleRevert = () => {
        if (originalSlide) {
            onUpdateSlide(originalSlide);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-background/50 backdrop-blur-sm border-l">
            <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wider opacity-70">{t('editor.design')}</h3>
                {originalSlide && (
                    <Button variant="ghost" size="sm" onClick={handleRevert} className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground">
                        {t('editor.reset')}
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {variations.map((v) => {
                        // Check active state
                        let isActive = false;
                        if (v.isAdapter) {
                            // Check type
                            isActive = (v.id === 'bullets' && (currentSlide.type === 'content')) ||
                                (v.id === 'bento' && currentSlide.type === 'bento') ||
                                (v.id === 'columns' && currentSlide.type === 'text-column' && !['classic', 'modern-cards'].includes(currentSlide.variation || ''));
                        } else {
                            // Check variation prop
                            isActive = currentSlide.variation === v.id;
                        }

                        // Preview Data
                        // We must fake the variation prop on the current slide data for preview
                        const previewSlide = v.isAdapter
                            ? adaptToLayout(currentSlide, v.id as SlideLayoutType)
                            : { ...currentSlide, variation: v.id };

                        return (
                            <div key={v.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium opacity-80 flex items-center gap-2">
                                        <v.icon className="h-3 w-3" />
                                        {v.label}
                                    </span>
                                </div>

                                <div
                                    role="button"
                                    onClick={() => handleSelectVariation(v)}
                                    className={`w-full aspect-video rounded-lg overflow-hidden border-2 transition-all relative group text-left
                                        ${isActive ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/50'}
                                    `}
                                >
                                    {/* Preview container - scaled down */}
                                    <div className="w-full h-full bg-surface relative pointer-events-none">
                                        <div className="absolute top-0 left-0 w-[1280px] h-[720px] origin-top-left transform scale-[0.2]">
                                            {/* Note: Scale 0.2 means 1280*0.2 = 256px width approx, which fits in sidebar */}
                                            <ModernSlideRenderer
                                                slide={previewSlide}
                                                theme={theme}
                                                colorPalette={colors}
                                                className="w-full h-full"
                                            />
                                        </div>
                                    </div>

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
