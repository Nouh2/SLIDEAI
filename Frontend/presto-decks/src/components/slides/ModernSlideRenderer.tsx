// src/components/slides/ModernSlideRenderer.tsx
// Enhanced slide renderer with support for charts, tables, timelines, infographics
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { getTemplateById } from "@/data/slideTemplates";

interface SlideRendererProps {
    slide: any;
    theme: string;
    className?: string;
    colorPalette?: {
        primary: string;
        secondary: string;
        accent: string;
        bg: string;
        text: string;
    };
    fontConfig?: {
        heading: string;
        body: string;
    };
    onElementSelect?: (element: { id: string; type: 'text' | 'image' | 'list' | 'chart'; path: string; value: any; label: string }) => void;
    selectedElementId?: string | null;
    showWatermark?: boolean;
    templateOverlay?: any; // Add templateOverlay prop
}

// Helper wrapper for editable elements
const EditableElement = ({
    element,
    children,
    onSelect,
    isSelected,
    className,
    style
}: {
    element: any;
    children?: React.ReactNode;
    onSelect?: (element: any) => void;
    isSelected?: boolean;
    className?: string;
    style?: React.CSSProperties;
}) => {
    if (!onSelect) return <div className={className} style={style}>{children || element?.value}</div>;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onSelect(element);
            }}
            className={cn("relative transition-all duration-200 rounded-sm cursor-text", className, isSelected ? "ring-2 ring-primary ring-offset-2 z-50" : "hover:ring-1 hover:ring-primary/50")}
            style={style}
        >
            {children || element.value}
        </div>
    );
};

// ============================================
// HELPER COMPONENTS
// ============================================

// FloatingElement component for draggable/resizable elements
const FloatingElement = ({ element, colors, onSelect, isSelected }: { element: any; colors: any; onSelect?: any; isSelected?: boolean }) => {
    const { t } = useTranslation();
    const { id, type, x, y, width, height, rotation, opacity, path, value, label } = element;

    const elementStyle: React.CSSProperties = {
        position: 'absolute',
        left: `${x || 0}%`,
        top: `${y || 0}%`,
        width: width ? `${width}%` : 'auto',
        maxWidth: '80%',
        height: height ? `${height}%` : 'auto',
        transform: `rotate(${rotation || 0}deg)`,
        opacity: opacity || 1,
        zIndex: isSelected ? 50 : 10,
        cursor: onSelect ? 'grab' : 'default',
        color: element.style?.color || colors.text,
        fontSize: element.style?.fontSize,
        fontWeight: element.style?.fontWeight,
        textAlign: element.style?.textAlign as any,
    };

    return (
        <EditableElement
            element={element}
            onSelect={onSelect}
            isSelected={isSelected}
            className="p-2" // Add some padding for easier selection
            style={elementStyle}
        >
            {type === 'image' ? (
                <img src={value || element.content} alt="custom" className="w-full h-full object-cover rounded-lg shadow-lg pointer-events-none" />
            ) : (
                <div
                    dangerouslySetInnerHTML={{ __html: value || element.content || t('common.doubleClickToEdit') }}
                    className="min-w-[100px] min-h-[1em] outline-none"
                    style={{ fontSize: 'inherit' }}
                />
            )}
        </EditableElement>
    );
};


const getContrastColor = (hexcolor: string) => {
    if (!hexcolor || hexcolor.startsWith('rgba') || hexcolor.startsWith('transparent')) return '#ffffff';
    let hex = hexcolor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(s => s + s).join('');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
};

const getReadableColor = (preferredColor: string, backgroundColor: string) => {
    const contrastToBg = getContrastColor(backgroundColor);
    const contrastToPreferred = getContrastColor(preferredColor);
    // If they share the same contrast (e.g. both want white text on black), then preferred is fine.
    // If they differ (e.g. preferred wants white but bg is white), then fallback to contrastToBg.
    return contrastToBg !== contrastToPreferred ? preferredColor : contrastToBg;
};

// Font mapping for custom fonts
const FONT_MAP: Record<string, string> = {
    'inter': "'Inter', sans-serif",
    'roboto': "'Roboto', sans-serif",
    'open-sans': "'Open Sans', sans-serif",
    'montserrat': "'Montserrat', sans-serif",
    'poppins': "'Poppins', sans-serif",
    'lato': "'Lato', sans-serif",
    'playfair': "'Playfair Display', serif",
    'merriweather': "'Merriweather', serif",
    'arial': "Arial, sans-serif",
    'georgia': "Georgia, serif",
};

const getFontFamily = (fontId: string): string => {
    return FONT_MAP[fontId] || 'inherit';
};

// Enhanced abstract background shapes - premium artistic look
const AbstractShapes = ({ colors, variant = 'default' }: { colors: any; variant?: string }) => {
    const primary = colors.primary || '#2563EB';
    const secondary = colors.secondary || colors.accent || '#7C3AED';

    return (
        <>
            {/* Main gradient blob - top left */}
            <div
                className="absolute -top-32 -left-32 w-[700px] h-[700px] rounded-full blur-3xl"
                style={{
                    background: `radial-gradient(circle at center, ${primary}25, ${primary}15 40%, transparent 70%)`,
                }}
            />

            {/* Secondary gradient blob - bottom right */}
            <div
                className="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full blur-3xl"
                style={{
                    background: `radial-gradient(circle at center, ${secondary}30, ${secondary}10 50%, transparent 70%)`,
                }}
            />

            {/* Accent blob - center right */}
            <div
                className="absolute top-1/3 -right-24 w-[400px] h-[500px] rounded-full blur-2xl"
                style={{
                    background: `radial-gradient(ellipse at center, ${primary}20, transparent 60%)`,
                }}
            />

            {/* Small decorative circle - top right */}
            <div
                className="absolute top-20 right-32 w-24 h-24 rounded-full opacity-20"
                style={{ backgroundColor: secondary }}
            />

            {/* Small decorative circle - bottom left */}
            <div
                className="absolute bottom-32 left-20 w-16 h-16 rounded-full opacity-15"
                style={{ backgroundColor: primary }}
            />

            {/* Gradient line accent - top */}
            <div
                className="absolute top-0 left-0 right-0 h-1 opacity-40"
                style={{
                    background: `linear-gradient(90deg, transparent 0%, ${primary} 30%, ${secondary} 70%, transparent 100%)`
                }}
            />

            {/* Subtle mesh gradient overlay */}
            <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 80%, ${secondary}40 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, ${primary}40 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, ${primary}20 0%, transparent 70%)
                    `
                }}
            />

            {/* Geometric accent - diagonal line */}
            <svg className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={primary} stopOpacity="0" />
                        <stop offset="50%" stopColor={primary} stopOpacity="0.5" />
                        <stop offset="100%" stopColor={secondary} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <line x1="100%" y1="0" x2="0" y2="100%" stroke="url(#lineGrad)" strokeWidth="2" />
            </svg>
        </>
    );
};

// Slide footer with number - styled to match theme
const SlideFooter = ({ slideNumber, title, colors, unsplashPhotographer, showPageNumber = true }: {
    slideNumber?: number;
    title: string;
    colors?: any;
    unsplashPhotographer?: { name: string; username: string; link: string };
    showPageNumber?: boolean;
}) => (
    <div
        className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-between px-12"
        style={{
            borderTop: `1px solid ${colors?.primary || '#e5e5e5'}20`,
        }}
    >
        {showPageNumber && (
            <span
                className="text-lg font-semibold"
                style={{ color: colors?.primary || '#666' }}
            >
                {slideNumber || 1}
            </span>
        )}

        {/* Unsplash Attribution - discrete style */}
        {unsplashPhotographer && (
            <span className="text-[10px] opacity-40" style={{ color: colors?.text || '#666' }}>
                Photo by{' '}
                <a
                    href={unsplashPhotographer.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 underline"
                >
                    {unsplashPhotographer.name}
                </a>
                {' '}on{' '}
                <a
                    href={`https://unsplash.com?utm_source=slideai&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-70 underline"
                >
                    Unsplash
                </a>
            </span>
        )}

        <span
            className="text-base font-medium opacity-60"
            style={{ color: colors?.text || '#333' }}
        >
            {title}
        </span>
        <span
            className="text-lg font-medium opacity-40"
            style={{ color: colors?.text || '#666' }}
        >
            2025
        </span>
    </div>
);

// ============================================
// LAYOUT COMPONENTS
// ============================================


// Cover/Hero slide - Opening slide
// Cover/Hero slide - Opening slide
const CoverHeroLayout = ({ slide, colors, onSelect, selectedId, showPageNumber }: { slide: any; colors: any; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    const { t } = useTranslation();
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background image with overlay */}
            {(slide.backgroundImage || slide.imageSearchQuery) && !slide.backgroundImage?.includes('placehold') && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})` }}
                    />
                    <div className="absolute inset-0" style={{ backgroundColor: `${colors.bg}CC` }} />
                </>
            )}

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-20 pb-32 text-center">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                >
                    <h1 className="text-8xl md:text-9xl font-bold mb-10 leading-tight">
                        {(slide.title || t('common.untitled')).split(' ').map((word: string, i: number) => {
                            const isKeyword = ['vision', 'pitch', 'strategy', 'innovation', 'future', 'ai', 'tech'].some(kw =>
                                word.toLowerCase().includes(kw)
                            );
                            return isKeyword ?
                                <span key={i} style={{ color: colors.primary }}>{word} </span> :
                                <span key={i} style={{ color: colors.text }}>{word} </span>;
                        })}
                    </h1>
                </EditableElement>

                {(slide.subtitle || slide.content?.subtitle) && (
                    <div className="inline-block px-12 py-6 rounded-full bg-surface border border-border shadow-md">
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: slide.subtitle || slide.content?.subtitle, path: slide.subtitle ? 'subtitle' : 'content.subtitle', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                        >
                            <p className="text-3xl opacity-80" style={{ color: colors.text }}>{slide.subtitle || slide.content?.subtitle}</p>
                        </EditableElement>
                    </div>
                )}

                {/* Key bullets if present */}
                {(slide.bullets?.length > 0 || slide.content?.bullets?.length > 0) && (
                    <ul className="mt-10 space-y-3 text-left">
                        {(slide.bullets || slide.content?.bullets || []).slice(0, 4).map((bullet: string, i: number) => (
                            <EditableElement
                                key={i}
                                element={{ id: `bullets-${i}`, type: 'list', value: bullet, path: slide.bullets ? `bullets[${i}]` : `content.bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `bullets-${i}`}
                            >
                                <li className="flex items-center gap-4">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                                    <span className="text-2xl opacity-80" style={{ color: colors.text }}>{bullet}</span>
                                </li>
                            </EditableElement>
                        ))}
                    </ul>
                )}
            </div>

            <SlideFooter title={slide.title} slideNumber={1} colors={colors} showPageNumber={showPageNumber} />
        </div>
    );
};

// Section divider - Bold title slide


// Content with bullets layout


// Stats/Metrics layout - Big numbers
// Stats/Metrics layout - Big numbers with Visual Variants
type StatsVariation = 'classic-grid' | 'metric-cards' | 'big-hero-stat' | 'data-progress' | 'trend-focus';

const StatsLayout = ({ slide, colors, variation = 'classic-grid', onSelect, selectedId, showPageNumber }: { slide: any; colors: any; variation?: StatsVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    // Support multiple AI formats: stats, statistics, metrics
    let stats = slide.stats || slide.content?.stats || slide.content?.statistics || slide.metrics || slide.content?.metrics || [];

    // Determine path prefix for editing
    let statsPath = 'content.stats';
    if (slide.stats) statsPath = 'stats';
    else if (slide.metrics) statsPath = 'metrics';
    else if (slide.content?.metrics) statsPath = 'content.metrics';
    else if (slide.content?.statistics) statsPath = 'content.statistics';

    // --- VARIATION 1: METRIC CARDS (Clean card based) ---
    if (variation === 'metric-cards') {
        return (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} />

                <div className="relative z-10 flex flex-col px-16 py-12 h-full">
                    <div className="text-center mb-16">
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                        >
                            <h2 className="text-5xl font-bold mb-4" style={{ color: colors.text }}>{slide.title}</h2>
                        </EditableElement>
                        <p className="text-xl opacity-60" style={{ color: colors.text }}>Key Performance Indicators</p>
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                        {stats.slice(0, 4).map((stat: any, i: number) => (
                            <div key={i} className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center justify-center text-center border relative overflow-hidden group hover:bg-white/10 transition-colors"
                                style={{ borderColor: `${colors.text}15`, boxShadow: `0 10px 40px -10px ${colors.primary}20` }}>

                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ backgroundImage: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)` }} />

                                {/* Icon placeholder circle */}
                                <div className="w-16 h-16 rounded-full mb-6 flex items-center justify-center mb-6"
                                    style={{ backgroundColor: `${colors.primary}10`, color: colors.primary }}>
                                    <span className="text-2xl font-bold">{i + 1}</span>
                                </div>

                                <EditableElement
                                    element={{ id: `stat-${i}-value`, type: 'text', value: stat.value, path: `${statsPath}[${i}].value`, label: `Stat ${i + 1} Value` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `stat-${i}-value`}
                                >
                                    <p className="text-4xl md:text-5xl font-bold mb-4 tracking-tight" style={{ color: colors.primary }}>
                                        {stat.value}
                                    </p>
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `stat-${i}-label`, type: 'text', value: stat.label, path: `${statsPath}[${i}].label`, label: `Stat ${i + 1} Label` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `stat-${i}-label`}
                                >
                                    <p className="text-sm font-bold uppercase tracking-widest opacity-70" style={{ color: colors.text }}>
                                        {stat.label}
                                    </p>
                                </EditableElement>
                            </div>
                        ))}
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 2: BIG HERO STAT (Focus on one major number) ---
    if (variation === 'big-hero-stat') {
        const heroStat = stats[0];
        const secondaryStats = stats.slice(1, 4);

        return (
            <div className="relative w-full h-full overflow-hidden flex" style={{ backgroundColor: colors.bg }}>
                {/* Visual side - Hero Stat */}
                <div className="w-7/12 h-full relative flex items-center justify-center p-20" style={{ backgroundColor: colors.primary }}>
                    <div className="absolute inset-0 opacity-20 invert mix-blend-overlay"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 30L60 30L60 60L30 60' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E")` }} />

                    <div className="relative z-10 text-center text-white">
                        <span className="inline-block px-4 py-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-sm font-bold uppercase tracking-widest mb-12">
                            Primary Metric
                        </span>
                        {heroStat && (
                            <>
                                <EditableElement
                                    element={{ id: `hero-stat-value`, type: 'text', value: heroStat.value, path: `${statsPath}[0].value`, label: `Hero Stat Value` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `hero-stat-value`}
                                >
                                    <h1 className="text-[180px] font-black leading-none mb-4 drop-shadow-2xl">
                                        {heroStat.value}
                                    </h1>
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `hero-stat-label`, type: 'text', value: heroStat.label, path: `${statsPath}[0].label`, label: `Hero Stat Label` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `hero-stat-label`}
                                >
                                    <p className="text-4xl font-light opacity-90">{heroStat.label}</p>
                                </EditableElement>
                            </>
                        )}
                    </div>
                </div>

                {/* Content side - Secondary Stats */}
                <div className="w-5/12 h-full bg-surface p-12 flex flex-col justify-center">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h2 className="text-4xl font-bold mb-16" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>

                    <div className="flex flex-col gap-8">
                        {secondaryStats.map((stat: any, i: number) => (
                            <div key={i} className="flex items-center gap-6 border-b pb-6" style={{ borderColor: `${colors.text}10` }}>
                                <EditableElement
                                    element={{ id: `sec-stat-${i}-value`, type: 'text', value: stat.value, path: `${statsPath}[${i + 1}].value`, label: `Stat ${i + 2} Value` }} // i+1 because 0 is hero
                                    onSelect={onSelect}
                                    isSelected={selectedId === `sec-stat-${i}-value`}
                                >
                                    <div className="text-3xl font-bold" style={{ color: colors.secondary }}>{stat.value}</div>
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `sec-stat-${i}-label`, type: 'text', value: stat.label, path: `${statsPath}[${i + 1}].label`, label: `Stat ${i + 2} Label` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `sec-stat-${i}-label`}
                                >
                                    <div className="text-lg opacity-70" style={{ color: colors.text }}>{stat.label}</div>
                                </EditableElement>
                            </div>
                        ))}
                        {secondaryStats.length === 0 && <p className="opacity-50 italic">Add more stats...</p>}
                    </div>
                </div>
            </div>
        );
    }

    // --- VARIATION 3: DATA PROGRESS (Visual bars/circles) ---
    if (variation === 'data-progress') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col px-20 pt-16 pb-24" style={{ backgroundColor: colors.bg }}>
                <div className="mb-16">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h2 className="text-6xl font-bold mb-4" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                    <div className="w-20 h-2 bg-primary rounded-full" style={{ backgroundColor: colors.accent }} />
                </div>

                <div className="flex-1 grid grid-cols-2 gap-x-20 gap-y-12">
                    {stats.slice(0, 4).map((stat: any, i: number) => {
                        // Parse potential percentage for visual width
                        const valStr = String(stat.value);
                        const isPercent = valStr.includes('%');
                        const numVal = parseFloat(valStr.replace(/[^0-9.]/g, ''));
                        const percentage = (isPercent && numVal <= 100) ? numVal :
                            (numVal < 100 ? numVal : 75); // Guess 75% if unknown context

                        return (
                            <div key={i} className="flex flex-col justify-center">
                                <div className="flex justify-between items-end mb-4">
                                    <EditableElement
                                        element={{ id: `stat-${i}-label`, type: 'text', value: stat.label, path: `${statsPath}[${i}].label`, label: `Stat ${i + 1} Label` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `stat-${i}-label`}
                                    >
                                        <span className="text-xl font-medium opacity-80 uppercase tracking-wider" style={{ color: colors.text }}>{stat.label}</span>
                                    </EditableElement>
                                    <EditableElement
                                        element={{ id: `stat-${i}-value`, type: 'text', value: stat.value, path: `${statsPath}[${i}].value`, label: `Stat ${i + 1} Value` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `stat-${i}-value`}
                                    >
                                        <span className="text-4xl font-bold" style={{ color: colors.primary }}>{stat.value}</span>
                                    </EditableElement>
                                </div>
                                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.text}10` }}>
                                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: i % 2 === 0 ? colors.primary : colors.secondary
                                        }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 4: TREND FOCUS (Arrows & diffs) ---
    if (variation === 'trend-focus') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-12" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} />

                <div className="text-center mb-16 relative z-10 w-full max-w-4xl">
                    <span className="text-sm font-bold tracking-[0.3em] uppercase opacity-60 mb-4 block" style={{ color: colors.text }}>Performance</span>
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h2 className="text-6xl font-black mb-8" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-20" style={{ color: colors.text }} />
                </div>

                <div className="grid grid-cols-3 gap-0 relative z-10 bg-white/5 backdrop-blur-xl rounded-[3rem] border shadow-2xl overflow-hidden divide-x"
                    style={{ borderColor: `${colors.text}10` }}>
                    {stats.slice(0, 3).map((stat: any, i: number) => (
                        <div key={i} className="p-12 flex flex-col items-center text-center group hover:bg-white/5 transition-colors">
                            <div className="mb-4 p-3 rounded-full bg-surface" style={{ backgroundColor: i === 1 ? `${colors.primary}10` : `${colors.text}05` }}>
                                {/* Fake Trend Arrow - alternating up/down for visual variety if not real */}
                                <span className="text-2xl font-bold" style={{ color: i === 1 ? colors.primary : colors.secondary }}>
                                    {i % 2 === 0 ? '↗' : '↑'}
                                </span>
                            </div>
                            <EditableElement
                                element={{ id: `stat-${i}-value`, type: 'text', value: stat.value, path: `${statsPath}[${i}].value`, label: `Stat ${i + 1} Value` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `stat-${i}-value`}
                            >
                                <h3 className="text-5xl font-bold mb-3 tracking-tight" style={{ color: colors.text }}>{stat.value}</h3>
                            </EditableElement>
                            <EditableElement
                                element={{ id: `stat-${i}-label`, type: 'text', value: stat.label, path: `${statsPath}[${i}].label`, label: `Stat ${i + 1} Label` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `stat-${i}-label`}
                            >
                                <p className="text-sm font-bold uppercase tracking-widest opacity-50" style={{ color: colors.text }}>{stat.label}</p>
                            </EditableElement>
                        </div>
                    ))}
                </div>
                <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- DEFAULT: CLASSIC GRID ---
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'overlay'
                        }}
                    />
                    <div className="absolute inset-0 backdrop-blur-[2px]" />
                </>
            )}

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-16 text-center"
                >
                    <h2 className="text-6xl md:text-7xl font-bold text-center" style={{ color: colors.text }}>
                        {slide.title}
                    </h2>
                </EditableElement>

                <div className="flex-1 flex flex-wrap items-stretch justify-center gap-8 content-center">
                    {stats.slice(0, 4).map((stat: any, i: number) => (
                        <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-center p-12 bg-surface/40 backdrop-blur-md rounded-[40px] border transition-all hover:scale-105"
                            style={{
                                borderColor: `${colors.text}20`,
                                boxShadow: `0 8px 32px 0 ${colors.primary}10`
                            }}
                        >
                            <EditableElement
                                element={{ id: `stat-${i}-value`, type: 'text', value: stat.value, path: `${statsPath}[${i}].value`, label: `Stat ${i + 1} Value` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `stat-${i}-value`}
                            >
                                <p className="text-5xl md:text-6xl font-bold mb-4" style={{ color: getReadableColor(colors.primary, colors.bg) }}>{stat.value}</p>
                            </EditableElement>
                            <EditableElement
                                element={{ id: `stat-${i}-label`, type: 'text', value: stat.label, path: `${statsPath}[${i}].label`, label: `Stat ${i + 1} Label` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `stat-${i}-label`}
                            >
                                <p className="text-xl opacity-80" style={{ color: colors.text }}>{stat.label}</p>
                            </EditableElement>
                        </div>
                    ))}
                </div>
            </div>

            <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
        </div>
    );
};

// Chart layout - Data visualization
// Reusable Chart Visuals Component to be used across variants
const ChartVisuals = ({ chart, colors, height = 400 }: { chart: any, colors: any, height?: number }) => {
    const chartColors = [colors.primary, colors.secondary, colors.accent, '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    // Helper for pie gradient
    const getPieGradient = () => {
        let gradient = 'conic-gradient(';
        let start = 0;

        // Handle direct data array for pie if series structure is flat
        const dataArray = chart.series?.[0]?.data || chart.data || [];
        const totalVal = dataArray.reduce((a: number, b: number) => a + b, 0) || 1;

        dataArray.forEach((val: number, i: number) => {
            const pct = (val / totalVal) * 100;
            const color = chartColors[i % chartColors.length];
            gradient += `${color} ${start}% ${start + pct}%, `;
            start += pct;
        });

        return gradient.slice(0, -2) + ')';
    };

    const dataArray = chart.series?.[0]?.data || chart.data || [];
    const categories = chart.categories || [];

    // Normalize Series Data for Multi-Series Charts
    const series = chart.series || [{ name: 'Data', data: dataArray }];
    const maxVal = Math.max(...series.flatMap((s: any) => s.data || [100]));

    // --- RENDERERS ---

    // 1. BAR / COLUMN (Standard)
    if (chart.type === 'bar' || chart.type === 'column' || !chart.type) {
        return (
            <div className="w-full flex flex-col justify-end" style={{ height: `${height}px` }}>
                <div className="flex items-end justify-center gap-4 sm:gap-8 h-full pb-8 border-b" style={{ borderColor: `${colors.text}20` }}>
                    {categories.map((cat: string, i: number) => {
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group relative">
                                {/* Grouped Bars if multiple series */}
                                <div className="flex gap-1 items-end justify-center w-full h-full">
                                    {series.map((s: any, sIdx: number) => {
                                        const val = s.data[i] || 0;
                                        const barHeight = (val / maxVal) * 100;
                                        const color = chartColors[sIdx % chartColors.length];

                                        return (
                                            <div key={sIdx} className="relative flex flex-col items-center justify-end h-full flex-1 max-w-[40px]">
                                                <span className="mb-2 text-xs font-bold absolute bottom-full whitespace-nowrap"
                                                    style={{ color: colors.text }}>
                                                    {val}
                                                </span>
                                                <div
                                                    className="w-full rounded-t-sm transition-all duration-500 shadow-sm hover:opacity-80"
                                                    style={{
                                                        height: `${barHeight}%`,
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <span className="absolute top-full mt-4 text-xs sm:text-sm font-medium text-center leading-tight w-full truncate"
                                    style={{ color: colors.text, opacity: 0.8 }}>
                                    {cat}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {/* Legend */}
                {series.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-6 mt-8">
                        {series.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                                <span className="text-sm font-medium" style={{ color: colors.text }}>{s.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // 2. STACKED BAR / COLUMN
    if (chart.type === 'stacked-bar' || chart.type === 'stacked-column') {
        // Calculate max stack height
        const stackedTotals = categories.map((_, i) =>
            series.reduce((acc: number, s: any) => acc + (s.data[i] || 0), 0)
        );
        const maxStack = Math.max(...stackedTotals, 1);

        return (
            <div className="w-full flex flex-col justify-end" style={{ height: `${height}px` }}>
                <div className="flex items-end justify-center gap-8 h-full pb-8 border-b" style={{ borderColor: `${colors.text}20` }}>
                    {categories.map((cat: string, i: number) => {
                        const total = stackedTotals[i];
                        const totalHeightPct = (total / maxStack) * 100;

                        return (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group relative">
                                <span className="mb-2 text-sm font-bold absolute bottom-[calc(100%+8px)]"
                                    style={{ bottom: `${totalHeightPct}%`, color: colors.text }}>
                                    {total}
                                </span>

                                <div className="w-full max-w-[60px] flex flex-col-reverse justify-start rounded-t-md overflow-hidden shadow-sm"
                                    style={{ height: `${totalHeightPct}%` }}>
                                    {series.map((s: any, sIdx: number) => {
                                        const val = s.data[i] || 0;
                                        const segmentHeight = (val / total) * 100;
                                        const color = chartColors[sIdx % chartColors.length];

                                        return (
                                            <div key={sIdx}
                                                className="w-full relative group/segment hover:opacity-90 transition-opacity border-t border-white/20 first:border-t-0"
                                                style={{ height: `${segmentHeight}%`, backgroundColor: color }}
                                                title={`${s.name}: ${val}`}
                                            >
                                            </div>
                                        );
                                    })}
                                </div>

                                <span className="absolute top-full mt-4 text-xs sm:text-sm font-medium text-center leading-tight w-full truncate"
                                    style={{ color: colors.text, opacity: 0.8 }}>
                                    {cat}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-6 mt-8">
                    {series.map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                            <span className="text-sm font-medium" style={{ color: colors.text }}>{s.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 3. HORIZONTAL BAR
    if (chart.type === 'horizontal-bar' || chart.type === 'bar-h') {
        const maxVal = Math.max(...series.flatMap((s: any) => s.data));

        return (
            <div className="w-full h-full flex flex-col justify-center gap-3 overflow-y-auto py-2 pr-2">
                {categories.map((cat: string, i: number) => (
                    <div key={i} className="w-full shrink-0">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs sm:text-sm font-medium truncate max-w-[200px]" style={{ color: colors.text }}>{cat}</span>
                        </div>
                        <div className="w-full bg-gray-100/50 rounded-full h-6 sm:h-8 flex items-center relative overflow-hidden">
                            {/* Support stacked horiz, or just grouped. Assuming grouped for now or single series mostly */}
                            {series.map((s: any, sIdx: number) => {
                                const val = s.data[i] || 0;
                                const widthPct = (val / maxVal) * 100;
                                const color = chartColors[sIdx % chartColors.length];

                                // Only render primary series for simple horiz bar visual, or stack if needed. 
                                // Let's do simple Overlay for now (first series)
                                if (sIdx > 0) return null;

                                return (
                                    <div key={sIdx}
                                        className="h-full rounded-r-full flex items-center px-3 transition-all duration-1000 relative"
                                        style={{ width: `${widthPct}%`, backgroundColor: color }}>
                                        <span className="text-xs font-bold text-white drop-shadow-md sticky left-2">{val}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // 4. WATERFALL CHART (McKinsey Style)
    if (chart.type === 'waterfall') {
        let currentTotal = 0;
        const waterfallData = (series[0]?.data || []).map((val: number, i: number) => {
            const isTotal = categories[i]?.toLowerCase().includes('total') || i === 0 || i === series[0]?.data.length - 1;
            // Better logic: usually start and end are totals. 
            // Or assume inputs are deltas directly. 
            const start = currentTotal;
            currentTotal += val;
            const end = currentTotal;

            // Logic for "Total" bars (grounded) vs "Delta" bars (floating)
            // Specialized input needed for true totals, but let's approximate:
            // If it's a "total" bar, it starts at 0.

            return {
                val,
                start: isTotal ? 0 : (val >= 0 ? start : end),
                height: Math.abs(val),
                isPositive: val >= 0,
                isTotal: categories[i]?.toLowerCase().includes('total') || categories[i]?.toLowerCase() === 'start' || categories[i]?.toLowerCase() === 'end',
                endValue: currentTotal
            };
        });

        // Correction for "Total" bars to show absolute height
        waterfallData.forEach((d: any, i: number) => {
            if (d.isTotal) {
                d.start = 0;
                d.height = d.endValue; // Absolute value typical for tot
            }
        });

        const maxWaterfall = Math.max(...waterfallData.map((d: any) => d.start + d.height));

        return (
            <div className="w-full flex flex-col justify-end" style={{ height: `${height}px` }}>
                <div className="flex items-end justify-center gap-2 h-full pb-8 border-b" style={{ borderColor: `${colors.text}20` }}>
                    {categories.map((cat: string, i: number) => {
                        const d = waterfallData[i];
                        const bottomPct = (d.start / maxWaterfall) * 100;
                        const heightPct = (d.height / maxWaterfall) * 100;

                        // Colors: Total=Blue, Pos=Green, Neg=Red
                        let bgColor = colors.primary;
                        if (!d.isTotal) {
                            bgColor = d.isPositive ? '#10B981' : '#EF4444';
                        }

                        return (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full relative group">
                                <div className="w-full max-w-[60px] absolute transition-all duration-500 rounded-sm shadow-sm"
                                    style={{
                                        bottom: `${bottomPct}%`,
                                        height: `${heightPct}%`,
                                        backgroundColor: bgColor
                                    }}>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold" style={{ color: colors.text }}>
                                        {d.val > 0 && !d.isTotal ? '+' : ''}{d.val}
                                    </span>
                                </div>
                                {/* Connector Lines */}
                                {i < categories.length - 1 && (
                                    <div className="absolute right-0 w-full border-t border-dashed opacity-30"
                                        style={{
                                            bottom: `${(d.isTotal ? d.height : (d.isPositive ? d.start + d.height : d.start)) / maxWaterfall * 100}%`,
                                            borderColor: colors.text,
                                            width: '100%',
                                            transform: 'translateX(50%)'
                                        }}
                                    />
                                )}
                                <span className="absolute bottom-[-40px] text-xs font-medium text-center w-full truncate"
                                    style={{ color: colors.text, opacity: 0.8 }}>
                                    {cat}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // 5. COMBO CHART (Bar + Line)
    if (chart.type === 'combo') {
        const barSeries = series.filter((s: any) => s.type !== 'line');
        const lineSeries = series.filter((s: any) => s.type === 'line').length > 0 ? series.filter((s: any) => s.type === 'line') : [series[series.length - 1]];
        // Default last to line if not specified? Or assume explicit types in series.

        const maxVal = Math.max(...series.flatMap((s: any) => s.data));

        return (
            <div className="w-full relative" style={{ height: `${height}px` }}>
                {/* 1. Render Bars Layer */}
                <div className="absolute inset-0 flex items-end justify-center gap-4 sm:gap-8 pb-8 px-4">
                    {categories.map((cat: string, i: number) => (
                        <div key={i} className="flex-1 h-full flex items-end justify-center">
                            {barSeries.map((s: any, sIdx: number) => {
                                const val = s.data[i] || 0;
                                const h = (val / maxVal) * 100;
                                return (
                                    <div key={sIdx} className="w-full max-w-[40px] opacity-80 rounded-t-sm relative flex items-center justify-center"
                                        style={{ height: `${h}%`, backgroundColor: chartColors[sIdx] }}>
                                        <span className="absolute bottom-full mb-1 text-xs font-bold" style={{ color: colors.text }}>{val}</span>
                                    </div>
                                );
                            })}
                            <span className="absolute bottom-0 text-xs text-center truncate w-20" style={{ color: colors.text }}>{cat}</span>
                        </div>
                    ))}
                </div>

                {/* 2. Render Line Layer (SVG Overlay) */}
                <div className="absolute inset-x-4 bottom-8 top-0 pointer-events-none">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {lineSeries.map((s: any, sIdx: number) => {
                            const data = s.data || [];
                            const points = data.map((val: number, i: number) => {
                                const x = (i / (data.length - 1 || 1)) * 100;
                                // Simple centering correction:
                                // If N bars, x should align with center of columns. 
                                // This is roughly i / (N-1). Close enough for CSS.
                                const y = 100 - (val / maxVal) * 100;
                                return `${x},${y}`;
                            }).join(' ');

                            return (
                                <g key={sIdx}>
                                    <polyline
                                        points={points}
                                        fill="none"
                                        stroke={colors.accent || '#F59E0B'}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="drop-shadow-sm"
                                        vectorEffect="non-scaling-stroke"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* HTML Overlay for Markers & Labels (No Distortion) */}
                    {lineSeries.map((s: any, sIdx: number) => {
                        const data = s.data || [];
                        return (
                            <div key={sIdx} className="absolute inset-0 pointer-events-none">
                                {data.map((val: number, i: number) => {
                                    const x = (i / (data.length - 1 || 1)) * 100;
                                    const y = 100 - (val / maxVal) * 100;

                                    return (
                                        <div
                                            key={i}
                                            className="absolute flex flex-col items-center transform -translate-x-1/2 -translate-y-1/2"
                                            style={{ left: `${x}%`, top: `${y}%` }}
                                        >
                                            <div className="w-3 h-3 bg-white border-2 rounded-full shadow-sm z-10"
                                                style={{ borderColor: colors.accent }} />
                                            <span
                                                className="absolute bottom-full mb-1 text-xs font-bold whitespace-nowrap z-20"
                                                style={{ color: colors.text, textShadow: '0 1px 2px white' }}
                                            >
                                                {val}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // 6. AREA CHART
    if (chart.type === 'area') {
        // Similar to Line but with Fill
        const s = series[0];
        const data = s.data || [];
        const maxValArea = Math.max(...data);
        const points = data.map((val: number, i: number) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (val / maxValArea) * 100;
            return `${x},${y}`;
        }).join(' ');

        // Close the path for fill
        const areaPoints = `0,100 ${points} 100,100`;

        return (
            <div className="w-full h-full flex flex-col bg-white border border-gray-300 p-6 shadow-sm overflow-hidden text-black font-sans box-border" style={{ minHeight: `${height}px` }}>
                {/* 1. HEADER: Action Title & Subtitle */}
                <div className="mb-6 border-b-2 border-gray-800 pb-2">
                    <h3 className="text-xl font-serif font-bold text-gray-900 leading-tight mb-1">
                        {chart.title || "Consulting Action Title"}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {chart.subtitle || "Subtitle describing the chart analysis"}
                    </p>
                </div>

                {/* 2. BODY: Chart Area */}
                <div className="flex-1 relative border border-blue-500/0 p-4 rounded-sm flex flex-col">
                    {/* Legend / Key (Top Right) */}
                    <div className="flex justify-end gap-4 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-black"></div>
                            <span className="text-xs font-bold text-gray-700">{s?.name || "Series 1"}</span>
                        </div>
                    </div>

                    <div className="relative flex-1 w-full h-full min-h-[250px]">
                        {/* Y-Axis Labels & Grid */}
                        <div className="absolute inset-y-0 left-0 w-10 flex flex-col justify-between text-right pr-2 py-6 pointer-events-none z-10">
                            {/* Manually distribute 5 ticks matches grid */}
                            {[1, 0.75, 0.5, 0.25, 0].map((t) => (
                                <span key={t} className="text-xs font-medium text-gray-500 h-4 -mt-2">
                                    {Math.round(t * maxValArea)}
                                </span>
                            ))}
                        </div>

                        {/* Chart Drawing Area */}
                        <div className="absolute inset-0 left-10 bottom-8 right-4 top-4">
                            {/* Gridlines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                {[1, 0.75, 0.5, 0.25, 0].map((t) => (
                                    <div key={t} className="w-full border-t border-gray-200 border-dashed h-0" />
                                ))}
                            </div>

                            {/* SVG Graph */}
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="consultingGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#000000" stopOpacity="0.05" />
                                        <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                <polygon points={areaPoints} fill="url(#consultingGradient)" />
                                {/* Main Line */}
                                <polyline points={points} fill="none" stroke="#000000" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />

                                {/* End Point Dot */}
                                <circle
                                    cx={100}
                                    cy={100 - (data[data.length - 1] / maxValArea * 100)}
                                    r="4"
                                    fill="#000000"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* End Point Label */}
                                <text
                                    x={100}
                                    y={100 - (data[data.length - 1] / maxValArea * 100) - 5}
                                    textAnchor="end"
                                    fontSize="4"
                                    fontWeight="bold"
                                    fill="black"
                                >
                                    {data[data.length - 1]}
                                </text>

                                {/* Axes Lines */}
                                <line x1="0" y1="0" x2="0" y2="100" stroke="#000000" strokeWidth="1" vectorEffect="non-scaling-stroke" /> {/* Y Axis */}
                                <line x1="0" y1="100" x2="100" y2="100" stroke="#000000" strokeWidth="1" vectorEffect="non-scaling-stroke" /> {/* X Axis */}
                            </svg>
                        </div>

                        {/* X-Axis Labels */}
                        <div className="absolute bottom-0 left-10 right-4 flex justify-between pt-2">
                            {categories.map((cat: string, i: number) => (
                                <span key={i} className="text-xs font-bold text-gray-800 text-center w-full truncate">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. FOOTER: Source */}
                <div className="mt-4 pt-2 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-500">
                    <span>Source: SLIDEAI Internal Analytics, 2024</span>
                    <span>Confidential - For Internal Use Only</span>
                </div>
            </div>
        );
    }

    // PIE / DONUT
    if (chart.type === 'pie' || chart.type === 'donut') {
        return (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-12 h-full">
                <div
                    className="w-64 h-64 sm:w-80 sm:h-80 rounded-full relative flex items-center justify-center shadow-2xl shrink-0"
                    style={{ background: getPieGradient() }}
                >
                    {chart.type === 'donut' && (
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-inner" style={{ backgroundColor: colors.bg }} />
                    )}
                </div>
                <div className="space-y-4">
                    {categories.map((cat: string, i: number) => {
                        // Handle flat data
                        const dataVal = chart.series?.[0]?.data || chart.data;
                        const value = dataVal?.[i] || 0;
                        const total = dataVal?.reduce((a: number, b: number) => a + b, 0) || 1;
                        const percentage = Math.round((value / total) * 100);
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                                <span className="text-lg sm:text-xl" style={{ color: colors.text }}>
                                    {cat}: <strong>{value}</strong> <span className="opacity-60 text-sm">({percentage}%)</span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // LINE CHART
    if (chart.type === 'line') {
        return (
            <div className="w-full relative" style={{ height: `${height}px` }}>
                <div className="absolute inset-x-0 bottom-8 top-0 border-l-2 border-b-2" style={{ borderColor: `${colors.text}20` }}>
                    {/* Y-Axis Labels */}
                    <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between text-xs sm:text-sm font-mono" style={{ color: colors.text, opacity: 0.6 }}>
                        {[100, 75, 50, 25, 0].map((v, i) => (
                            <span key={i}>{Math.round((maxVal * v) / 100)}</span>
                        ))}
                    </div>

                    {/* SVG Line */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {series.map((s: any, seriesIdx: number) => {
                            const data = s.data || [];
                            // Share scale
                            const points = data.map((val: number, i: number) => {
                                const x = (i / (data.length - 1)) * 100;
                                const y = 100 - (val / maxVal) * 100;
                                return `${x},${y}`;
                            }).join(' ');

                            return (
                                <g key={seriesIdx}>
                                    <polyline
                                        points={points}
                                        fill="none"
                                        stroke={chartColors[seriesIdx % chartColors.length]}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="drop-shadow-md"
                                    />
                                    {/* Dots */}
                                    {data.map((val: number, i: number) => {
                                        const x = (i / (data.length - 1)) * 100;
                                        const y = 100 - (val / maxVal) * 100;
                                        return (
                                            <circle key={i} cx={x} cy={y} r="3" fill={colors.bg} stroke={chartColors[seriesIdx % chartColors.length]} strokeWidth="2" />
                                        )
                                    })}
                                </g>
                            );
                        })}
                    </svg>
                </div>
                {/* X-Axis Labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between transform translate-y-full pt-4">
                    {categories.map((cat: string, i: number) => (
                        <span key={i} className="text-xs sm:text-sm text-center w-20 truncate" style={{ color: colors.text, opacity: 0.7 }}>{cat}</span>
                    ))}
                </div>
            </div>
        );
    }

    // Default fallback
    return (
        <div className="flex bg-gray-100 items-center justify-center h-[300px] text-gray-500">
            Unknown Chart Type: {chart.type}
        </div>
    );
};

// Chart Layout - Multiple variants
type ChartVariation = 'default-container' | 'split-detail' | 'floating-card' | 'full-bleed-hero' | 'minimal-stat';

const ChartLayout = ({ slide, colors, variation = 'default-container', onSelect, selectedId, showPageNumber }: { slide: any; colors: any, variation?: ChartVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    // Normalization logic
    let chart = slide.chart || slide.content?.chart;

    // --- PATH RESOLUTION ---
    let chartPath = 'content.chart';
    if (slide.chart) chartPath = 'chart';
    else if (slide.content?.chart) chartPath = 'content.chart';

    // Fallback for AI generated chart data without checking specific structure yet
    // because chart object might be constructed below

    // AI Format Support
    const aiLabels = slide.content?.labels;
    const aiDatasets = slide.content?.datasets;

    if (!chart && aiLabels && aiDatasets) {
        chart = {
            title: slide.content?.title || slide.title,
            type: slide.content?.chartType || 'bar',
            categories: aiLabels,
            series: aiDatasets.map((ds: any) => ({
                name: ds.label || 'Data',
                data: ds.data
            }))
        };
    }

    // Default fallback if no valid structure
    if (!chart) return <div className="p-20 text-center opacity-50">No chart data found</div>;

    // Ensure chart type exists for renderer
    if (!chart.type) chart.type = 'bar';

    // --- VARIATION 1: SPLIT DETAIL (Analysis) ---
    if (variation === 'split-detail') {
        const totalValue = (chart.series?.[0]?.data || []).reduce((a: number, b: number) => a + b, 0);
        const avgValue = Math.round(totalValue / (chart.series?.[0]?.data?.length || 1));

        return (
            <div className="relative w-full h-full overflow-hidden flex" style={{ backgroundColor: colors.bg }}>
                {/* Left: Chart */}
                <div className="w-3/5 p-16 flex flex-col justify-center border-r" style={{ borderColor: `${colors.text}10` }}>
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-12"
                    >
                        <h2 className="text-4xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                    <ChartVisuals chart={chart} colors={colors} height={500} />
                </div>

                {/* Right: Details / Stats */}
                <div className="w-2/5 flex flex-col justify-center space-y-12 px-12" style={{ backgroundColor: `${colors.primary}05` }}>
                    <div className="space-y-2">
                        <span className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: colors.text }}>Total Value</span>
                        <EditableElement
                            element={{ id: 'total-value', type: 'text', value: totalValue.toLocaleString(), path: 'chart.totalValue', label: 'Total Value' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'total-value'}
                        >
                            <div className="text-6xl font-black tabular-nums" style={{ color: colors.primary }}>{totalValue.toLocaleString()}</div>
                        </EditableElement>
                    </div>

                    <div className="space-y-2">
                        <span className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: colors.text }}>Average</span>
                        <EditableElement
                            element={{ id: 'avg-value', type: 'text', value: avgValue.toLocaleString(), path: 'chart.avgValue', label: 'Average Value' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'avg-value'}
                        >
                            <div className="text-4xl font-bold tabular-nums opacity-80" style={{ color: colors.text }}>{avgValue.toLocaleString()}</div>
                        </EditableElement>
                    </div>

                    <div className="p-6 rounded-2xl border" style={{ borderColor: `${colors.text}10` }}>
                        <h4 className="font-bold mb-2" style={{ color: colors.text }}>Key Insight</h4>
                        <EditableElement
                            element={{ id: 'desc', type: 'text', value: slide.content?.description, path: 'content.description', label: 'Description' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'desc'}
                        >
                            <p className="opacity-70 leading-relaxed" style={{ color: colors.text }}>
                                {slide.content?.description || `Analysis of ${chart.title || slide.title} shows a total volume of ${totalValue}.`}
                            </p>
                        </EditableElement>
                    </div>
                </div>
            </div>
        );
    }

    // --- VARIATION 2: FLOATING CARD (Modern) ---
    if (variation === 'floating-card') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-12" style={{ backgroundColor: colors.bg }}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5" />
                <AbstractShapes colors={colors} />

                <div className="relative z-10 w-full max-w-5xl bg-surface backdrop-blur-xl rounded-3xl p-12 shadow-2xl border flex flex-col"
                    style={{ backgroundColor: `${colors.bg}F0`, borderColor: `${colors.text}10` }}>
                    <div className="flex items-center justify-between mb-12">
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                        >
                            <h2 className="text-4xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                        </EditableElement>
                        <div className="px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                            {chart.type} Analysis
                        </div>
                    </div>

                    <div className="flex-1 min-h-[400px]">
                        <ChartVisuals chart={chart} colors={colors} height={400} />
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} />
            </div>
        );
    }

    // --- VARIATION 3: FULL BLEED HERO (Immersive) ---
    if (variation === 'full-bleed-hero') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col justify-end p-20"
                style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: `radial-gradient(circle at top right, ${colors.secondary}, transparent)` }} />

                <div className="relative z-10 mb-12">
                    <span className="inline-block py-1 px-3 border border-white/30 rounded-full text-xs font-bold uppercase mb-6 tracking-widest text-white/80">Data Visualization</span>
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-8"
                    >
                        <h2 className="text-6xl font-black leading-tight max-w-4xl text-white">{slide.title}</h2>
                    </EditableElement>
                    <EditableElement
                        element={{ id: 'desc', type: 'text', value: slide.content?.description, path: 'content.description', label: 'Description' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'desc'}
                    >
                        <p className="text-xl text-white/70 max-w-2xl">{slide.content?.description}</p>
                    </EditableElement>
                </div>

                <div className="relative z-10 w-full h-[450px] bg-white/10 rounded-3xl p-12 backdrop-blur-sm border border-white/20">
                    {/* Force light colors for contrast in this dark mode variant */}
                    <ChartVisuals chart={chart} colors={{ ...colors, text: '#ffffff', bg: colors.primary }} height={350} />
                </div>
            </div>
        );
    }

    // --- VARIATION 4: MINIMAL STAT (Clean) ---
    if (variation === 'minimal-stat') {
        return (
            <div className="relative w-full h-full overflow-hidden p-20 flex flex-col" style={{ backgroundColor: colors.bg }}>
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-20 text-center"
                >
                    <h2 className="text-5xl font-light" style={{ color: colors.text }}>{slide.title}</h2>
                </EditableElement>

                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full max-w-4xl transform scale-110">
                        <ChartVisuals chart={chart} colors={colors} height={450} />
                    </div>
                </div>
                {slide.content?.description && (
                    <EditableElement
                        element={{ id: 'desc', type: 'text', value: slide.content?.description, path: 'content.description', label: 'Description' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'desc'}
                        className="max-w-2xl mx-auto mt-8"
                    >
                        <p className="text-center text-lg opacity-60" style={{ color: colors.text }}>
                            {slide.content?.description}
                        </p>
                    </EditableElement>
                )}
                <SlideFooter title={slide.title} colors={colors} />
            </div>
        );
    }

    // --- DEFAULT: GLASS CONTAINER ---
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'overlay'
                        }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col items-center justify-center px-16 py-12 h-full">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-10 text-center"
                >
                    <h2 className="text-4xl md:text-5xl font-bold" style={{ color: colors.text }}>
                        {slide.title}
                    </h2>
                </EditableElement>

                <div className="w-full max-w-5xl bg-surface/80 backdrop-blur-md rounded-3xl p-10 shadow-2xl border"
                    style={{ borderColor: `${colors.text}10` }}>

                    {chart ? (
                        <div className="w-full">
                            <EditableElement
                                element={{ id: 'chart-title', type: 'text', value: chart.title, path: `${chartPath}.title`, label: 'Chart Title' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'chart-title'}
                                className="mb-8"
                            >
                                {chart.title && <h3 className="text-xl font-bold text-center opacity-80" style={{ color: colors.text }}>{chart.title}</h3>}
                            </EditableElement>
                            <ChartVisuals chart={chart} colors={colors} height={400} />
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-2xl opacity-50">
                            Chart data not available
                        </div>
                    )}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={5} colors={colors} showPageNumber={showPageNumber} />
        </div>
    );
};


// Table layout - Modern glassmorphism design (Variants: default, striped, minimal)
// Table layout - Multiple variants for different data types
type TableVariation = 'default' | 'pricing-tiers' | 'data-grid' | 'feature-matrix';

const TableLayout = ({ slide, colors, variation = 'default', onSelect, selectedId, showPageNumber }: { slide: any; colors: any, variation?: TableVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    let table = slide.table || slide.content?.table;

    // Determine path prefix for editing
    let colsPath = 'content.table.columns';
    let rowsPath = 'content.table.rows';

    if (slide.table) {
        colsPath = 'table.columns';
        rowsPath = 'table.rows';
    } else if (slide.content?.table) {
        colsPath = 'content.table.columns';
        rowsPath = 'content.table.rows';
    } else if (slide.content?.headers && slide.content?.rows) {
        // Legacy/Direct format logic
        colsPath = 'content.headers';
        rowsPath = 'content.rows';

        if (!table) {
            table = {
                columns: slide.content.headers,
                rows: slide.content.rows
            };
        }
    }

    // --- VARIATION 1: PRICING TIERS (Cards) ---
    if (variation === 'pricing-tiers') {
        const plans = (table?.columns || []).length > 0 ? table.columns : ['Basic', 'Pro', 'Enterprise'];
        // Assume rows contain features or prices. If multiple rows, use first row as price, rest as features.
        // Or transpose: each column is a plan.

        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-12" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} variant="bento" />

                <div className="text-center mb-16 relative z-10 w-full max-w-4xl">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-4"
                    >
                        <h2 className="text-5xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                    <EditableElement
                        element={{ id: 'subtitle', type: 'text', value: slide.subtitle, path: 'subtitle', label: 'Subtitle' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'subtitle'}
                    >
                        {slide.subtitle && <p className="text-xl opacity-70" style={{ color: colors.text }}>{slide.subtitle}</p>}
                    </EditableElement>
                </div>

                <div className="flex gap-8 relative z-10 w-full max-w-6xl justify-center items-stretch">
                    {plans.slice(0, 3).map((plan: string, i: number) => {
                        const isPopular = i === 1; // Middle one highlighted
                        const price = table?.rows?.[0]?.[i] || '$XX';
                        const features = table?.rows?.slice(1).map((r: string[]) => r[i]) || [];

                        return (
                            <div key={i} className={`flex-1 rounded-3xl p-8 border flex flex-col relative transition-transform hover:-translate-y-2 ${isPopular ? 'shadow-2xl scale-105 z-20' : 'shadow-lg bg-surface/50'}`}
                                style={{
                                    backgroundColor: isPopular ? colors.primary : `${colors.bg}E6`,
                                    color: isPopular ? '#ffffff' : colors.text,
                                    borderColor: isPopular ? 'transparent' : `${colors.text}10`
                                }}>
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-yellow-400 text-black shadow-lg">
                                        Most Popular
                                    </div>
                                )}

                                <EditableElement
                                    element={{ id: `plan-${i}-name`, type: 'text', value: plan, path: `${colsPath}[${i}]`, label: `Plan Name` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `plan-${i}-name`}
                                    className="mb-2"
                                >
                                    <h3 className={`text-2xl font-bold ${isPopular ? 'text-white' : ''}`}>{plan}</h3>
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `plan-${i}-price`, type: 'text', value: price, path: `${rowsPath}[0][${i}]`, label: `Plan Price` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `plan-${i}-price`}
                                    className="mb-8"
                                >
                                    <div className="text-5xl font-black">{price}</div>
                                </EditableElement>

                                <ul className="space-y-4 flex-1">
                                    {features.map((feat: string, j: number) => (
                                        <li key={j} className="flex items-start gap-3 text-sm">
                                            <span className={`text-lg font-bold ${isPopular ? 'text-white' : 'text-green-500'}`}>✓</span>
                                            <EditableElement
                                                element={{ id: `plan-${i}-feat-${j}`, type: 'text', value: feat, path: `${rowsPath}[${j + 1}][${i}]`, label: `Feature` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `plan-${i}-feat-${j}`}
                                            >
                                                <span className="opacity-90 pt-0.5 block">{feat}</span>
                                            </EditableElement>
                                        </li>
                                    ))}
                                    {features.length === 0 && (
                                        <li className="opacity-50 italic">Feature list...</li>
                                    )}
                                </ul>

                                <button className={`w-full py-4 rounded-xl font-bold mt-8 transition-colors ${isPopular ? 'bg-white text-primary hover:bg-gray-100' : 'bg-primary text-white hover:opacity-90'}`}
                                    style={{ backgroundColor: isPopular ? '#ffffff' : colors.primary, color: isPopular ? colors.primary : '#ffffff' }}>
                                    Select Plan
                                </button>
                            </div>
                        );
                    })}
                </div>
                <SlideFooter title={slide.title} slideNumber={6} colors={colors} />
            </div>
        );
    }

    // --- VARIATION 2: DATA GRID (Dense financial) ---
    if (variation === 'data-grid') {
        const hasHeaderRow = (table?.columns || []).length > 0;
        return (
            <div className="relative w-full h-full overflow-hidden p-16 flex flex-col" style={{ backgroundColor: colors.bg }}>
                <div className="mb-12 flex justify-between items-end border-b pb-6" style={{ borderColor: `${colors.text}20` }}>
                    <div>
                        <span className="text-xs font-mono uppercase tracking-widest opacity-50 mb-2 block" style={{ color: colors.text }}>Data Report</span>
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                        >
                            <h2 className="text-4xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                        </EditableElement>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1 rounded bg-red-100 text-red-600 text-xs font-bold">- Negative</div>
                        <div className="px-3 py-1 rounded bg-green-100 text-green-600 text-xs font-bold">+ Positive</div>
                    </div>
                </div>

                <div className="flex-1 w-full overflow-hidden rounded-xl border bg-white shadow-sm"
                    style={{ borderColor: `${colors.text}15` }}>
                    <div className="overflow-auto h-full">
                        <table className="w-full text-sm font-mono border-collapse">
                            {hasHeaderRow && (
                                <thead className="sticky top-0 z-10">
                                    <tr style={{ backgroundColor: `${colors.primary}10` }}>
                                        {table.columns?.map((col: string, i: number) => (
                                            <th key={i} className="px-4 py-3 text-left font-bold border-b border-r last:border-r-0"
                                                style={{ borderColor: `${colors.text}10`, color: colors.primary }}>
                                                <EditableElement
                                                    element={{ id: `header-${i}`, type: 'text', value: col, path: `${colsPath}[${i}]`, label: `Header ${i + 1}` }}
                                                    onSelect={onSelect}
                                                    isSelected={selectedId === `header-${i}`}
                                                >
                                                    {col}
                                                </EditableElement>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                            )}
                            <tbody>
                                {table?.rows?.map((row: string[], rowIdx: number) => (
                                    <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                                        {row.map((cell: string, cellIdx: number) => {
                                            // Simple detection of numeric values for alignment
                                            const isNumeric = /^-?[\d,.$%]+$/.test(cell);
                                            const isNegative = cell.includes('-');
                                            return (
                                                <td key={cellIdx}
                                                    className={`px-4 py-3 border-b border-r last:border-r-0 ${isNumeric ? 'text-right' : 'text-left'}`}
                                                    style={{
                                                        borderColor: `${colors.text}10`,
                                                        color: isNegative ? '#EF4444' : colors.text,
                                                        fontFamily: isNumeric ? 'monospace' : 'inherit'
                                                    }}>
                                                    <EditableElement
                                                        element={{ id: `cell-${rowIdx}-${cellIdx}`, type: 'text', value: cell, path: `${rowsPath}[${rowIdx}][${cellIdx}]`, label: `Cell ${rowIdx + 1},${cellIdx + 1}` }}
                                                        onSelect={onSelect}
                                                        isSelected={selectedId === `cell-${rowIdx}-${cellIdx}`}
                                                    >
                                                        {cell}
                                                    </EditableElement>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <SlideFooter title={slide.title} slideNumber={6} colors={colors} />
            </div>
        );
    }

    // --- VARIATION 3: FEATURE MATRIX (Comparison) ---
    if (variation === 'feature-matrix') {
        return (
            <div className="relative w-full h-full overflow-hidden p-16 flex flex-col" style={{ backgroundColor: colors.bg }}>
                <div className="text-center mb-12 w-full max-w-4xl mx-auto">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-4"
                    >
                        <h2 className="text-6xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                    <div className="w-24 h-2 mx-auto rounded-full" style={{ backgroundColor: colors.primary }} />
                </div>

                <div className="w-full max-w-[90vw] mx-auto overflow-hidden rounded-2xl shadow-xl border"
                    style={{ borderColor: `${colors.primary}20`, backgroundColor: 'white' }}>
                    <table className="w-full">
                        <thead>
                            <tr style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                                {table?.columns?.map((col: string, i: number) => (
                                    <th key={i} className="px-8 py-6 text-left text-2xl font-black first:w-1/3 tracking-tight">
                                        <EditableElement
                                            element={{ id: `header-${i}`, type: 'text', value: col, path: `${colsPath}[${i}]`, label: `Header ${i + 1}` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `header-${i}`}
                                        >
                                            {col}
                                        </EditableElement>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {table?.rows?.map((row: string[], rowIdx: number) => (
                                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                    {row.map((cell: string, cellIdx: number) => {
                                        const isFirstCol = cellIdx === 0;
                                        const isCheck = cell.toLowerCase() === 'true' || cell === '✓' || cell.toLowerCase() === 'yes';
                                        const isCross = cell.toLowerCase() === 'false' || cell === '✗' || cell.toLowerCase() === 'no';

                                        return (
                                            <td key={cellIdx} className={`px-8 py-6 border-b text-xl ${isFirstCol ? 'font-bold text-gray-900' : 'text-center'}`}
                                                style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                                {isFirstCol ? (
                                                    <EditableElement
                                                        element={{ id: `cell-${rowIdx}-${cellIdx}`, type: 'text', value: cell, path: `${rowsPath}[${rowIdx}][${cellIdx}]`, label: `Cell ${rowIdx + 1},${cellIdx + 1}` }}
                                                        onSelect={onSelect}
                                                        isSelected={selectedId === `cell-${rowIdx}-${cellIdx}`}
                                                    >
                                                        {cell}
                                                    </EditableElement>
                                                ) : (
                                                    <EditableElement
                                                        element={{ id: `cell-${rowIdx}-${cellIdx}`, type: 'text', value: cell, path: `${rowsPath}[${rowIdx}][${cellIdx}]`, label: `Cell ${rowIdx + 1},${cellIdx + 1}` }}
                                                        onSelect={onSelect}
                                                        isSelected={selectedId === `cell-${rowIdx}-${cellIdx}`}
                                                    >
                                                        {isCheck ? <span className="text-green-500 font-bold text-2xl">✓</span> :
                                                            isCross ? <span className="text-gray-300 font-bold text-2xl">•</span> : // or X
                                                                <span className="text-gray-700">{cell}</span>
                                                        }
                                                    </EditableElement>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <SlideFooter title={slide.title} slideNumber={6} colors={colors} />
            </div>
        );
    }

    // --- DEFAULT: GLASS TABLE ---
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'overlay'
                        }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col items-center justify-center px-8 py-12 h-full">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-12 text-center"
                >
                    <h2 className="text-5xl md:text-6xl font-bold" style={{ color: colors.text }}>
                        {slide.title}
                    </h2>
                </EditableElement>

                {table ? (
                    <div className="w-full max-w-[90%] overflow-hidden rounded-3xl shadow-2xl border backdrop-blur-md"
                        style={{
                            backgroundColor: `${colors.bg}90`,
                            borderColor: `${colors.primary}30`,
                            boxShadow: `0 25px 50px -12px ${colors.primary}20`
                        }}>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: colors.primary }}>
                                    {table.columns?.map((col: string, i: number) => (
                                        <th
                                            key={i}
                                            className="px-10 py-8 text-left text-2xl font-bold uppercase tracking-wider text-white"
                                        >
                                            <EditableElement
                                                element={{ id: `header-${i}`, type: 'text', value: col, path: `${colsPath}[${i}]`, label: `Header ${i + 1}` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `header-${i}`}
                                            >
                                                {col}
                                            </EditableElement>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {table.rows?.map((row: string[], rowIdx: number) => (
                                    <tr
                                        key={rowIdx}
                                        className="transition-colors hover:bg-white/5"
                                        style={{
                                            borderBottom: `1px solid ${colors.text}10`
                                        }}
                                    >
                                        {row.map((cell: string, cellIdx: number) => (
                                            <td
                                                key={cellIdx}
                                                className="px-10 py-6 text-xl"
                                                style={{ color: colors.text }}
                                            >
                                                <EditableElement
                                                    element={{ id: `cell-${rowIdx}-${cellIdx}`, type: 'text', value: cell, path: `${rowsPath}[${rowIdx}][${cellIdx}]`, label: `Cell ${rowIdx + 1},${cellIdx + 1}` }}
                                                    onSelect={onSelect}
                                                    isSelected={selectedId === `cell-${rowIdx}-${cellIdx}`}
                                                >
                                                    {cell}
                                                </EditableElement>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-2xl" style={{ color: colors.text, opacity: 0.6 }}>
                        Table data not available
                    </div>
                )}
            </div>

            <SlideFooter title={slide.title} slideNumber={6} colors={colors} showPageNumber={showPageNumber} />
        </div>
    );
};


// Timeline layout - Process steps (Variants: default, vertical, zigzag)
// Timeline layout - Process steps (Variants: default, vertical, zigzag)
type TimelineVariation = 'horizontal-line' | 'vertical-alternating' | 'connected-cards' | 'stepped-process' | 'minimal-list';

const TimelineLayout = ({ slide, colors, variation = 'horizontal-line', onSelect, selectedId, showPageNumber }: { slide: any; colors: any, variation?: TimelineVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    const timeline = slide.timeline || slide.content?.timeline;
    // Support AI format: content.steps or content.events with {date, event} objects
    let items = timeline?.items || [];
    const sourceItems = slide.content?.steps || slide.content?.events;

    // --- PATH RESOLUTION ---
    let itemsPath = 'content.timeline.items';
    if (slide.timeline?.items) itemsPath = 'timeline.items';
    else if (slide.content?.timeline?.items) itemsPath = 'content.timeline.items';
    else if (slide.content?.steps) itemsPath = 'content.steps';
    else if (slide.content?.events) itemsPath = 'content.events';

    if (items.length === 0 && sourceItems?.length > 0) {
        // Convert AI format {date, event} to expected format {date, title, description}
        items = sourceItems.map((step: any) => ({
            date: step.date || '',
            title: step.event || step.title || '',
            description: step.description || ''
        }));
    }

    // --- VARIATION 1: CONNECTED CARDS (Modern Process) ---
    if (variation === 'connected-cards') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-12" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} />

                <div className="text-center mb-16 relative z-10 w-full max-w-5xl">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h2 className="text-5xl font-bold mb-4" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                </div>

                <div className="flex gap-6 relative z-10 w-full max-w-7xl justify-center items-stretch">
                    {/* Connecting Line passing through */}
                    <div className="absolute top-1/2 left-10 right-10 h-2 -translate-y-1/2 rounded-full -z-10 opacity-30"
                        style={{ backgroundColor: colors.primary }} />

                    {items.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="flex-1 bg-surface backdrop-blur-xl rounded-2xl p-6 border shadow-xl flex flex-col relative group transition-transform hover:-translate-y-2"
                            style={{ backgroundColor: `${colors.bg}E6`, borderColor: `${colors.text}10` }}>

                            <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full border-4 bg-white"
                                style={{ borderColor: colors.primary, opacity: i === 0 ? 0 : 1 }} />

                            <EditableElement
                                element={{ id: `step-${i}-date`, type: 'text', value: item.date, path: `${itemsPath}[${i}].date`, label: `Step ${i + 1} Date` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `step-${i}-date`}
                                className="mb-4 self-start"
                            >
                                <span className="inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest"
                                    style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                                    {item.date || `Step ${i + 1}`}
                                </span>
                            </EditableElement>

                            <EditableElement
                                element={{ id: `step-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Step ${i + 1} Title` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `step-${i}-title`}
                                className="mb-2"
                            >
                                <h3 className="text-xl font-bold leading-tight" style={{ color: colors.text }}>{item.title}</h3>
                            </EditableElement>
                            <EditableElement
                                element={{ id: `step-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i}].description`, label: `Step ${i + 1} Description` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `step-${i}-desc`}
                            >
                                <p className="text-sm opacity-70 leading-relaxed" style={{ color: colors.text }}>{item.description}</p>
                            </EditableElement>
                        </div>
                    ))}
                </div>
                <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 2: STEPPED PROCESS (Instructional) ---
    if (variation === 'stepped-process') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col p-16" style={{ backgroundColor: colors.bg }}>
                <div className="mb-12 border-b pb-6" style={{ borderColor: `${colors.text}20` }}>
                    <h2 className="text-5xl font-black tracking-tight" style={{ color: colors.text }}>{slide.title}</h2>
                </div>

                <div className="flex-1 grid grid-cols-4 gap-4">
                    {items.slice(0, 4).map((item: any, i: number) => (
                        <div key={i} className="relative pt-12 pr-4 flex flex-col group">
                            {/* Big Number */}
                            <div className="absolute top-0 left-0 text-8xl font-black opacity-10 leading-none select-none transition-opacity group-hover:opacity-20"
                                style={{ color: colors.primary }}>
                                {i + 1}
                            </div>

                            {/* Step Content */}
                            <div className="relative z-10 pt-8 pl-4 border-l-4 h-full transition-all group-hover:pl-6"
                                style={{ borderColor: i % 2 === 0 ? colors.primary : colors.secondary }}>
                                <EditableElement
                                    element={{ id: `step-${i}-date`, type: 'text', value: item.date, path: `${itemsPath}[${i}].date`, label: `Step ${i + 1} Date` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `step-${i}-date`}
                                    className="mb-2"
                                >
                                    <div className="text-sm font-bold opacity-60 uppercase tracking-widest" style={{ color: colors.text }}>
                                        {item.date}
                                    </div>
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `step-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Step ${i + 1} Title` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `step-${i}-title`}
                                    className="mb-3"
                                >
                                    <h3 className="text-2xl font-bold" style={{ color: colors.text }}>{item.title}</h3>
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `step-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i}].description`, label: `Step ${i + 1} Description` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `step-${i}-desc`}
                                >
                                    <p className="text-lg opacity-80 leading-snug" style={{ color: colors.text }}>{item.description}</p>
                                </EditableElement>
                            </div>
                        </div>
                    ))}
                </div>
                <SlideFooter title={slide.title} colors={colors} />
            </div>
        );
    }

    // --- VARIATION 3: VERTICAL ALTERNATING (History) ---
    if (variation === 'vertical-alternating') {
        return (
            <div className="relative w-full h-full overflow-hidden p-12 flex flex-col" style={{ backgroundColor: colors.bg }}>
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-12 relative z-10"
                >
                    <h2 className="text-7xl font-serif italic relative z-10" style={{ color: colors.text }}>{slide.title}</h2>
                </EditableElement>

                <div className="flex-1 relative overflow-hidden">
                    {/* Central Line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ backgroundColor: `${colors.text}20` }} />

                    <div className="h-full flex flex-col justify-center gap-8 py-8 relative">
                        {items.slice(0, 4).map((item: any, i: number) => {
                            const isLeft = i % 2 === 0;
                            return (
                                <div key={i} className={`flex items-center w-full relative ${isLeft ? '' : 'flex-row-reverse'}`}>
                                    {/* Side Content */}
                                    <div className={`w-1/2 px-12 ${isLeft ? 'text-right' : 'text-left'}`}>
                                        <EditableElement
                                            element={{ id: `step-${i}-date`, type: 'text', value: item.date, path: `${itemsPath}[${i}].date`, label: `Step ${i + 1} Date` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `step-${i}-date`}
                                            className="mb-1"
                                        >
                                            <span className="text-xl font-mono font-bold block" style={{ color: colors.primary }}>{item.date}</span>
                                        </EditableElement>
                                        <EditableElement
                                            element={{ id: `step-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Step ${i + 1} Title` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `step-${i}-title`}
                                            className="mb-2"
                                        >
                                            <h3 className="text-2xl font-bold leading-tight" style={{ color: colors.text }}>{item.title}</h3>
                                        </EditableElement>
                                        <EditableElement
                                            element={{ id: `step-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i}].description`, label: `Step ${i + 1} Description` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `step-${i}-desc`}
                                        >
                                            <p className="text-base opacity-70" style={{ color: colors.text }}>{item.description}</p>
                                        </EditableElement>
                                    </div>

                                    {/* Center Dot */}
                                    <div className="relative z-10 w-4 h-4 rounded-full bg-surface border-4 shrink-0 shadow-sm"
                                        style={{ borderColor: colors.primary }} />

                                    {/* Empty side for spacing */}
                                    <div className="w-1/2" />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} />
            </div>
        );
    }

    // --- VARIATION 4: MINIMAL LIST (Content Heavy) ---
    if (variation === 'minimal-list') {
        return (
            <div className="relative w-full h-full overflow-hidden p-20 flex" style={{ backgroundColor: colors.bg }}>
                {/* Left Title Area */}
                <div className="w-2/5 pr-16 flex flex-col justify-center">
                    <h2 className="text-6xl font-light mb-8 leading-tight" style={{ color: colors.text }}>{slide.title}</h2>
                    <div className="w-20 h-1 mb-8" style={{ backgroundColor: colors.primary }} />
                    <p className="text-xl opacity-60 leading-relaxed" style={{ color: colors.text }}>
                        Timeline of key events and milestones.
                    </p>
                </div>

                {/* Right List Area */}
                <div className="w-3/5 flex flex-col justify-center border-l pl-16 space-y-10" style={{ borderColor: `${colors.text}15` }}>
                    {items.slice(0, 5).map((item: any, i: number) => (
                        <div key={i} className="relative pl-6">
                            <div className="absolute left-0 top-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.secondary }} />

                            <div className="flex items-baseline gap-4 mb-1">
                                <EditableElement
                                    element={{ id: `step-${i}-date`, type: 'text', value: item.date, path: `${itemsPath}[${i}].date`, label: `Step ${i + 1} Date` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `step-${i}-date`}
                                >
                                    {item.date && (
                                        <span className="text-sm font-bold uppercase tracking-wider opacity-50 shrink-0 w-24 block" style={{ color: colors.text }}>
                                            {item.date}
                                        </span>
                                    )}
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `step-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Step ${i + 1} Title` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `step-${i}-title`}
                                >
                                    <h3 className="text-2xl font-bold" style={{ color: colors.text }}>{item.title}</h3>
                                </EditableElement>
                            </div>
                            <EditableElement
                                element={{ id: `step-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i}].description`, label: `Step ${i + 1} Description` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `step-${i}-desc`}
                                className="pl-28"
                            >
                                <p className="text-lg opacity-70" style={{ color: colors.text }}>{item.description}</p>
                            </EditableElement>
                        </div>
                    ))}
                </div>
                <SlideFooter title={slide.title} colors={colors} />
            </div>
        );
    }


    // --- DEFAULT: HORIZONTAL LINE ---
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'overlay'
                        }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-16 text-center"
                >
                    <h2 className="text-5xl md:text-6xl font-bold" style={{ color: colors.text }}>
                        {slide.title}
                    </h2>
                </EditableElement>

                <div className="flex-1 flex items-center justify-center">
                    <div className="w-full relative">
                        {/* Timeline line */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2" style={{ backgroundColor: `${colors.primary}40` }} />

                        {/* Timeline items */}
                        <div className="relative flex justify-between px-12">
                            {items.slice(0, 5).map((item: any, i: number) => (
                                <div key={i} className={`flex flex-col items-center max-w-[240px] relative ${i % 2 === 0 ? '-top-12' : 'top-12'}`}>
                                    {/* Date */}
                                    <EditableElement
                                        element={{ id: `step-${i}-date`, type: 'text', value: item.date, path: `${itemsPath}[${i}].date`, label: `Step ${i + 1} Date` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `step-${i}-date`}
                                        className={`mb-4 ${i % 2 === 0 ? 'order-1' : 'order-3 mt-4'}`}
                                    >
                                        <span className="text-lg font-bold" style={{ color: getReadableColor(colors.primary, colors.bg) }}>{item.date}</span>
                                    </EditableElement>

                                    {/* Circle node */}
                                    <div className={`w-6 h-6 rounded-full border-4 shadow-lg z-10 order-2`} style={{ backgroundColor: colors.primary, borderColor: colors.bg }} />

                                    {/* Content */}
                                    <div className={`text-center ${i % 2 === 0 ? 'order-3 mt-4' : 'order-1 mb-4'}`}>
                                        <EditableElement
                                            element={{ id: `step-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Step ${i + 1} Title` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `step-${i}-title`}
                                            className="mb-2"
                                        >
                                            <h4 className="text-xl font-bold leading-tight" style={{ color: colors.text }}>{item.title}</h4>
                                        </EditableElement>
                                        <EditableElement
                                            element={{ id: `step-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i}].description`, label: `Step ${i + 1} Description` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `step-${i}-desc`}
                                        >
                                            {item.description && (
                                                <p className="text-base mt-2 leading-snug" style={{ color: colors.text, opacity: 0.7 }}>{item.description}</p>
                                            )}
                                        </EditableElement>
                                    </div>
                                    {/* Connector line to main axis */}
                                    <div className={`absolute left-1/2 w-0.5 h-12 bg-primary/30 -z-10 ${i % 2 === 0 ? 'top-[40px]' : 'bottom-[40px]'}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={7} colors={colors} />
        </div>
    );
};

// Comparison layout - Multiple variants
// Comparison layout - Multiple variants
type ComparisonVariation = 'balanced-split' | 'versus-cards' | 'feature-grid' | 'before-after' | 'pros-cons';

const ComparisonLayout = ({ slide, colors, variation = 'balanced-split', onSelect, selectedId, showPageNumber }: { slide: any; colors: any, variation?: ComparisonVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {

    const comparison = slide.comparison || slide.content?.comparison;
    const columns = slide.columns || slide.content?.columns;

    // Support AI format: leftTitle/leftBullets, rightTitle/rightBullets directly in content
    let left = comparison?.left || columns?.[0];
    let right = comparison?.right || columns?.[1];

    // Robust mapping for left side
    if (typeof left === 'string') {
        left = { title: left, items: [] };
    }
    if (!left && (slide.content?.leftTitle || slide.content?.leftPoints || slide.content?.leftBullets || slide.content?.leftContent)) {
        left = {
            title: slide.content?.leftTitle || slide.content?.comparison?.leftTitle || "Left side",
            items: slide.content?.leftBullets || slide.content?.leftItems || slide.content?.leftPoints || (slide.content?.leftContent ? [slide.content.leftContent] : []) || []
        };
    } else if (left && (!left.items || left.items.length === 0)) {
        // Fill items if they exist elsewhere
        const content = slide.content?.leftContent;
        left.items = slide.content?.leftBullets || slide.content?.leftItems || slide.content?.leftPoints || (content ? [content] : []) || left.items || [];
    }

    // Robust mapping for right side
    if (typeof right === 'string') {
        right = { title: right, items: [] };
    }
    if (!right && (slide.content?.rightTitle || slide.content?.rightPoints || slide.content?.rightBullets || slide.content?.rightContent)) {
        right = {
            title: slide.content?.rightTitle || slide.content?.comparison?.rightTitle || "Right side",
            items: slide.content?.rightBullets || slide.content?.rightItems || slide.content?.rightPoints || (slide.content?.rightContent ? [slide.content.rightContent] : []) || []
        };
    } else if (right && (!right.items || right.items.length === 0)) {
        // Fill items if they exist elsewhere
        const content = slide.content?.rightContent;
        right.items = slide.content?.rightBullets || slide.content?.rightItems || slide.content?.rightPoints || (content ? [content] : []) || right.items || [];
    }

    // --- PATH RESOLUTION ---
    // Determine Paths for Left Side
    let leftTitlePath = 'content.comparison.leftTitle';
    let leftItemsPath = 'content.comparison.leftBullets';

    if (slide.comparison?.left) {
        leftTitlePath = 'comparison.left.title';
        leftItemsPath = 'comparison.left.items';
    } else if (slide.content?.comparison?.left) {
        leftTitlePath = 'content.comparison.left.title';
        leftItemsPath = 'content.comparison.left.items';
    } else if (slide.columns?.[0]) {
        leftTitlePath = 'columns[0].title';
        leftItemsPath = 'columns[0].items';
    } else if (slide.content?.columns?.[0]) {
        leftTitlePath = 'content.columns[0].title';
        leftItemsPath = 'content.columns[0].items';
    } else if (slide.content?.leftTitle) {
        leftTitlePath = 'content.leftTitle';
        // items might be leftBullets, leftItems, leftPoints
        if (slide.content.leftBullets) leftItemsPath = 'content.leftBullets';
        else if (slide.content.leftItems) leftItemsPath = 'content.leftItems';
        else if (slide.content.leftPoints) leftItemsPath = 'content.leftPoints';
    }

    // Determine Paths for Right Side
    let rightTitlePath = 'content.comparison.rightTitle';
    let rightItemsPath = 'content.comparison.rightBullets';

    if (slide.comparison?.right) {
        rightTitlePath = 'comparison.right.title';
        rightItemsPath = 'comparison.right.items';
    } else if (slide.content?.comparison?.right) {
        rightTitlePath = 'content.comparison.right.title';
        rightItemsPath = 'content.comparison.right.items';
    } else if (slide.columns?.[1]) {
        rightTitlePath = 'columns[1].title';
        rightItemsPath = 'columns[1].items';
    } else if (slide.content?.columns?.[1]) {
        rightTitlePath = 'content.columns[1].title';
        rightItemsPath = 'content.columns[1].items';
    } else if (slide.content?.rightTitle) {
        rightTitlePath = 'content.rightTitle';
        if (slide.content.rightBullets) rightItemsPath = 'content.rightBullets';
        else if (slide.content.rightItems) rightItemsPath = 'content.rightItems';
        else if (slide.content.rightPoints) rightItemsPath = 'content.rightPoints';
    }

    // --- VARIATION 1: VERSUS CARDS (Competitive) ---
    if (variation === 'versus-cards') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col p-12" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} />
                <div className="text-center mb-12 relative z-10 w-full">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h2 className="text-5xl font-bold mb-4" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                </div>

                <div className="flex-1 flex gap-12 items-center justify-center relative z-10 p-8">
                    {/* VS Badge */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full flex items-center justify-center font-black text-3xl shadow-2xl z-20 border-4 animate-pulse"
                        style={{ backgroundColor: colors.primary, color: '#ffffff', borderColor: colors.bg }}>
                        VS
                    </div>

                    {/* Left Card */}
                    <div className="flex-1 h-full bg-surface backdrop-blur-xl rounded-3xl p-10 border shadow-2xl flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform duration-500"
                        style={{ backgroundColor: `${colors.bg}E6`, borderColor: `${colors.text}10` }}>
                        <div className="w-16 h-16 rounded-2xl mb-6 shadow-inner flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: `${colors.text}10`, color: colors.text }}>A</div>
                        {left && (
                            <>
                                <EditableElement
                                    element={{ id: 'left-title', type: 'text', value: left.title, path: leftTitlePath, label: 'Left Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'left-title'}
                                    className="mb-8"
                                >
                                    <h3 className="text-3xl font-bold" style={{ color: colors.text }}>{left.title}</h3>
                                </EditableElement>
                                <ul className="space-y-4 w-full text-left">
                                    {(left.items || []).map((item: string, j: number) => (
                                        <li key={j} className="flex items-start gap-4 p-3 rounded-xl hover:bg-black/5 transition-colors">
                                            <span className="w-2 h-2 rounded-full mt-2.5 shrink-0" style={{ backgroundColor: colors.primary }} />
                                            <EditableElement
                                                element={{ id: `left-item-${j}`, type: 'text', value: item, path: `${leftItemsPath}[${j}]`, label: `Left Item ${j + 1}` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `left-item-${j}`}
                                            >
                                                <span className="text-lg opacity-80" style={{ color: colors.text }}>{item}</span>
                                            </EditableElement>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    {/* Right Card */}
                    <div className="flex-1 h-full bg-surface backdrop-blur-xl rounded-3xl p-10 border shadow-2xl flex flex-col items-center text-center transform hover:-translate-y-2 transition-transform duration-500 delay-100"
                        style={{ backgroundColor: colors.primary, borderColor: colors.primary, color: '#ffffff' }}>
                        <div className="w-16 h-16 rounded-2xl mb-6 shadow-lg flex items-center justify-center text-2xl font-bold bg-white/20 text-white">B</div>
                        {right && (
                            <>
                                <EditableElement
                                    element={{ id: 'right-title', type: 'text', value: right.title, path: rightTitlePath, label: 'Right Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'right-title'}
                                    className="mb-8"
                                >
                                    <h3 className="text-3xl font-bold">{right.title}</h3>
                                </EditableElement>
                                <ul className="space-y-4 w-full text-left">
                                    {(right.items || []).map((item: string, j: number) => (
                                        <li key={j} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/10 transition-colors">
                                            <span className="w-2 h-2 rounded-full mt-2.5 shrink-0 bg-white" />
                                            <EditableElement
                                                element={{ id: `right-item-${j}`, type: 'text', value: item, path: `${rightItemsPath}[${j}]`, label: `Right Item ${j + 1}` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `right-item-${j}`}
                                            >
                                                <span className="text-lg opacity-90">{item}</span>
                                            </EditableElement>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 2: FEATURE GRID (Detailed) ---
    if (variation === 'feature-grid') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col p-16" style={{ backgroundColor: colors.bg }}>
                <div className="mb-12 border-b pb-6" style={{ borderColor: `${colors.text}20` }}>
                    <h2 className="text-4xl font-bold tracking-tight" style={{ color: colors.text }}>{slide.title}</h2>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-px bg-gray-200 border rounded-2xl overflow-hidden"
                    style={{ backgroundColor: `${colors.text}20`, borderColor: `${colors.text}20` }}>

                    {/* Left Column */}
                    <div className="bg-surface flex flex-col" style={{ backgroundColor: colors.bg }}>
                        <div className="p-8 border-b" style={{ borderColor: `${colors.text}10`, backgroundColor: `${colors.primary}10` }}>
                            {left && (
                                <EditableElement
                                    element={{ id: 'left-title', type: 'text', value: left.title, path: leftTitlePath, label: 'Left Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'left-title'}
                                >
                                    <h3 className="text-2xl font-bold text-center" style={{ color: colors.primary }}>{left.title}</h3>
                                </EditableElement>
                            )}
                        </div>
                        <div className="flex-1 p-8">
                            <ul className="space-y-0">
                                {(left?.items || []).map((item: string, j: number) => (
                                    <li key={j} className="flex items-center gap-4 py-4 border-b last:border-0" style={{ borderColor: `${colors.text}08` }}>
                                        <span className="text-green-500 font-bold text-xl">✓</span>
                                        <EditableElement
                                            element={{ id: `left-item-${j}`, type: 'text', value: item, path: `${leftItemsPath}[${j}]`, label: `Left Item ${j + 1}` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `left-item-${j}`}
                                        >
                                            <span className="text-lg opacity-80" style={{ color: colors.text }}>{item}</span>
                                        </EditableElement>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="bg-surface flex flex-col" style={{ backgroundColor: colors.bg }}>
                        <div className="p-8 border-b" style={{ borderColor: `${colors.text}10`, backgroundColor: `${colors.secondary}10` }}>
                            {right && (
                                <EditableElement
                                    element={{ id: 'right-title', type: 'text', value: right.title, path: rightTitlePath, label: 'Right Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'right-title'}
                                >
                                    <h3 className="text-2xl font-bold text-center" style={{ color: colors.secondary }}>{right.title}</h3>
                                </EditableElement>
                            )}
                        </div>
                        <div className="flex-1 p-8">
                            <ul className="space-y-0">
                                {(right?.items || []).map((item: string, j: number) => (
                                    <li key={j} className="flex items-center gap-4 py-4 border-b last:border-0" style={{ borderColor: `${colors.text}08` }}>
                                        <span className="text-green-500 font-bold text-xl">✓</span>
                                        <EditableElement
                                            element={{ id: `right-item-${j}`, type: 'text', value: item, path: `${rightItemsPath}[${j}]`, label: `Right Item ${j + 1}` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `right-item-${j}`}
                                        >
                                            <span className="text-lg opacity-80" style={{ color: colors.text }}>{item}</span>
                                        </EditableElement>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 3: BEFORE / AFTER (Transformation) ---
    if (variation === 'before-after') {
        return (
            <div className="relative w-full h-full overflow-hidden flex" style={{ backgroundColor: colors.bg }}>
                {/* Arrow Indicator */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full shadow-xl z-20 flex items-center justify-center text-4xl"
                    style={{ color: colors.primary }}>
                    →
                </div>

                {/* Before Side (Muted/Grayscale) */}
                <div className="w-1/2 h-full p-16 flex flex-col justify-center items-center relative overflow-hidden bg-gray-100"
                    style={{ backgroundColor: '#F3F4F6' }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(https://source.unsplash.com/random/grayscale)`, backgroundSize: 'cover' }} />

                    <div className="relative z-10 w-full max-w-lg">
                        <span className="uppercase tracking-widest text-sm font-bold opacity-50 mb-4 block text-gray-500">The Problem</span>
                        {left && (
                            <>
                                <EditableElement
                                    element={{ id: 'left-title', type: 'text', value: left.title, path: leftTitlePath, label: 'Left Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'left-title'}
                                    className="mb-8"
                                >
                                    <h3 className="text-4xl font-bold text-gray-700">{left.title}</h3>
                                </EditableElement>
                                <ul className="space-y-6">
                                    {(left.items || []).map((item: string, j: number) => (
                                        <li key={j} className="flex items-start gap-4 opacity-70">
                                            <span className="text-xl text-red-400">✗</span>
                                            <EditableElement
                                                element={{ id: `left-item-${j}`, type: 'text', value: item, path: `${leftItemsPath}[${j}]`, label: `Left Item ${j + 1}` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `left-item-${j}`}
                                            >
                                                <span className="text-xl text-gray-600">{item}</span>
                                            </EditableElement>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>

                {/* After Side (Vibrant) */}
                <div className="w-1/2 h-full p-16 flex flex-col justify-center items-center relative overflow-hidden"
                    style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: `url(https://source.unsplash.com/random/nature)`, backgroundSize: 'cover' }} />

                    <div className="relative z-10 w-full max-w-lg">
                        <span className="uppercase tracking-widest text-sm font-bold opacity-70 mb-4 block text-white">The Solution</span>
                        {right && (
                            <>
                                <EditableElement
                                    element={{ id: 'right-title', type: 'text', value: right.title, path: rightTitlePath, label: 'Right Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'right-title'}
                                    className="mb-8"
                                >
                                    <h3 className="text-4xl font-bold">{right.title}</h3>
                                </EditableElement>
                                <ul className="space-y-6">
                                    {(right.items || []).map((item: string, j: number) => (
                                        <li key={j} className="flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs shrink-0" style={{ color: colors.primary }}>✓</div>
                                            <EditableElement
                                                element={{ id: `right-item-${j}`, type: 'text', value: item, path: `${rightItemsPath}[${j}]`, label: `Right Item ${j + 1}` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `right-item-${j}`}
                                            >
                                                <span className="text-xl font-medium">{item}</span>
                                            </EditableElement>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- VARIATION 4: PROS / CONS (Analysis) ---
    if (variation === 'pros-cons') {
        return (
            <div className="relative w-full h-full overflow-hidden p-12 flex flex-col" style={{ backgroundColor: colors.bg }}>
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold mb-4" style={{ color: colors.text }}>{slide.title}</h2>
                </div>

                <div className="flex-1 flex gap-12 max-w-7xl mx-auto w-full">
                    {/* Left (Cons/Negative typically left, or Pros if specified) */}
                    {/* We assume Left = Positive/Pros usually, but let's visually distinguish */}
                    <div className="flex-1 bg-green-50 rounded-3xl p-10 border border-green-100 flex flex-col"
                        style={{ backgroundColor: `${colors.secondary}10`, borderColor: `${colors.secondary}30` }}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-white shadow-sm" style={{ color: colors.secondary }}>👍</div>
                            {left && (
                                <EditableElement
                                    element={{ id: 'left-title', type: 'text', value: left.title, path: leftTitlePath, label: 'Left Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'left-title'}
                                >
                                    <h3 className="text-3xl font-bold" style={{ color: colors.secondary }}>{left.title}</h3>
                                </EditableElement>
                            )}
                        </div>
                        <ul className="space-y-4">
                            {(left?.items || []).map((item: string, j: number) => (
                                <li key={j} className="flex items-start gap-3">
                                    <span className="text-green-500 text-xl font-bold">+</span>
                                    <EditableElement
                                        element={{ id: `left-item-${j}`, type: 'text', value: item, path: `${leftItemsPath}[${j}]`, label: `Left Item ${j + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `left-item-${j}`}
                                    >
                                        <span className="text-lg opacity-80" style={{ color: colors.text }}>{item}</span>
                                    </EditableElement>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right */}
                    <div className="flex-1 bg-red-50 rounded-3xl p-10 border border-red-100 flex flex-col"
                        style={{ backgroundColor: `${colors.accent}10`, borderColor: `${colors.accent}30` }}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-white shadow-sm" style={{ color: colors.accent }}>👎</div>
                            {right && (
                                <EditableElement
                                    element={{ id: 'right-title', type: 'text', value: right.title, path: rightTitlePath, label: 'Right Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'right-title'}
                                >
                                    <h3 className="text-3xl font-bold" style={{ color: colors.accent }}>{right.title}</h3>
                                </EditableElement>
                            )}
                        </div>
                        <ul className="space-y-4">
                            {(right?.items || []).map((item: string, j: number) => (
                                <li key={j} className="flex items-start gap-3">
                                    <span className="text-red-500 text-xl font-bold">-</span>
                                    <EditableElement
                                        element={{ id: `right-item-${j}`, type: 'text', value: item, path: `${rightItemsPath}[${j}]`, label: `Right Item ${j + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `right-item-${j}`}
                                    >
                                        <span className="text-lg opacity-80" style={{ color: colors.text }}>{item}</span>
                                    </EditableElement>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
            </div>
        );
    }


    // --- DEFAULT: BALANCED SPLIT ---
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            {/* Split background */}
            <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full" style={{ backgroundColor: colors.bg }} />
                <div className="w-1/2 h-full opacity-5" style={{ backgroundColor: colors.primary }} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
                <div className="text-center pt-16 pb-8">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h2 className="text-5xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                </div>

                <div className="flex-1 flex w-full h-full pb-20">
                    {/* Left split */}
                    <div className="w-1/2 flex flex-col justify-start px-20 pt-12 relative border-r" style={{ borderColor: `${colors.text}10` }}>
                        {left && (
                            <>
                                <EditableElement
                                    element={{ id: 'left-title', type: 'text', value: left.title, path: leftTitlePath, label: 'Left Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'left-title'}
                                    className="mb-8"
                                >
                                    <h3 className="text-3xl font-bold text-center" style={{ color: colors.primary }}>{left.title}</h3>
                                </EditableElement>
                                <ul className="space-y-6">
                                    {(left.items || []).map((item: string, j: number) => (
                                        <li key={j} className="flex items-start gap-4">
                                            <span className="w-2 h-2 rounded-full mt-2.5 bg-gray-400" />
                                            <EditableElement
                                                element={{ id: `left-item-${j}`, type: 'text', value: item, path: `${leftItemsPath}[${j}]`, label: `Left Item ${j + 1}` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `left-item-${j}`}
                                            >
                                                <span className="text-xl opacity-90" style={{ color: colors.text }}>{item}</span>
                                            </EditableElement>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                    {/* Right split */}
                    <div className="w-1/2 flex flex-col justify-start px-20 pt-12 relative">
                        {right && (
                            <>
                                <EditableElement
                                    element={{ id: 'right-title', type: 'text', value: right.title, path: rightTitlePath, label: 'Right Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'right-title'}
                                    className="mb-8"
                                >
                                    <h3 className="text-3xl font-bold text-center" style={{ color: colors.secondary }}>{right.title}</h3>
                                </EditableElement>
                                <ul className="space-y-6">
                                    {(right.items || []).map((item: string, j: number) => (
                                        <li key={j} className="flex items-start gap-4">
                                            <span className="w-2 h-2 rounded-full mt-2.5 bg-gray-400" />
                                            <EditableElement
                                                element={{ id: `right-item-${j}`, type: 'text', value: item, path: `${rightItemsPath}[${j}]`, label: `Right Item ${j + 1}` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `right-item-${j}`}
                                            >
                                                <span className="text-xl opacity-90" style={{ color: colors.text }}>{item}</span>
                                            </EditableElement>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <SlideFooter title={slide.title} slideNumber={8} colors={colors} showPageNumber={showPageNumber} />
        </div>
    );
};

// Infographic layout - Funnels, pyramids, processes
// Infographic layout - Multiple variants for different flow types
type InfographicVariation = 'funnel' | 'pyramid' | 'process' | 'cycle-flow' | 'hub-spoke';

const InfographicLayout = ({ slide, colors, variation = 'funnel', onSelect, selectedId, showPageNumber }: { slide: any; colors: any, variation?: InfographicVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    let infographic = slide.infographic || slide.content?.infographic;

    // Support AI format: type and steps directly in content
    if (!infographic && slide.content?.steps) {
        infographic = {
            type: slide.content.type || 'funnel',
            steps: slide.content.steps.map((step: any) => {
                // Handle string steps from AI
                if (typeof step === 'string') {
                    return { label: step, value: '' };
                }
                // Handle AI object format {title, description} -> {label, description}
                if (step.title && !step.label) {
                    return { ...step, label: step.title };
                }
                return step;
            })
        };
    }

    const steps = infographic?.steps || [];
    // If variation is passed, we should trust it effectively as ModernSlideRenderer handles the 'smart' selection
    const type = variation || infographic?.type || 'funnel';



    // --- PATH RESOLUTION ---
    let stepsPath = 'content.infographic.steps';
    if (slide.infographic?.steps) stepsPath = 'infographic.steps';
    else if (slide.content?.infographic?.steps) stepsPath = 'content.infographic.steps';
    else if (slide.content?.steps) stepsPath = 'content.steps';

    // Use theme chart colors or fallback to generated variations of primary/secondary
    const themeCharts = colors.chartColors || [colors.primary, colors.secondary, colors.accent];

    // Ensure we have enough colors by rotating/opacity if needed
    const getStepColor = (index: number) => {
        if (colors.chartColors && colors.chartColors.length > 0) {
            return colors.chartColors[index % colors.chartColors.length];
        }
        // Fallback generation
        const base = index % 2 === 0 ? colors.primary : colors.secondary;
        return base;
    };

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'overlay'
                        }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-12"
                >
                    <h2 className="text-5xl md:text-6xl font-bold" style={{ color: colors.text }}>
                        {slide.title}
                    </h2>
                </EditableElement>

                <div className="flex-1 flex items-center justify-center">
                    {type === 'funnel' && (
                        <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
                            {steps.slice(0, 5).map((step: any, i: number) => {
                                const widthPercent = 100 - i * 15;
                                const bgColor = getStepColor(i);
                                const textColor = getContrastColor(bgColor);
                                return (
                                    <div
                                        key={i}
                                        className="h-auto py-6 rounded-2xl flex flex-col items-center justify-center text-center transition-all shadow-lg backdrop-blur-sm bg-opacity-90 px-4"
                                        style={{
                                            width: `${widthPercent}%`,
                                            backgroundColor: bgColor,
                                            color: textColor
                                        }}
                                    >
                                        <EditableElement
                                            element={{ id: `step-${i}-label`, type: 'text', value: step.label, path: `${stepsPath}[${i}].label`, label: `Step ${i + 1} Label` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `step-${i}-label`}
                                        >
                                            <span className="text-3xl font-bold drop-shadow-md">{step.label}</span>
                                        </EditableElement>
                                        {step.description && (
                                            <EditableElement
                                                element={{ id: `step-${i}-desc`, type: 'text', value: step.description, path: `${stepsPath}[${i}].description`, label: `Step ${i + 1} Description` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `step-${i}-desc`}
                                            >
                                                <span className="text-lg opacity-90 font-medium mt-1 drop-shadow-sm" style={{ color: `${textColor}E6` }}>{step.description}</span>
                                            </EditableElement>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {type === 'process' && (
                        <div className="flex items-center gap-8 w-full justify-center flex-wrap">
                            {steps.slice(0, 5).map((step: any, i: number) => {
                                const bgColor = getStepColor(i);
                                const textColor = getContrastColor(bgColor);
                                return (
                                    <div key={i} className="flex items-center">
                                        <div
                                            className="w-64 h-64 rounded-3xl flex flex-col items-center justify-center p-6 shadow-2xl transition-transform hover:scale-105"
                                            style={{ backgroundColor: bgColor, color: textColor }}
                                        >
                                            <span className="text-5xl font-extrabold mb-3 opacity-30" style={{ color: textColor }}>{i + 1}</span>
                                            <EditableElement
                                                element={{ id: `step-${i}-label`, type: 'text', value: step.label, path: `${stepsPath}[${i}].label`, label: `Step ${i + 1} Label` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `step-${i}-label`}
                                            >
                                                <span className="text-xl text-center font-bold leading-tight mb-2">{step.label}</span>
                                            </EditableElement>
                                            {step.description && (
                                                <EditableElement
                                                    element={{ id: `step-${i}-desc`, type: 'text', value: step.description, path: `${stepsPath}[${i}].description`, label: `Step ${i + 1} Description` }}
                                                    onSelect={onSelect}
                                                    isSelected={selectedId === `step-${i}-desc`}
                                                >
                                                    <span className="text-sm text-center opacity-90 leading-tight" style={{ color: `${textColor}E6` }}>{step.description}</span>
                                                </EditableElement>
                                            )}
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div className="w-16 h-2 mx-4 opacity-20 rounded-full" style={{ backgroundColor: colors.text }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {type === 'pyramid' && (
                        <div className="flex flex-col items-center gap-6 w-full max-w-4xl">
                            {steps.slice(0, 5).reverse().map((step: any, i: number) => {
                                const count = Math.min(steps.length, 5);
                                const realIndex = count - 1 - i;
                                const widthPercent = 30 + i * 15;
                                const bgColor = getStepColor(realIndex);
                                const textColor = getContrastColor(bgColor);
                                return (
                                    <div
                                        key={i}
                                        className="h-auto py-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg transition-all hover:scale-[1.02] px-4"
                                        style={{
                                            width: `${widthPercent}%`,
                                            backgroundColor: bgColor,
                                            color: textColor
                                        }}
                                    >
                                        <EditableElement
                                            element={{ id: `step-${realIndex}-label`, type: 'text', value: step.label, path: `${stepsPath}[${realIndex}].label`, label: `Step ${realIndex + 1} Label` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `step-${realIndex}-label`}
                                        >
                                            <span className="text-2xl font-bold">{step.label}</span>
                                        </EditableElement>
                                        {step.description && (
                                            <EditableElement
                                                element={{ id: `step-${realIndex}-desc`, type: 'text', value: step.description, path: `${stepsPath}[${realIndex}].description`, label: `Step ${realIndex + 1} Description` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `step-${realIndex}-desc`}
                                            >
                                                <span className="text-base opacity-90 mt-1" style={{ color: `${textColor}E6` }}>{step.description}</span>
                                            </EditableElement>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {type === 'cycle-flow' && (
                        <div className="relative w-[500px] h-[500px] flex items-center justify-center">
                            {/* Connecting Ring */}
                            <div className="absolute inset-0 rounded-full border-[20px] border-dashed animate-spin-slow opacity-20"
                                style={{ borderColor: colors.primary }} />

                            {steps.slice(0, 6).map((step: any, i: number) => {
                                const count = Math.min(steps.length, 6);
                                const angle = (i * (360 / count)) - 90;
                                const radius = 220; // px
                                // Calculate position
                                const x = radius * Math.cos((angle * Math.PI) / 180);
                                const y = radius * Math.sin((angle * Math.PI) / 180);

                                return (
                                    <div key={i} className="absolute w-40 flex flex-col items-center text-center transform hover:scale-110 transition-transform"
                                        style={{
                                            left: `calc(50% + ${x}px)`,
                                            top: `calc(50% + ${y}px)`,
                                            transform: `translate(-50%, -50%)`
                                        }}>
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg text-2xl font-bold mb-2 z-10 relative"
                                            style={{ backgroundColor: getStepColor(i), color: getContrastColor(getStepColor(i)) }}>
                                            {i + 1}
                                            {/* Arrow */}
                                            <div className="absolute -right-4 top-1/2 -mt-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent"
                                                style={{ borderLeftColor: colors.text, opacity: 0.2, transform: `rotate(${angle + 90}deg)` }} />
                                        </div>
                                        <EditableElement
                                            element={{ id: `step-${i}-label`, type: 'text', value: step.label, path: `${stepsPath}[${i}].label`, label: `Step ${i + 1} Label` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `step-${i}-label`}
                                            className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm"
                                        >
                                            <span className="text-sm font-bold" style={{ color: colors.text }}>
                                                {step.label}
                                            </span>
                                        </EditableElement>
                                    </div>
                                );
                            })}

                            {/* Center Hub */}
                            <div className="absolute w-32 h-32 rounded-full flex items-center justify-center text-center p-4 shadow-xl z-0"
                                style={{ backgroundColor: colors.bg, border: `4px solid ${colors.primary}40` }}>
                                <span className="font-bold text-xs uppercase tracking-widest opacity-60" style={{ color: colors.text }}>CYCLE PROCESS</span>
                            </div>
                        </div>
                    )}

                    {type === 'hub-spoke' && (
                        <div className="relative w-full max-w-5xl h-[600px] flex items-center justify-center">
                            {/* Central Core */}
                            <div className="relative z-20 w-80 h-80 rounded-full bg-surface backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center text-center p-10 border-8"
                                style={{
                                    backgroundColor: `${colors.bg}F0`,
                                    borderColor: `${colors.primary}20`,
                                    boxShadow: `0 0 80px -20px ${colors.primary}40`
                                }}>
                                <EditableElement
                                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'title'}
                                >
                                    <h2 className="text-3xl font-bold leading-tight" style={{ color: colors.text }}>{slide.title}</h2>
                                </EditableElement>
                                <div className="mt-4 w-12 h-1 bg-primary rounded-full" style={{ backgroundColor: colors.primary }} />
                            </div>

                            {/* Spokes */}
                            {steps.slice(0, 6).map((step: any, i: number) => {
                                const count = Math.min(steps.length, 6);
                                const angle = (i * (360 / count)) - 90; // Start top
                                const distance = 350; // px
                                const x = distance * Math.cos((angle * Math.PI) / 180);
                                const y = distance * Math.sin((angle * Math.PI) / 180);

                                return (
                                    <React.Fragment key={i}>
                                        {/* Connecting Line */}
                                        <div className="absolute left-1/2 top-1/2 h-0.5 origin-left z-0"
                                            style={{
                                                width: `${distance - 120}px`, // distance minus half node width
                                                backgroundColor: colors.primary,
                                                opacity: 0.3,
                                                transform: `rotate(${angle}deg)`
                                            }} />

                                        {/* Node */}
                                        <div className="absolute w-64 p-6 rounded-xl bg-white shadow-lg border flex flex-col gap-2 z-10 transition-transform hover:scale-105"
                                            style={{
                                                left: `calc(50% + ${x}px)`,
                                                top: `calc(50% + ${y}px)`,
                                                transform: `translate(-50%, -50%)`,
                                                borderColor: `${colors.text}10`
                                            }}>
                                            <div className="w-10 h-10 -mt-10 mx-auto rounded-full flex items-center justify-center font-bold text-white shadow-md border-4 border-white"
                                                style={{ backgroundColor: getStepColor(i) }}>
                                                {i + 1}
                                            </div>
                                            <EditableElement
                                                element={{ id: `step-${i}-label`, type: 'text', value: step.label, path: `${stepsPath}[${i}].label`, label: `Step ${i + 1} Label` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `step-${i}-label`}
                                            >
                                                <h3 className="text-lg font-bold text-center leading-tight" style={{ color: colors.text }}>{step.label}</h3>
                                            </EditableElement>
                                            {step.description && (
                                                <EditableElement
                                                    element={{ id: `step-${i}-desc`, type: 'text', value: step.description, path: `${stepsPath}[${i}].description`, label: `Step ${i + 1} Description` }}
                                                    onSelect={onSelect}
                                                    isSelected={selectedId === `step-${i}-desc`}
                                                >
                                                    <p className="text-xs text-center opacity-60" style={{ color: colors.text }}>{step.description}</p>
                                                </EditableElement>
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={9} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
        </div>
    );
};


// Quote layout - Testimonial or key quote with beautiful styling
type QuoteVariation = 'centered-hero' | 'side-accent' | 'minimal-elegant';

const QuoteLayout = ({ slide, colors, variation = 'centered-hero', onSelect, selectedId, showPageNumber }: { slide: any; colors: any; variation?: QuoteVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    const quote = slide.quote || slide.content?.quote;
    const quoteText = quote?.text || slide.content?.text || '';
    const author = quote?.author || '';
    const role = quote?.role || '';

    // --- PATH RESOLUTION ---
    let quotePath = 'content.quote';
    if (slide.quote) quotePath = 'quote';

    // --- VARIATION 1: SIDE ACCENT (Modern Split) ---
    if (variation === 'side-accent') {
        return (
            <div className="relative w-full h-full overflow-hidden flex" style={{ backgroundColor: colors.bg }}>
                {/* Left accent bar */}
                <div className="w-2 h-full" style={{ backgroundColor: colors.primary }} />

                <div className="flex-1 flex flex-col justify-center px-20 py-16">
                    <AbstractShapes colors={colors} />

                    <div className="relative z-10 max-w-4xl">
                        <div className="text-8xl font-serif leading-none mb-6 opacity-20" style={{ color: colors.primary }}>"</div>

                        <EditableElement
                            element={{ id: 'quote-text', type: 'text', value: quoteText, path: `${quotePath}.text`, label: 'Quote Text' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'quote-text'}
                            className="mb-12"
                        >
                            <p className="text-3xl md:text-4xl font-light leading-relaxed italic" style={{ color: colors.text }}>
                                {quoteText}
                            </p>
                        </EditableElement>

                        <div className="flex items-center gap-6">
                            <div className="w-16 h-1 rounded-full" style={{ backgroundColor: colors.primary }} />
                            <div>
                                <EditableElement
                                    element={{ id: 'quote-author', type: 'text', value: author, path: `${quotePath}.author`, label: 'Author' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'quote-author'}
                                >
                                    <p className="text-xl font-bold" style={{ color: colors.text }}>{author}</p>
                                </EditableElement>
                                {role && (
                                    <EditableElement
                                        element={{ id: 'quote-role', type: 'text', value: role, path: `${quotePath}.role`, label: 'Role' }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === 'quote-role'}
                                    >
                                        <p className="text-lg opacity-60" style={{ color: colors.text }}>{role}</p>
                                    </EditableElement>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 2: MINIMAL ELEGANT ---
    if (variation === 'minimal-elegant') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col justify-center items-center p-20" style={{ backgroundColor: colors.bg }}>
                <div className="max-w-3xl text-center">
                    <EditableElement
                        element={{ id: 'quote-text', type: 'text', value: quoteText, path: `${quotePath}.text`, label: 'Quote Text' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'quote-text'}
                        className="mb-12"
                    >
                        <p className="text-2xl md:text-3xl font-serif leading-relaxed" style={{ color: colors.text }}>
                            "{quoteText}"
                        </p>
                    </EditableElement>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-0.5 mb-4" style={{ backgroundColor: colors.primary }} />
                        <EditableElement
                            element={{ id: 'quote-author', type: 'text', value: author, path: `${quotePath}.author`, label: 'Author' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'quote-author'}
                        >
                            <p className="text-lg font-bold uppercase tracking-widest" style={{ color: colors.primary }}>{author}</p>
                        </EditableElement>
                        {role && (
                            <EditableElement
                                element={{ id: 'quote-role', type: 'text', value: role, path: `${quotePath}.role`, label: 'Role' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'quote-role'}
                            >
                                <p className="text-base opacity-60" style={{ color: colors.text }}>{role}</p>
                            </EditableElement>
                        )}
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- DEFAULT: CENTERED HERO ---
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-15"
                    style={{
                        backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                        mixBlendMode: 'overlay'
                    }}
                />
            )}

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-16 py-20">
                {/* Large quotation mark */}
                <div className="text-[200px] font-serif leading-none opacity-10 absolute top-8 left-16" style={{ color: colors.primary }}>"</div>

                <div className="max-w-5xl text-center relative z-10">
                    <EditableElement
                        element={{ id: 'quote-text', type: 'text', value: quoteText, path: `${quotePath}.text`, label: 'Quote Text' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'quote-text'}
                        className="mb-16"
                    >
                        <p className="text-4xl md:text-5xl lg:text-6xl font-light leading-snug" style={{ color: colors.text }}>
                            {quoteText}
                        </p>
                    </EditableElement>

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-1 rounded-full mb-4" style={{ backgroundColor: colors.primary }} />
                        <EditableElement
                            element={{ id: 'quote-author', type: 'text', value: author, path: `${quotePath}.author`, label: 'Author' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'quote-author'}
                        >
                            <p className="text-2xl font-bold" style={{ color: colors.text }}>{author}</p>
                        </EditableElement>
                        {role && (
                            <EditableElement
                                element={{ id: 'quote-role', type: 'text', value: role, path: `${quotePath}.role`, label: 'Role' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'quote-role'}
                            >
                                <p className="text-xl opacity-70" style={{ color: colors.text }}>{role}</p>
                            </EditableElement>
                        )}
                    </div>
                </div>
            </div>

            <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
        </div>
    );
};

// Text Heavy Layout - 3 Columns with Icons
// Text Heavy Layout - 3 Columns with Visual Variants
type TextColumnVariation = 'classic' | 'modern-cards' | 'numbered-editorial' | 'side-highlight' | 'vertical-separators' | 'bento-text';

const ThreeColumnTextLayout = ({ slide, colors, variation = 'classic', onSelect, selectedId, showPageNumber }: { slide: any; colors: any; variation?: TextColumnVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    // Support AI format: content.columns with {header, body} or {title, text} objects
    let columns: Array<{ title: string; text: string }> = [];

    const sourceColumns = slide.content?.columns || slide.content?.['text-columns'];
    const quote = slide.quote || slide.content?.quote;

    if (sourceColumns?.length > 0) {
        // AI format: array of {header, body} or {title, text} or strings "Title: Body"
        columns = sourceColumns.map((col: any) => {
            if (typeof col === 'string') {
                const parts = col.split(':');
                if (parts.length > 1) {
                    return { title: parts[0].trim(), text: parts.slice(1).join(':').trim() };
                }
                return { title: '', text: col };
            }
            return {
                title: col.header || col.title || '',
                text: col.body || col.text || ''
            };
        });
    } else if (quote?.text) {
        // Support quote data as a single column for this layout
        columns = [{
            title: quote.author || '',
            text: quote.text + (quote.role ? `\n— ${quote.role}` : "")
        }];
    } else {
        // Fallback: split long text into chunks
        const content = slide.content?.text || slide.text || slide.description || "";
        const chunks = Array.isArray(content) ? content : (content || "").split('. ').reduce((acc: any[], sentence: string, i: number) => {
            if (i % 3 === 0) acc.push(sentence);
            else acc[acc.length - 1] += '. ' + sentence;
            return acc;
        }, []);

        columns = chunks.slice(0, 3).map((text: string, i: number) => ({
            title: `Point ${i + 1}`,
            text: text.trim()
        })).filter((c: any) => c.text);
    }

    // Ensure we have at least 3 columns for some layouts by filling with empty if needed (though usually we just render what we have)
    // For specific layouts like side-highlight, we really want 3 items.

    // --- PATH RESOLUTION ---
    let columnsPath = 'content.columns';
    if (slide.content?.['text-columns']) columnsPath = 'content.text-columns';

    // --- VARIATION 1: MODERN CARDS (Glassmorphism) ---
    if (variation === 'modern-cards') {
        return (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} />
                {(slide.backgroundImage || slide.imageSearchQuery) && (
                    <div className="absolute inset-0 bg-cover bg-center opacity-10"
                        style={{ backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})` }}
                    />
                )}

                <div className="relative z-10 flex flex-col px-16 py-12 h-full">
                    <div className="text-center mb-12">
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                            className="mb-4"
                        >
                            <h2 className="text-5xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                        </EditableElement>
                        {/* Optional divider line */}
                        <div className="h-1 w-24 mx-auto rounded-full" style={{ backgroundColor: colors.primary }} />
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-8 items-stretch">
                        {columns.map((col, i) => (
                            <div key={i} className="group relative p-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl transition-all hover:-translate-y-2 hover:shadow-2xl flex flex-col"
                                style={{ borderColor: `${colors.text}10`, backgroundColor: `${colors.bg}CC` }}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)` }} />

                                <div className="w-12 h-12 mb-6 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner"
                                    style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                                    {i + 1}
                                </div>
                                <EditableElement
                                    element={{ id: `col-${i}-title`, type: 'text', value: col.title, path: `${columnsPath}[${i}].title`, label: `Column ${i + 1} Title` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-${i}-title`}
                                    className="mb-4"
                                >
                                    {col.title && <h3 className="text-2xl font-bold" style={{ color: colors.text }}>{col.title}</h3>}
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `col-${i}-text`, type: 'text', value: col.text, path: `${columnsPath}[${i}].text`, label: `Column ${i + 1} Text` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-${i}-text`}
                                >
                                    <p className="text-lg leading-relaxed opacity-80" style={{ color: colors.text }}>{col.text}</p>
                                </EditableElement>
                            </div>
                        ))}
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 2: NUMBERED EDITORIAL (Big typography) ---
    if (variation === 'numbered-editorial') {
        return (
            <div className="relative w-full h-full overflow-hidden p-16 flex flex-col" style={{ backgroundColor: colors.bg }}>
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(${colors.text} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

                <div className="mb-16 border-b pb-8" style={{ borderColor: `${colors.text}20` }}>
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h2 className="text-6xl font-black tracking-tight" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-12">
                    {columns.map((col, i) => (
                        <div key={i} className="relative pt-16">
                            {/* Giant Number Background */}
                            <span className="absolute top-0 left-0 text-[180px] font-black leading-none opacity-[0.08] select-none -translate-x-4 -translate-y-8"
                                style={{ color: colors.text }}>
                                0{i + 1}
                            </span>

                            <div className="relative z-10">
                                <EditableElement
                                    element={{ id: `col-${i}-title`, type: 'text', value: col.title, path: `${columnsPath}[${i}].title`, label: `Column ${i + 1} Title` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-${i}-title`}
                                    className="mb-6"
                                >
                                    {col.title && (
                                        <h3 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.primary }}>
                                            <span className="w-2 h-8 rounded-full" style={{ backgroundColor: colors.accent }} />
                                            {col.title}
                                        </h3>
                                    )}
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `col-${i}-text`, type: 'text', value: col.text, path: `${columnsPath}[${i}].text`, label: `Column ${i + 1} Text` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-${i}-text`}
                                >
                                    <p className="text-xl leading-relaxed text-justify opacity-90 font-serif" style={{ color: colors.text }}>
                                        {col.text}
                                    </p>
                                </EditableElement>
                            </div>
                        </div>
                    ))}
                </div>
                <SlideFooter title={slide.title} colors={colors} />
            </div>
        );
    }

    // --- VARIATION 3: SIDE HIGHLIGHT (Asymmetric) ---
    if (variation === 'side-highlight') {
        const mainCol = columns[0];
        const sideCols = columns.slice(1);

        return (
            <div className="relative w-full h-full overflow-hidden flex" style={{ backgroundColor: colors.bg }}>
                {/* Left Side Highlight (50%) */}
                <div className="w-1/2 h-full p-20 flex flex-col justify-center relative overflow-hidden"
                    style={{ backgroundColor: colors.primary, color: '#ffffff' }}>
                    {/* Background Texture/Image */}
                    {(slide.backgroundImage || slide.imageSearchQuery) ? (
                        <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                            style={{ backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})` }} />
                    ) : (
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)' }} />
                    )}

                    <div className="relative z-10">
                        <span className="inline-block px-4 py-1 mb-4 rounded-full text-xs font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md">Key Insight</span>
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                            className="mb-12"
                        >
                            <h2 className="text-6xl font-bold leading-tight">{slide.title}</h2>
                        </EditableElement>
                        {mainCol && (
                            <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20">
                                <EditableElement
                                    element={{ id: `col-0-title`, type: 'text', value: mainCol.title, path: `content.columns[0].title`, label: `Main Column Title` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-0-title`}
                                    className="mb-4"
                                >
                                    {mainCol.title && <h3 className="text-3xl font-bold">{mainCol.title}</h3>}
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `col-0-text`, type: 'text', value: mainCol.text, path: `content.columns[0].text`, label: `Main Column Text` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-0-text`}
                                >
                                    <p className="text-xl leading-relaxed opacity-90">{mainCol.text}</p>
                                </EditableElement>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side Columns (50%) */}
                <div className="w-1/2 h-full p-16 flex flex-col justify-center gap-12 bg-surface">
                    {sideCols.map((col, i) => (
                        <div key={i} className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold"
                                    style={{ borderColor: colors.primary, color: colors.primary }}>
                                    {i + 2}
                                </div>
                                {i < sideCols.length - 1 && <div className="w-[2px] flex-1 bg-gray-200 mt-2" style={{ backgroundColor: `${colors.text}20` }} />}
                            </div>
                            <div>
                                <EditableElement
                                    element={{ id: `col-${i + 1}-title`, type: 'text', value: col.title, path: `content.columns[${i + 1}].title`, label: `Column ${i + 2} Title` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-${i + 1}-title`}
                                    className="mb-3"
                                >
                                    {col.title && <h3 className="text-2xl font-bold" style={{ color: colors.text }}>{col.title}</h3>}
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `col-${i + 1}-text`, type: 'text', value: col.text, path: `content.columns[${i + 1}].text`, label: `Column ${i + 2} Text` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-${i + 1}-text`}
                                >
                                    <p className="text-lg opacity-80 leading-relaxed" style={{ color: colors.text }}>{col.text}</p>
                                </EditableElement>
                            </div>
                        </div>
                    ))}
                    {sideCols.length === 0 && (
                        <div className="opacity-50 italic">Add more content to see side columns...</div>
                    )}
                </div>
                <SlideFooter title={slide.title} slideNumber={slide.index || 1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 4: VERTICAL SEPARATORS (Minimalist) ---
    if (variation === 'vertical-separators') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col px-20 pt-20 pb-24" style={{ backgroundColor: colors.bg }}>
                <div className="flex items-end justify-between mb-20 border-b pb-6" style={{ borderColor: `${colors.text}20` }}>
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h2 className="text-5xl font-light" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(d => <div key={d} className="w-2 h-2 rounded-full" style={{ backgroundColor: d === 1 ? colors.primary : `${colors.text}20` }} />)}
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-3">
                    {columns.map((col, i) => (
                        <div key={i} className={`px-10 flex flex-col justify-start h-full ${i !== 0 ? 'border-l' : ''}`}
                            style={{ borderColor: `${colors.text}10` }}>

                            <span className="text-sm font-bold tracking-[0.2em] uppercase mb-8 opacity-50 block" style={{ color: colors.secondary }}>
                                Point 0{i + 1}
                            </span>

                            <EditableElement
                                element={{ id: `col-${i}-title`, type: 'text', value: col.title, path: `${columnsPath}[${i}].title`, label: `Column ${i + 1} Title` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `col-${i}-title`}
                                className="mb-6"
                            >
                                {col.title && <h3 className="text-xl font-bold" style={{ color: colors.text }}>{col.title}</h3>}
                            </EditableElement>

                            <EditableElement
                                element={{ id: `col-${i}-text`, type: 'text', value: col.text, path: `${columnsPath}[${i}].text`, label: `Column ${i + 1} Text` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `col-${i}-text`}
                            >
                                <p className="text-lg leading-8 opacity-80" style={{ color: colors.text }}>
                                    {col.text}
                                </p>
                            </EditableElement>

                            {/* Decorative element at bottom */}
                            <div className="mt-auto pt-8 opacity-50">
                                <span className="text-2xl" style={{ color: colors.primary }}>→</span>
                            </div>
                        </div>
                    ))}
                </div>
                <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 5: BENTO TEXT (Grid) ---
    if (variation === 'bento-text') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col p-12" style={{ backgroundColor: colors.bg }}>
                {/* Header area inside the grid flow */}
                <div className="grid grid-cols-4 grid-rows-2 gap-6 h-full">
                    {/* Title Block */}
                    <div className="col-span-2 row-span-1 rounded-[2.5rem] bg-surface p-12 flex flex-col justify-between relative overflow-hidden"
                        style={{ backgroundColor: `${colors.text}08` }}>
                        <AbstractShapes colors={colors} variant="bento" />
                        <span className="relative z-10 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm self-start text-xs font-bold uppercase tracking-widest border border-white/20">
                            Overview
                        </span>
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                            className="mt-4"
                        >
                            <h2 className="relative z-10 text-5xl font-bold leading-tight" style={{ color: colors.text }}>
                                {slide.title}
                            </h2>
                        </EditableElement>
                    </div>

                    {/* Content Blocks */}
                    {columns.slice(0, 3).map((col, i) => {
                        // Dynamic sizing based on index
                        const styles = [
                            "col-span-2 row-span-2 bg-primary text-white", // Big featured block
                            "col-span-1 row-span-1 bg-surface",
                            "col-span-1 row-span-1 bg-surface"
                        ];

                        const styleClass = styles[i] || "col-span-1 row-span-1 bg-surface";
                        const isPrimary = i === 0;

                        return (
                            <div key={i} className={`${styleClass} rounded-[2.5rem] p-8 flex flex-col justify-center relative overflow-hidden transition-transform hover:scale-[1.01]`}
                                style={{
                                    backgroundColor: isPrimary ? colors.primary : `${colors.bg}`,
                                    color: isPrimary ? '#ffffff' : colors.text,
                                    border: isPrimary ? 'none' : `1px solid ${colors.text}10`,
                                    boxShadow: isPrimary ? `0 20px 40px ${colors.primary}40` : 'none'
                                }}>

                                {isPrimary && (
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                )}

                                <EditableElement
                                    element={{ id: `col-${i}-title`, type: 'text', value: col.title, path: `${columnsPath}[${i}].title`, label: `Column ${i + 1} Title` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-${i}-title`}
                                    className="mb-4"
                                >
                                    {col.title && (
                                        <h3 className={`text-2xl font-bold ${isPrimary ? 'text-white' : ''}`} style={{ color: isPrimary ? '#ffffff' : colors.text }}>
                                            {col.title}
                                        </h3>
                                    )}
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `col-${i}-text`, type: 'text', value: col.text, path: `${columnsPath}[${i}].text`, label: `Column ${i + 1} Text` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `col-${i}-text`}
                                >
                                    <p className={`text-lg leading-relaxed ${isPrimary ? 'opacity-90' : 'opacity-70'}`}>
                                        {col.text}
                                    </p>
                                </EditableElement>
                            </div>
                        );
                    })}
                </div>
                <SlideFooter title={slide.title} slideNumber={slide.index || 1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION DEFAULT: CLASSIC (Original) ---
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'overlay'
                        }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-16 text-center"
                >
                    <h2 className="text-5xl md:text-6xl font-bold" style={{ color: colors.text }}>
                        {slide.title}
                    </h2>
                </EditableElement>

                <div className="flex-1 grid grid-cols-3 gap-12">
                    {columns.map((col, i) => (
                        <div
                            key={i}
                            className="bg-surface/60 backdrop-blur-md rounded-3xl p-8 border border-border"
                            style={{ borderColor: `${colors.primary}20` }}
                        >
                            <EditableElement
                                element={{ id: `col-${i}-title`, type: 'text', value: col.title, path: `${columnsPath}[${i}].title`, label: `Column ${i + 1} Title` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `col-${i}-title`}
                                className="mb-4"
                            >
                                {col.title && (
                                    <h3 className="text-2xl font-bold" style={{ color: colors.primary }}>
                                        {col.title}
                                    </h3>
                                )}
                            </EditableElement>
                            <EditableElement
                                element={{ id: `col-${i}-text`, type: 'text', value: col.text, path: `${columnsPath}[${i}].text`, label: `Column ${i + 1} Text` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `col-${i}-text`}
                            >
                                <p className="text-lg leading-relaxed opacity-90" style={{ color: colors.text }}>
                                    {col.text}
                                </p>
                            </EditableElement>
                        </div>
                    ))}
                </div>
            </div>

            <SlideFooter title={slide.title} colors={colors} showPageNumber={showPageNumber} />
        </div >
    );
};



// Image focus layout - Hero image with overlay
// Image focus layout - Splash screens and gallery views
type ImageFocusVariation = 'default' | 'text-mask' | 'split-curtain' | 'polaroid-pile';

const ImageFocusLayout = ({ slide, colors, variation = 'default', onSelect, selectedId, showPageNumber }: { slide: any; colors: any, variation?: ImageFocusVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    // Basic shared logic
    const imageUrl = slide.backgroundImage && !slide.backgroundImage.includes('placehold') ? slide.backgroundImage :
        (slide.imageSearchQuery ? `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}` : null);

    // --- VARIATION 1: TEXT MASK (Typographic Window) ---
    if (variation === 'text-mask') {
        const bgUrl = imageUrl || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.title)}`;
        return (
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-white">
                {/* Background is actually the foreground with exclusion text, or simpler: bg clip */}
                {/* Approach: Use huge text with background-clip: text */}
                <div className="absolute inset-0 bg-black" />

                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="relative z-10"
                >
                    <h2 className="text-[12rem] md:text-[15rem] leading-[0.85] font-black text-center uppercase tracking-tighter select-none"
                        style={{
                            backgroundImage: `url(${bgUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'contrast(1.2)'
                        }}>
                        {slide.title}
                    </h2>
                </EditableElement>

                {/* Overlay subtext */}
                {(slide.subtitle || slide.content?.text) && (
                    <div className="absolute bottom-12 left-0 right-0 text-center">
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: slide.subtitle || slide.content?.text, path: slide.subtitle ? 'subtitle' : 'content.text', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                        >
                            <p className="text-white text-xl font-bold uppercase tracking-[0.5em] opacity-80 backdrop-blur-sm inline-block px-4 py-2 rounded-full border border-white/20">
                                {slide.subtitle || slide.content?.text}
                            </p>
                        </EditableElement>
                    </div>
                )}
                <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 2: SPLIT CURTAIN (Modern Overlap) ---
    if (variation === 'split-curtain') {
        return (
            <div className="relative w-full h-full overflow-hidden flex" style={{ backgroundColor: colors.bg }}>
                {/* Image Side (Left) */}
                <div className="w-1/2 h-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-110"
                        style={{
                            backgroundImage: `url(${imageUrl || `https://source.unsplash.com/800x1200/?${encodeURIComponent(slide.title)}`})`,
                            transitionDuration: '20s'
                        }} />
                    <div className="absolute inset-0 bg-black/10" />
                </div>

                {/* Text Side (Right) */}
                <div className="w-1/2 h-full flex flex-col justify-center px-16 relative">
                    <div className="w-full flex items-center justify-center p-20 relative z-10" style={{ backgroundColor: colors.bg }}>
                        <div className="max-w-xl">
                            <EditableElement
                                element={{ id: 'subtitle', type: 'text', value: slide.subtitle, path: 'subtitle', label: 'Subtitle' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'subtitle'}
                            >
                                <span className="block text-sm font-bold uppercase tracking-[0.3em] mb-8" style={{ color: colors.secondary }}>
                                    {slide.subtitle || "FEATURED"}
                                </span>
                            </EditableElement>
                            <EditableElement
                                element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'title'}
                                className="mb-8"
                            >
                                <h2 className="text-7xl font-bold leading-tight" style={{ color: colors.text }}>
                                    {slide.title}
                                </h2>
                            </EditableElement>
                            <EditableElement
                                element={{ id: 'text', type: 'text', value: slide.content?.text || slide.text, path: slide.content?.text ? 'content.text' : 'text', label: 'Text' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'text'}
                            >
                                <p className="text-xl leading-relaxed opacity-80" style={{ color: colors.text }}>
                                    {slide.content?.text || slide.text}
                                </p>
                            </EditableElement>
                        </div>
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 3: POLAROID PILE (Gallery) ---
    if (variation === 'polaroid-pile') {
        const images = slide.images || slide.content?.images || [imageUrl];
        // Ensure strictly unique images for visual flavor or fallback
        const displayImages = images.length > 0 ? images.slice(0, 5) : [imageUrl, imageUrl, imageUrl];

        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-12"
                style={{ backgroundColor: colors.surface || '#f0f0f0' }}>

                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: `radial-gradient(${colors.text} 1px, transparent 1px)`, backgroundSize: '30px 30px' }} />

                <div className="relative w-full max-w-6xl h-[600px] flex items-center justify-center">
                    {/* Scatter images */}
                    {displayImages.map((img: string, i: number) => {
                        const rotation = (i - (displayImages.length / 2)) * 8 + (Math.random() * 6 - 3);
                        const x = (i - (displayImages.length / 2)) * 40;
                        const y = Math.abs(i - (displayImages.length / 2)) * 20; // Arc

                        return (
                            <div key={i} className="absolute w-80 p-4 pb-12 bg-white shadow-2xl transform hover:scale-110 hover:z-50 error-boundary transition-all duration-500 hover:rotate-0"
                                style={{
                                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                                    zIndex: i
                                }}>
                                <div className="w-full aspect-square bg-gray-100 bg-cover bg-center mb-4 inner-shadow"
                                    style={{ backgroundImage: `url(${img || imageUrl})` }} />
                                <div className="font-handwriting text-center text-gray-600 text-lg opacity-80 min-h-[1.5em]">
                                    <EditableElement
                                        element={{ id: `polaroid-${i}-title`, type: 'text', value: `${slide.title} #${i + 1}`, path: 'title', label: `Polaroid Title ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `polaroid-${i}-title`}
                                    >
                                        {slide.title} #{i + 1}
                                    </EditableElement>
                                </div>
                            </div>
                        );
                    })}

                    {/* Optional Overlay Title if needed */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-20 z-50 bg-white px-8 py-4 shadow-xl rounded-full">
                        <EditableElement
                            element={{ id: 'overlay-title', type: 'text', value: slide.title, path: 'title', label: 'Overlay Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'overlay-title'}
                        >
                            <h2 className="text-2xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                        </EditableElement>
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- DEFAULT: HERO SPLASH ---
    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Full-bleed background image */}
            {imageUrl ? (
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${imageUrl})` }}
                />
            ) : (
                <div
                    className="absolute inset-0"
                    style={{ backgroundColor: colors.primary }}
                />
            )}

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full px-20 text-center text-white">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-8"
                >
                    <h2 className="text-7xl md:text-8xl font-bold">{slide.title}</h2>
                </EditableElement>
                {/* Subtitle */}
                <EditableElement
                    element={{ id: 'subtitle', type: 'text', value: slide.subtitle || slide.content?.subtitle, path: slide.subtitle ? 'subtitle' : 'content.subtitle', label: 'Subtitle' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'subtitle'}
                    className="mb-8"
                >
                    {(slide.subtitle || slide.content?.subtitle) && (
                        <p className="text-3xl font-light opacity-90 max-w-4xl uppercase tracking-widest">{slide.subtitle || slide.content?.subtitle}</p>
                    )}
                </EditableElement>

                {/* Main Text */}
                <EditableElement
                    element={{ id: 'text', type: 'text', value: slide.content?.text || slide.text, path: slide.content?.text ? 'content.text' : 'text', label: 'Text' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'text'}
                >
                    {(slide.content?.text || slide.text) && (
                        <p className="text-xl md:text-2xl max-w-3xl leading-relaxed opacity-90 font-serif italic">
                            "{slide.content?.text || slide.text}"
                        </p>
                    )}
                </EditableElement>
            </div>
            <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
        </div>
    );
};

// Section divider layout - Transitions between chapters
// Section divider layout - Bold typographic transitions
type SectionVariation = 'default' | 'big-number-outline' | 'minimal-bar' | 'abstract-mesh';

const SectionDividerLayout = ({ slide, colors, variation = 'default', onSelect, selectedId, showPageNumber }: { slide: any; colors: any, variation?: SectionVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {

    const sectionIndex = slide.index || 1;
    const paddedIndex = sectionIndex < 10 ? `0${sectionIndex}` : `${sectionIndex}`;

    // --- VARIATION 1: BIG NUMBER OUTLINE (Bold) ---
    if (variation === 'big-number-outline') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-20"
                style={{
                    background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.primary}10 100%)`,
                    backgroundColor: colors.bg
                }}>
                {/* Giant Outline Number */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none z-0 pointer-events-none">
                    <span className="text-[400px] font-black leading-none opacity-5"
                        style={{
                            color: 'transparent',
                            WebkitTextStroke: `4px ${colors.primary}`
                        }}>
                        {paddedIndex}
                    </span>
                </div>

                <div className="relative z-10 text-center">
                    <div className="mb-8 w-24 h-1 bg-primary mx-auto" style={{ backgroundColor: colors.accent }} />
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-6"
                    >
                        <h2 className="text-7xl font-bold tracking-tight relative" style={{ color: colors.text }}>
                            {slide.title}
                        </h2>
                    </EditableElement>
                    <EditableElement
                        element={{ id: 'subtitle', type: 'text', value: slide.subtitle, path: 'subtitle', label: 'Subtitle' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'subtitle'}
                    >
                        {slide.subtitle && (
                            <p className="text-2xl opacity-60 uppercase tracking-[0.3em]" style={{ color: colors.text }}>
                                {slide.subtitle}
                            </p>
                        )}
                    </EditableElement>
                </div>
                <SlideFooter title="" slideNumber={sectionIndex} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 2: MINIMAL BAR (Swiss Style) ---
    if (variation === 'minimal-bar') {
        return (
            <div className="relative w-full h-full overflow-hidden flex items-center bg-gray-50 p-32"
                style={{ backgroundColor: colors.bg }}>

                <div className="flex gap-16 items-start h-full relative z-10">
                    {/* Thick Bar */}
                    <div className="w-4 md:w-8 h-full rounded-full shrink-0" style={{ backgroundColor: colors.primary }} />

                    <div className="flex flex-col justify-center h-full">
                        <span className="text-xl font-bold uppercase tracking-widest mb-4 opacity-50 block" style={{ color: colors.secondary }}>
                            Part {paddedIndex}
                        </span>
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                            className="mb-8"
                        >
                            <h2 className="text-7xl md:text-8xl font-bold leading-[0.9]" style={{ color: colors.text }}>
                                {slide.title}
                            </h2>
                        </EditableElement>
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: slide.subtitle, path: 'subtitle', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                        >
                            {slide.subtitle && (
                                <p className="text-2xl md:text-3xl opacity-80 max-w-2xl font-light leading-snug" style={{ color: colors.text }}>
                                    {slide.subtitle}
                                </p>
                            )}
                        </EditableElement>
                    </div>
                </div>
                <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 3: ABSTRACT MESH (Modern) ---
    if (variation === 'abstract-mesh') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-20"
                style={{
                    backgroundColor: colors.bg,
                    backgroundImage: `radial-gradient(circle at 10% 20%, ${colors.primary} 0%, transparent 40%), 
                                  radial-gradient(circle at 90% 10%, ${colors.secondary} 0%, transparent 40%), 
                                  radial-gradient(circle at 80% 90%, ${colors.accent} 0%, transparent 40%), 
                                  radial-gradient(circle at 0% 100%, ${colors.primary} 0%, transparent 40%)`
                }}>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" />

                <div className="relative z-10 text-center border border-white/40 py-20 px-16 max-w-5xl bg-white/20 backdrop-blur-md rounded-[3rem] shadow-2xl">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-6"
                    >
                        <h2 className="text-6xl md:text-8xl font-black text-white drop-shadow-sm leading-tight mix-blend-hard-light"
                            style={{ color: colors.text }}>
                            {slide.title}
                        </h2>
                    </EditableElement>
                    <EditableElement
                        element={{ id: 'subtitle', type: 'text', value: slide.subtitle, path: 'subtitle', label: 'Subtitle' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'subtitle'}
                    >
                        {slide.subtitle && (
                            <p className="text-2xl opacity-90 font-medium tracking-wide" style={{ color: colors.text }}>
                                {slide.subtitle}
                            </p>
                        )}
                    </EditableElement>
                </div>
                <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- DEFAULT: CENTERED SIMPLE ---
    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white"
            style={{ backgroundColor: colors.primary }}>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(45deg, ${colors.secondary}, transparent)` }} />
            <div className="relative z-10 text-center px-12">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-6"
                >
                    <h2 className="text-7xl font-bold">{slide.title}</h2>
                </EditableElement>
                <div className="w-32 h-2 bg-white mx-auto rounded-full mb-8" />
                <EditableElement
                    element={{ id: 'subtitle', type: 'text', value: slide.subtitle, path: 'subtitle', label: 'Subtitle' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'subtitle'}
                >
                    <p className="text-2xl opacity-80">{slide.subtitle}</p>
                </EditableElement>
            </div>
            <SlideFooter title={slide.title} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
        </div>
    );
};


// Bento Grid Layout - Modern CSS Grid features
type BentoVariation = 'default' | 'magazine-grid' | 'feature-focus' | 'asymmetric-masonry';

const BentoGridLayout = ({ slide, colors, variation = 'default', onSelect, selectedId, showPageNumber }: { slide: any; colors: any, variation?: BentoVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    const items = slide.content?.items || slide.items || [];
    // Ensure we have at least 3 items to look good, max 5 for this specific layout
    const displayItems = items.slice(0, 5);

    // --- PATH RESOLUTION ---
    let itemsPath = 'content.items';
    if (slide.items) itemsPath = 'items';
    else if (slide.content?.items) itemsPath = 'content.items';

    // --- VARIATION 1: MAGAZINE GRID (Editorial) ---
    if (variation === 'magazine-grid') {
        const mainItem = displayItems[0];
        const sideItems = displayItems.slice(1);

        return (
            <div className="relative w-full h-full overflow-hidden p-12" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} variant="bento" />
                <div className="relative z-10 w-full h-full grid grid-cols-12 gap-8">
                    {/* Main Story Block (Left) */}
                    <div className="col-span-7 h-full rounded-[2.5rem] relative overflow-hidden group shadow-2xl"
                        style={{ backgroundColor: colors.text }}>
                        {/* Image */}
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                            style={{ backgroundImage: `url(${mainItem?.image || slide.backgroundImage || `https://source.unsplash.com/800x1200/?${encodeURIComponent(mainItem?.title || slide.title || 'editorial')}`})` }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        <div className="absolute bottom-0 left-0 p-12 w-full">
                            <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest mb-6 border border-white/20">
                                Cover Story
                            </span>
                            <EditableElement
                                element={{ id: 'main-title', type: 'text', value: mainItem?.title || slide.title, path: items.length > 0 ? `${itemsPath}[0].title` : 'title', label: 'Main Title' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'main-title'}
                                className="mb-6"
                            >
                                <h2 className="text-5xl font-bold text-white leading-tight">
                                    {mainItem?.title || slide.title}
                                </h2>
                            </EditableElement>
                            <EditableElement
                                element={{ id: 'main-desc', type: 'text', value: mainItem?.description || slide.content?.description, path: items.length > 0 ? `${itemsPath}[0].description` : 'content.description', label: 'Main Description' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'main-desc'}
                            >
                                <p className="text-xl text-white/80 line-clamp-3 leading-relaxed max-w-2xl">
                                    {mainItem?.description || slide.content?.description || "Detailed analysis of the key trends shaping this narrative."}
                                </p>
                            </EditableElement>
                        </div>
                    </div>

                    {/* Side Stories (Right) */}
                    <div className="col-span-5 grid grid-cols-1 grid-rows-4 gap-6 h-full">
                        {/* Header for list */}
                        <div className="row-span-1 flex flex-col justify-end pb-4 border-b" style={{ borderColor: `${colors.text}20` }}>
                            <span className="text-sm font-bold uppercase tracking-widest opacity-60" style={{ color: colors.text }}>Related Topics</span>
                        </div>

                        {sideItems.map((item: any, i: number) => (
                            <div key={i} className="row-span-1 flex gap-6 items-center p-4 rounded-2xl hover:bg-black/5 transition-colors group cursor-pointer"
                                style={{ backgroundColor: `${colors.bg}` }}>
                                <div className="w-24 h-24 rounded-xl bg-cover bg-center shrink-0 shadow-md transform group-hover:scale-105 transition-transform duration-500"
                                    style={{ backgroundImage: `url(${item.image || `https://source.unsplash.com/200x200/?${encodeURIComponent(item.title || 'abstract')}`})` }} />
                                <div className="flex-1 min-w-0">
                                    <EditableElement
                                        element={{ id: `side-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i + 1}].title`, label: `Side Item ${i + 1} Title` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `side-${i}-title`}
                                        className="mb-2"
                                    >
                                        <h3 className="text-xl font-bold truncate group-hover:text-primary transition-colors" style={{ color: colors.text }}>{item.title}</h3>
                                    </EditableElement>
                                    <EditableElement
                                        element={{ id: `side-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i + 1}].description`, label: `Side Item ${i + 1} Description` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `side-${i}-desc`}
                                    >
                                        <p className="text-sm opacity-60 line-clamp-2 leading-relaxed" style={{ color: colors.text }}>{item.description}</p>
                                    </EditableElement>
                                </div>
                                <div className="w-10 h-10 rounded-full border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: colors.primary, color: colors.primary }}>
                                    →
                                </div>
                            </div>
                        ))}
                        {/* Fill if not enough items */}
                        {sideItems.length < 3 && (
                            <div className="row-span-1 flex items-center justify-center italic opacity-40">
                                More stories coming soon...
                            </div>
                        )}
                    </div>
                </div>
                <SlideFooter title={slide.title} slideNumber={8} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 2: FEATURE FOCUS (Hub & Spoke) ---
    if (variation === 'feature-focus') {
        const centerItem = displayItems[0];
        const satellites = displayItems.slice(1, 5); // Max 4 satellites

        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-12" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} variant="bento" />

                <div className="relative z-10 w-full max-w-7xl h-full flex items-center justify-center">
                    {/* Background Ring */}
                    <div className="absolute w-[800px] h-[800px] border-[1px] opacity-10 rounded-full animate-spin-slow"
                        style={{ borderColor: colors.text, borderStyle: 'dashed' }} />

                    <div className="grid grid-cols-3 gap-8 w-full items-center">
                        {/* Left Column Satellites */}
                        <div className="flex flex-col gap-24 h-full justify-center">
                            {satellites.slice(0, 2).map((item: any, i: number) => (
                                <div key={i} className="text-right group transform hover:-translate-x-2 transition-transform">
                                    <EditableElement
                                        element={{ id: `left-sat-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i + 1}].title`, label: `Left Item ${i + 1} Title` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `left-sat-${i}-title`}
                                        className="mb-2"
                                    >
                                        <h3 className="text-2xl font-bold" style={{ color: colors.text }}>{item.title}</h3>
                                    </EditableElement>
                                    <EditableElement
                                        element={{ id: `left-sat-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i + 1}].description`, label: `Left Item ${i + 1} Description` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `left-sat-${i}-desc`}
                                        className="mb-4"
                                    >
                                        <p className="text-sm opacity-70" style={{ color: colors.text }}>{item.description}</p>
                                    </EditableElement>
                                    <div className="h-[1px] w-full bg-gradient-to-l from-current to-transparent opacity-30" style={{ color: colors.primary }} />
                                </div>
                            ))}
                        </div>

                        {/* Center Hero */}
                        <div className="h-[500px] rounded-[3rem] shadow-2xl relative overflow-hidden z-20 transform hover:scale-105 transition-transform duration-700 bg-white"
                            style={{ boxShadow: `0 25px 50px -12px ${colors.primary}40` }}>
                            <img src={centerItem?.image || slide.backgroundImage || `https://source.unsplash.com/800x1000/?${encodeURIComponent(centerItem?.title || slide.title || 'product')}`}
                                className="w-full h-full object-cover" alt="" />
                            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md p-8 text-center"
                                style={{ backgroundColor: `${colors.bg}E6` }}>
                                <EditableElement
                                    element={{ id: 'center-title', type: 'text', value: centerItem?.title || slide.title, path: items.length > 0 ? 'content.items[0].title' : 'title', label: 'Center Title' }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === 'center-title'}
                                    className="mb-2"
                                >
                                    <h2 className="text-3xl font-black uppercase tracking-tight" style={{ color: colors.text }}>{centerItem?.title || slide.title}</h2>
                                </EditableElement>
                                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-widest"
                                    style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                                    Feature Spotlight
                                </span>
                            </div>
                        </div>

                        {/* Right Column Satellites */}
                        <div className="flex flex-col gap-24 h-full justify-center">
                            {satellites.slice(2, 4).map((item: any, i: number) => (
                                <div key={i} className="text-left group transform hover:translate-x-2 transition-transform">
                                    <EditableElement
                                        element={{ id: `right-sat-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i + 3}].title`, label: `Right Item ${i + 1} Title` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `right-sat-${i}-title`}
                                        className="mb-2"
                                    >
                                        <h3 className="text-2xl font-bold" style={{ color: colors.text }}>{item.title}</h3>
                                    </EditableElement>
                                    <EditableElement
                                        element={{ id: `right-sat-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i + 3}].description`, label: `Right Item ${i + 1} Description` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `right-sat-${i}-desc`}
                                    >
                                        <p className="text-sm opacity-70" style={{ color: colors.text }}>{item.description}</p>
                                    </EditableElement>
                                    <div className="h-[1px] w-full bg-gradient-to-r from-current to-transparent opacity-30" style={{ color: colors.primary }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <SlideFooter title={slide.title} slideNumber={8} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 3: ASYMMETRIC MASONRY (Pinterest) ---
    if (variation === 'asymmetric-masonry') {
        const isThreeItems = displayItems.length === 3;

        // Generate random-looking heights for a pinterest effect deterministically
        const getSpan = (idx: number) => {
            if (isThreeItems) return idx === 0 ? 'row-span-2' : 'row-span-1';

            const patterns = [
                'row-span-2', 'row-span-1', 'row-span-1',
                'row-span-1', 'row-span-2'
            ];
            return patterns[idx % patterns.length];
        };

        const gridClass = isThreeItems ? "grid-cols-2 grid-rows-2" : "grid-cols-4 grid-rows-3";

        return (
            <div className="relative w-full h-full overflow-hidden p-16 flex flex-col" style={{ backgroundColor: colors.bg }}>
                <div className="flex justify-between items-end mb-12 shrink-0">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h2 className="text-5xl font-bold leading-tight" style={{ color: colors.text }}>
                            {slide.title}
                        </h2>
                    </EditableElement>
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                        <div className="w-3 h-3 rounded-full opacity-50" style={{ backgroundColor: colors.primary }} />
                        <div className="w-3 h-3 rounded-full opacity-20" style={{ backgroundColor: colors.primary }} />
                    </div>
                </div>

                <div className={`grid ${gridClass} gap-6 flex-1 min-h-0`}>
                    {displayItems.map((item: any, i: number) => {
                        const spanClass = getSpan(i);
                        const isTall = spanClass === 'row-span-2';

                        return (
                            <div key={i} className={`relative rounded-3xl overflow-hidden group shadow-lg ${spanClass} transition-all hover:-translate-y-1 hover:shadow-xl`}
                                style={{ backgroundColor: colors.surface || '#f5f5f5' }}>
                                <img src={item.image || `https://picsum.photos/seed/${i + (slide.title || 'default')}/600/${isTall ? '800' : '400'}`}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />

                                <div className="absolute inset-0 p-6 flex flex-col justify-end group-hover:justify-center transition-all duration-500 z-10">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:via-black/80 group-hover:to-black/80 transition-all duration-500 -z-10" />

                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                        <EditableElement
                                            element={{ id: `mesonry-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Item ${i + 1} Title` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `mesonry-${i}-title`}
                                            className="mb-3"
                                        >
                                            <h3 className="text-white text-3xl md:text-4xl font-black shadow-md leading-tight">{item.title}</h3>
                                        </EditableElement>
                                        <EditableElement
                                            element={{ id: `mesonry-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i}].description`, label: `Item ${i + 1} Description` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `mesonry-${i}-desc`}
                                        >
                                            <p className="text-white/90 text-lg md:text-xl font-medium leading-relaxed line-clamp-4 shadow-sm">
                                                {item.description}
                                            </p>
                                        </EditableElement>
                                    </div>
                                </div>

                                {/* Number badge - Move to z-20 to stay on top */}
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xs font-bold border border-white/20 z-20">
                                    {i + 1}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <SlideFooter title={slide.title} slideNumber={8} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- DEFAULT: CLASSIC BENTO ---
    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} variant="bento" />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-20"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'overlay'
                        }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col px-16 py-12 h-full">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-8"
                >
                    <h2 className="text-5xl font-bold" style={{ color: colors.text }}>
                        {slide.title}
                    </h2>
                </EditableElement>

                <div className="flex-1 grid grid-cols-6 grid-rows-2 gap-6">
                    {displayItems.map((item: any, i: number) => {
                        // Dynamic spanning logic for bento feel
                        // Make first item large (left side), others stacked on right
                        const isLarge = i === 0;
                        // For a 6-col grid:
                        // Large item takes 3 cols (half width) and 2 rows (full height)
                        // Other items take 3 cols (half width) and 1 row
                        const colSpan = "col-span-3";
                        const rowSpan = isLarge ? "row-span-2" : "row-span-1";

                        // Use provided image or fallback to Unsplash based on content
                        const searchQuery = item.title || slide.title || 'technology';
                        const imgSrc = item.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)}`;

                        return (
                            <div
                                key={i}
                                className={`${colSpan} ${rowSpan} group relative rounded-3xl overflow-hidden transition-all hover:scale-[1.02] border shadow-lg`}
                                style={{
                                    borderColor: `${colors.text}20`,
                                }}
                            >
                                {/* Background Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                    style={{ backgroundImage: `url(${imgSrc})` }}
                                />

                                {/* Dark Gradient Overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

                                {/* Content */}
                                <div className="relative z-10 h-full p-8 flex flex-col justify-end">
                                    <div className="flex items-center justify-between mb-2">
                                        {/* Value/Number if available */}
                                        {item.value ? (
                                            <span className="text-3xl font-bold text-white shadow-sm">{item.value}</span>
                                        ) : (
                                            <div className="w-8 h-1 rounded-full bg-white/40 mb-4" />
                                        )}
                                    </div>

                                    <div>
                                        <EditableElement
                                            element={{ id: `mesonry-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Item ${i + 1} Title` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `mesonry-${i}-title`}
                                            className="mb-3"
                                        >
                                            <h3 className="text-2xl lg:text-3xl font-bold text-white shadow-md leading-tight">
                                                {item.title}
                                            </h3>
                                        </EditableElement>
                                        <EditableElement
                                            element={{ id: `mesonry-${i}-desc`, type: 'text', value: item.description, path: `content.items[${i}].description`, label: `Item ${i + 1} Description` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `mesonry-${i}-desc`}
                                        >
                                            {item.description && (
                                                <p className="text-lg text-white/90 leading-relaxed font-medium shadow-sm line-clamp-3">
                                                    {item.description}
                                                </p>
                                            )}
                                        </EditableElement>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <SlideFooter title={slide.title} slideNumber={8} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
        </div>
    );
};

// Product Showcase Layout - Tech focused
type ShowcaseVariation = 'default' | 'lifestyle-split' | 'app-mockup' | 'exploded-view';

const ProductShowcaseLayout = ({ slide, colors, variation = 'default', onSelect, selectedId, showPageNumber }: { slide: any; colors: any, variation?: ShowcaseVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    const items = slide.content?.items || slide.items || [];
    // Ensure we have an image
    const mainImage = slide.backgroundImage || (slide.imageSearchQuery ? `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}` : null);

    // --- PATH RESOLUTION ---
    let itemsPath = 'content.items';
    if (slide.items) itemsPath = 'items';
    else if (slide.content?.items) itemsPath = 'content.items';

    // --- VARIATION 1: LIFESTYLE SPLIT (Emotional) ---
    if (variation === 'lifestyle-split') {
        return (
            <div className="relative w-full h-full overflow-hidden flex" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} variant="modern" />
                {/* Left Image Side (60%) */}
                <div className="w-[60%] h-full relative overflow-hidden group">
                    {mainImage ? (
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                            style={{ backgroundImage: `url(${mainImage})` }} />
                    ) : (
                        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute inset-0 bg-black/20" />

                    {/* Overlay Title on Image */}
                    <div className="absolute bottom-16 left-16 max-w-lg text-white">
                        <span className="inline-block px-3 py-1 mb-4 border border-white/30 rounded-full text-xs uppercase tracking-[0.2em] backdrop-blur-sm">
                            Lifestyle Collection
                        </span>
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                        >
                            <h2 className="text-6xl font-bold leading-none mb-4">{slide.title}</h2>
                        </EditableElement>
                    </div>
                </div>

                {/* Right Content Side (40%) */}
                <div className="w-[40%] h-full p-16 flex flex-col justify-center relative bg-white/5 backdrop-blur-sm">
                    <EditableElement
                        element={{ id: 'subtitle', type: 'text', value: slide.subtitle, path: 'subtitle', label: 'Subtitle' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'subtitle'}
                        className="mb-12"
                    >
                        {slide.subtitle && (
                            <p className="text-xl opacity-80 font-light leading-relaxed" style={{ color: colors.text }}>
                                {slide.subtitle}
                            </p>
                        )}
                    </EditableElement>

                    <div className="space-y-8">
                        {items.slice(0, 3).map((item: any, i: number) => (
                            <div key={i} className="group cursor-pointer">
                                <div className="flex items-center justify-between mb-2 border-b pb-2 transition-colors duration-300"
                                    style={{ borderColor: `${colors.text}20` }}>
                                    <EditableElement
                                        element={{ id: `item-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Item ${i + 1} Title` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `item-${i}-title`}
                                    >
                                        <h3 className="text-xl font-bold group-hover:translate-x-2 transition-transform"
                                            style={{ color: colors.text }}>
                                            {item.title}
                                        </h3>
                                    </EditableElement>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.primary }}>→</span>
                                </div>
                                <EditableElement
                                    element={{ id: `item-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i}].description`, label: `Item ${i + 1} Description` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `item-${i}-desc`}
                                >
                                    <p className="text-sm opacity-60 pl-4 border-l-2 border-transparent group-hover:border-current transition-all"
                                        style={{ color: colors.text, borderColor: 'transparent' }}>
                                        {item.description}
                                    </p>
                                </EditableElement>
                            </div>
                        ))}
                    </div>
                </div>
                <SlideFooter title={slide.title} slideNumber={9} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 2: APP MOCKUP (SaaS/Digital) ---
    if (variation === 'app-mockup') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col p-12"
                style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.primary}10 100%)` }}>
                <div className="text-center mb-8 relative z-10">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: colors.text }}>
                        Platform Overview
                    </span>
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mt-2"
                    >
                        <h2 className="text-4xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                    </EditableElement>
                </div>

                <div className="flex-1 flex items-center justify-center w-full max-w-7xl mx-auto relative z-10">
                    {/* Left Features */}
                    <div className="w-1/4 flex flex-col gap-12 items-end text-right pr-8">
                        {items.slice(0, 2).map((item: any, i: number) => (
                            <div key={i} className="group">
                                <div className="w-12 h-12 mb-4 ml-auto rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: colors.surface || 'white', color: colors.primary }}>
                                    {i + 1}
                                    {i + 1}
                                </div>
                                <EditableElement
                                    element={{ id: `left-item-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Left Item ${i + 1} Title` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `left-item-${i}-title`}
                                    className="mb-1"
                                >
                                    <h3 className="text-lg font-bold" style={{ color: colors.text }}>{item.title}</h3>
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `left-item-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i}].description`, label: `Left Item ${i + 1} Description` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `left-item-${i}-desc`}
                                >
                                    <p className="text-sm opacity-60" style={{ color: colors.text }}>{item.description}</p>
                                </EditableElement>
                            </div>
                        ))}
                    </div>

                    {/* Central Device Frame */}
                    <div className="w-1/2 flex justify-center px-4">
                        <div className="relative w-[300px] h-[600px] md:w-[600px] md:h-[400px] bg-gray-900 rounded-[2rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden ring-4 ring-black/10">
                            {/* Screen Content */}
                            <div className="w-full h-full bg-white overflow-hidden relative group">
                                {mainImage ? (
                                    <img src={mainImage} className="w-full h-full object-cover" alt="App Screen" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 font-mono text-xs">
                                        Interactive_Dashboard_v2.0
                                    </div>
                                )}
                                {/* Glossy reflection */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                            </div>
                            {/* Camera notch/island if needed, generic for now */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20" />
                        </div>
                    </div>

                    {/* Right Features */}
                    <div className="w-1/4 flex flex-col gap-12 items-start text-left pl-8">
                        {items.slice(2, 4).map((item: any, i: number) => (
                            <div key={i} className="group">
                                <div className="w-12 h-12 mb-4 mr-auto rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: colors.surface || 'white', color: colors.primary }}>
                                    {i + 3}
                                    {i + 3}
                                </div>
                                <EditableElement
                                    element={{ id: `right-item-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i + 2}].title`, label: `Right Item ${i + 1} Title` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `right-item-${i}-title`}
                                    className="mb-1"
                                >
                                    <h3 className="text-lg font-bold" style={{ color: colors.text }}>{item.title}</h3>
                                </EditableElement>
                                <EditableElement
                                    element={{ id: `right-item-${i}-desc`, type: 'text', value: item.description, path: `${itemsPath}[${i + 2}].description`, label: `Right Item ${i + 1} Description` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `right-item-${i}-desc`}
                                >
                                    <p className="text-sm opacity-60" style={{ color: colors.text }}>{item.description}</p>
                                </EditableElement>
                            </div>
                        ))}
                    </div>
                </div>
                <SlideFooter title={slide.title} slideNumber={9} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 3: EXPLODED VIEW (Technical) ---
    // (This replaces the old default but enhanced)
    if (variation === 'exploded-view' || variation === 'default') {
        return (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
                {/* Technical Grid Background */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `linear-gradient(${colors.text} 1px, transparent 1px), linear-gradient(90deg, ${colors.text} 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                <div className="relative z-10 flex flex-col h-full px-16 py-12">
                    <div className="text-center mb-12">
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                            className="mb-4"
                        >
                            <h2 className="text-5xl font-bold uppercase tracking-widest" style={{ color: colors.primary }}>
                                {slide.title}
                            </h2>
                        </EditableElement>
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: slide.subtitle, path: 'subtitle', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                        >
                            {slide.subtitle && (
                                <p className="text-xl opacity-80" style={{ color: colors.text }}>{slide.subtitle}</p>
                            )}
                        </EditableElement>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center perspective-[2000px]">
                        {/* Orbit Circles */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[500px] h-[500px] border border-dashed rounded-full animate-spin-slow opacity-20" style={{ borderColor: colors.text }} />
                            <div className="w-[700px] h-[700px] border border-dotted rounded-full animate-[spin_60s_linear_infinite_reverse] opacity-10" style={{ borderColor: colors.text }} />
                        </div>

                        {/* Central Product */}
                        <div className="w-[600px] h-[400px] rounded-2xl relative z-20 shadow-2xl rotate-x-12 hover:rotate-0 transition-transform duration-700 ease-out border-2 bg-cover bg-center"
                            style={{
                                backgroundColor: colors.bg,
                                borderColor: colors.primary,
                                boxShadow: `0 20px 60px -10px ${colors.primary}40`,
                                backgroundImage: mainImage ? `url(${mainImage})` : undefined
                            }}>
                            {!mainImage && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-4xl font-mono opacity-50" style={{ color: colors.primary }}>PRODUCT_CORE</span>
                                </div>
                            )}
                        </div>

                        {/* Floating Features (Orbiting) */}
                        <div className="absolute inset-0 z-30 pointer-events-none">
                            {items.slice(0, 4).map((item: any, i: number) => {
                                // Specific positions for orbit effect
                                const positions = [
                                    'top-[10%] left-[15%]',
                                    'top-[10%] right-[15%]',
                                    'bottom-[15%] left-[15%]',
                                    'bottom-[15%] right-[15%]'
                                ];
                                return (
                                    <div key={i} className={`absolute ${positions[i]} w-64 pointer-events-auto transform hover:scale-110 transition-transform duration-300`}>
                                        <div className="flex flex-col p-4 rounded-xl backdrop-blur-md border shadow-lg bg-white/50"
                                            style={{ borderColor: `${colors.primary}40` }}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                    style={{ backgroundColor: colors.primary }}>
                                                    {i + 1}
                                                </div>
                                                <EditableElement
                                                    element={{ id: `orbit-item-${i}-title`, type: 'text', value: item.title, path: `${itemsPath}[${i}].title`, label: `Item ${i + 1} Title` }}
                                                    onSelect={onSelect}
                                                    isSelected={selectedId === `orbit-item-${i}-title`}
                                                >
                                                    <h4 className="font-bold text-sm uppercase tracking-wider" style={{ color: colors.text }}>{item.title}</h4>
                                                </EditableElement>
                                            </div>
                                            <EditableElement
                                                element={{ id: `orbit-item-${i}-desc`, type: 'text', value: item.description || item.value, path: item.description ? `content.items[${i}].description` : `content.items[${i}].value`, label: `Item ${i + 1} Description` }}
                                                onSelect={onSelect}
                                                isSelected={selectedId === `orbit-item-${i}-desc`}
                                            >
                                                <p className="text-xs opacity-80 leading-relaxed" style={{ color: colors.text }}>
                                                    {item.description || item.value || "Technical specification details."}
                                                </p>
                                            </EditableElement>
                                        </div>
                                        {/* Connector Line */}
                                        <div className={`absolute w-full h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-30 ${i < 2 ? 'top-full mt-4' : 'bottom-full mb-4'}`}
                                            style={{ color: colors.primary }} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <SlideFooter title={slide.title} slideNumber={9} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    return null;
};

// ============================================
// MASTER CONTENT LAYOUT - THE VARIATION ENGINE
// ============================================
// Supports: Classic, Split Card, Hero Block, Minimal Offset, Magazine
type MasterVariation = 'classic' | 'split-card' | 'hero-block' | 'minimal-offset' | 'magazine';

const MasterContentLayout = ({ slide, colors, variation = 'classic', onSelect, selectedId, showPageNumber }: { slide: any; colors: any; variation?: MasterVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    // Determine content
    const bullets = slide.bullets || slide.content?.bullets || [];
    const text = slide.text || slide.content?.text || slide.content?.description;
    const hasImage = !!(slide.backgroundImage || slide.imageSearchQuery);
    const imageSrc = slide.backgroundImage || (slide.imageSearchQuery ? `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}` : null);

    // --- VARIATION 1: CLASSIC (Standard text left, image right) ---
    if (variation === 'classic') {
        return (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} />
                <div className="relative z-10 grid grid-cols-2 h-full">
                    <div className="p-20 flex flex-col justify-center">
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                            className="mb-8"
                        >
                            <h2 className="text-5xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                        </EditableElement>

                        {text && (
                            <EditableElement
                                element={{ id: 'text', type: 'text', value: text, path: slide.text ? 'text' : (slide.content?.description ? 'content.description' : 'content.text'), label: 'Body Text' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'text'}
                                className="mb-6"
                            >
                                <p className="text-xl opacity-90" style={{ color: colors.text }}>{text}</p>
                            </EditableElement>
                        )}

                        <ul className="space-y-4">
                            {bullets.map((b: string, i: number) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full mt-3 flex-shrink-0" style={{ backgroundColor: colors.primary }} />
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: slide.bullets ? `bullets[${i}]` : `content.bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <span className="text-lg" style={{ color: colors.text }}>{b}</span>
                                    </EditableElement>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="p-12 pl-0 flex items-center justify-center">
                        {imageSrc ? (
                            <img src={imageSrc} className="w-full h-5/6 object-cover rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-all" alt={slide.title} />
                        ) : (
                            <div className="w-full h-5/6 rounded-3xl opacity-10" style={{ backgroundColor: colors.primary }} />
                        )}
                    </div>
                </div>
                <SlideFooter title={slide.title} slideNumber={2} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 2: SPLIT CARD (Floating card on minimal bg) ---
    if (variation === 'split-card') {
        return (
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center p-20" style={{ backgroundColor: colors.bg }}>
                {/* Background wash */}
                <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.primary}20 100%)` }} />

                <div className="relative z-10 w-full max-w-6xl h-5/6 rounded-[3rem] shadow-2xl overflow-hidden flex bg-white/80 backdrop-blur-xl border border-white/20">
                    {/* Image Side */}
                    <div className="w-2/5 relative">
                        {imageSrc && <img src={imageSrc} className="absolute inset-0 w-full h-full object-cover" alt="" />}
                        <div className="absolute inset-0 mix-blend-multiply opacity-40" style={{ backgroundColor: colors.primary }} />
                    </div>
                    {/* Content Side */}
                    <div className="w-3/5 p-16 flex flex-col justify-center">
                        <span className="text-sm font-bold tracking-widest uppercase mb-4 opacity-50" style={{ color: '#000000' }}>KEY INSIGHTS</span>
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                        >
                            <h2 className="text-4xl font-bold mb-8" style={{ color: '#000000' }}>{slide.title}</h2>
                        </EditableElement>
                        <ul className="space-y-6">
                            {bullets.map((b: string, i: number) => (
                                <li key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-black/5 transition-colors">
                                    <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg" style={{ backgroundColor: colors.secondary, color: '#ffffff' }}>{i + 1}</span>
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <span className="text-lg font-medium opacity-80" style={{ color: '#000000' }}>{b}</span>
                                    </EditableElement>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <SlideFooter title={slide.title} slideNumber={2} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // --- VARIATION 3: HERO BLOCK (Image top, cards bottom) ---
    if (variation === 'hero-block') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col" style={{ backgroundColor: colors.bg }}>
                <div className="h-1/2 relative w-full overflow-hidden">
                    {imageSrc && <img src={imageSrc} className="w-full h-full object-cover" alt="" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-16">
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                        >
                            <h2 className="text-6xl font-bold shadow-sm" style={{ color: '#ffffff' }}>{slide.title}</h2>
                        </EditableElement>
                    </div>
                </div>
                <div className="flex-1 p-12 grid grid-cols-3 gap-8 items-start">
                    {bullets.slice(0, 3).map((b: string, i: number) => (
                        <div key={i} className="p-8 rounded-2xl border h-full" style={{ borderColor: `${colors.text}20`, backgroundColor: `${colors.bg}` }}>
                            <div className="w-12 h-1 h-1 mb-6" style={{ backgroundColor: colors.accent }} />
                            <EditableElement
                                element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `bullet-${i}`}
                            >
                                <p className="text-xl leading-relaxed" style={{ color: colors.text }}>{b}</p>
                            </EditableElement>
                        </div>
                    ))}
                </div>
                <SlideFooter title={slide.title} slideNumber={3} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 4: MAGAZINE (Typography focused) ---
    if (variation === 'magazine') {
        return (
            <div className="relative w-full h-full overflow-hidden p-16 flex flex-col" style={{ backgroundColor: colors.bg }}>
                <div className="w-full border-t-4 mb-12" style={{ borderColor: colors.primary }} />
                <div className="flex-1 grid grid-cols-12 gap-12">
                    <div className="col-span-5 flex flex-col">
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                        >
                            <h2 className="text-7xl font-black leading-tight mb-8" style={{ color: colors.text }}>
                                {(slide.title || 'Untitled').split(' ').map((word: string, i: number) => (
                                    <span key={i} className="block">{word}</span>
                                ))}
                            </h2>
                        </EditableElement>

                        {(slide.subtitle || slide.content?.subtitle) && (
                            <EditableElement
                                element={{ id: 'subtitle', type: 'text', value: slide.subtitle || slide.content?.subtitle, path: slide.subtitle ? 'subtitle' : 'content.subtitle', label: 'Subtitle' }}
                                onSelect={onSelect}
                                isSelected={selectedId === 'subtitle'}
                                className="mb-8"
                            >
                                <p className="text-2xl font-light italic opacity-80" style={{ color: colors.text }}>
                                    {slide.subtitle || slide.content?.subtitle}
                                </p>
                            </EditableElement>
                        )}

                        <p className="text-lg opacity-60 mt-auto" style={{ color: colors.text }}>ISSUE 01 • {new Date().getFullYear()}</p>
                    </div>
                    <div className="col-span-7 relative">
                        {imageSrc && (
                            <div className="absolute right-0 top-0 w-3/4 h-3/4 z-0 opacity-20 filter grayscale">
                                <img src={imageSrc} className="w-full h-full object-cover rounded-full" alt="" />
                            </div>
                        )}
                        <div className="relative z-10 space-y-8 mt-12">
                            {bullets.map((b: string, i: number) => (
                                <div key={i} className="flex gap-6 border-b pb-6" style={{ borderColor: `${colors.text}20` }}>
                                    <span className="text-4xl font-serif italic opacity-30" style={{ color: colors.secondary }}>0{i + 1}</span>
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <p className="text-2xl font-medium pt-2" style={{ color: colors.text }}>{b}</p>
                                    </EditableElement>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <SlideFooter title={slide.title} slideNumber={3} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // --- VARIATION 5: MINIMAL OFFSET (Clean, whitespace) ---
    return (
        <div className="relative w-full h-full overflow-hidden bg-white" style={{ backgroundColor: colors.bg }}>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10" style={{ backgroundColor: colors.primary }} />
            <div className="absolute w-32 h-32 rounded-full -top-16 -left-16 blur-2xl opacity-20" style={{ backgroundColor: colors.accent }} />

            <div className="relative z-10 h-full p-24 flex flex-col justify-center max-w-5xl">
                <span className="text-sm tracking-[0.3em] font-bold uppercase mb-6" style={{ color: colors.secondary }}>Overview</span>
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-16"
                >
                    <h2 className="text-5xl font-light leading-tight" style={{ color: colors.text }}>
                        {slide.title}
                    </h2>
                </EditableElement>

                <div className="grid grid-cols-2 gap-16">
                    {bullets.map((b: string, i: number) => (
                        <div key={i} className="flex flex-col">
                            <div className="w-full h-[1px] mb-4 opacity-30" style={{ backgroundColor: colors.text }} />
                            <EditableElement
                                element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `bullet-${i}`}
                            >
                                <p className="text-xl" style={{ color: colors.text }}>{b}</p>
                            </EditableElement>
                        </div>
                    ))}
                </div>
            </div>
            <SlideFooter title={slide.title} slideNumber={3} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
        </div>
    );
};

const ContentBulletsLayout = ({ slide, colors, onSelect, selectedId, showPageNumber }: { slide: any; colors: any; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    const bullets = slide.bullets || slide.content?.bullets || [];
    return (
        <div className="relative w-full h-full overflow-hidden p-16 flex flex-col justify-center" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />
            <div className="relative z-10 max-w-4xl">
                <EditableElement
                    element={{ id: 'title', type: 'text', value: slide.title, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-8"
                >
                    <h2 className="text-5xl font-bold" style={{ color: colors.text }}>{slide.title}</h2>
                </EditableElement>

                {slide.content?.text && (
                    <EditableElement
                        element={{ id: 'text', type: 'text', value: slide.content.text, path: 'content.text', label: 'Body Text' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'text'}
                        className="mb-8"
                    >
                        <p className="text-xl opacity-90 leading-relaxed" style={{ color: colors.text }}>{slide.content.text}</p>
                    </EditableElement>
                )}

                <ul className="space-y-6">
                    {bullets.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-4">
                            <div className="w-3 h-3 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: colors.primary }} />
                            <EditableElement
                                element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                onSelect={onSelect}
                                isSelected={selectedId === `bullet-${i}`}
                            >
                                <span className="text-xl font-medium" style={{ color: colors.text }}>{b}</span>
                            </EditableElement>
                        </li>
                    ))}
                </ul>
            </div>
            <SlideFooter title={slide.title} slideNumber={slide.index || 1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
        </div>
    );
};

// ============================================
// MASTER COVER LAYOUT - THE VARIATION ENGINE
// ============================================
type CoverVariation = 'centered-minimal' | 'full-split' | 'diagonal-hero' | 'typographic-giant' | 'boxed-modern' | 'gradient-mesh' | 'dark-tech' | 'offset-gallery' | 'floating-glass' | 'cinematic';

const MasterCoverLayout = ({ slide, colors, variation = 'centered-minimal', onSelect, selectedId, showPageNumber }: { slide: any; colors: any; variation?: CoverVariation; onSelect?: any; selectedId?: string | null; showPageNumber?: boolean }) => {
    const subtitle = slide.subtitle || slide.content?.subtitle || slide.title?.split(':')[1] || "";
    const mainTitle = slide.title?.split(':')[0] || slide.title || "Untitled Presentation";
    const bullets = slide.bullets || slide.content?.bullets || [];
    const imageSrc = slide.backgroundImage || (slide.imageSearchQuery ? `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}` : null);

    // 1. CENTERED MINIMAL (Clean, safe)
    if (variation === 'centered-minimal') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center text-center p-20" style={{ backgroundColor: colors.bg }}>

                {/* Background Image if available */}
                {imageSrc && (
                    <>
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 transform hover:scale-105"
                            style={{ backgroundImage: `url(${imageSrc})` }}
                        />
                        <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: `${colors.bg}CC` }} />
                    </>
                )}

                <AbstractShapes colors={colors} />
                <div className="relative z-10 max-w-4xl">
                    <div className="w-24 h-1 mb-12 mx-auto" style={{ backgroundColor: colors.primary }} />
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-8"
                    >
                        <h1 className="text-7xl font-bold tracking-tight drop-shadow-lg" style={{ color: getReadableColor(colors.text, colors.bg) }}>{mainTitle}</h1>
                    </EditableElement>

                    {subtitle && (
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                            className="mb-10"
                        >
                            <p className="text-3xl font-light opacity-90 leading-relaxed" style={{ color: getReadableColor(colors.text, colors.bg) }}>{subtitle}</p>
                        </EditableElement>
                    )}

                    {bullets.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-6 mt-6">
                            {bullets.slice(0, 3).map((b: string, i: number) => (
                                <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Tag ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <span className="text-xl font-medium" style={{ color: getReadableColor(colors.text, colors.bg) }}>{b}</span>
                                    </EditableElement>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // 2. FULL SPLIT (Image Left, Text Right)
    if (variation === 'full-split') {
        return (
            <div className="relative w-full h-full overflow-hidden grid grid-cols-2" style={{ backgroundColor: colors.bg }}>
                <div className="h-full relative">
                    {imageSrc ? (
                        <img src={imageSrc} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full" style={{ backgroundColor: colors.primary }} />
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                </div>
                <div className="h-full flex flex-col justify-center p-20">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-8"
                    >
                        <h1 className="text-7xl font-black leading-tight" style={{ color: getReadableColor(colors.text, colors.bg) }}>{mainTitle}</h1>
                    </EditableElement>
                    {subtitle && (
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                            className="mb-12"
                        >
                            <p className="text-2xl opacity-70" style={{ color: getReadableColor(colors.text, colors.bg) }}>{subtitle}</p>
                        </EditableElement>
                    )}
                    <div className="w-full h-px opacity-20 mb-8" style={{ backgroundColor: colors.text }} />

                    {bullets.length > 0 && (
                        <ul className="space-y-4 mb-12">
                            {bullets.slice(0, 3).map((b, i) => (
                                <li key={i} className="flex items-center gap-4">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }} />
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <span className="text-xl font-medium opacity-80" style={{ color: getReadableColor(colors.text, colors.bg) }}>{b}</span>
                                    </EditableElement>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full border-2" style={{ borderColor: colors.primary }} />
                        <div className="w-12 h-12 rounded-full border-2" style={{ borderColor: colors.secondary }} />
                    </div>
                </div>
                <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} />
            </div>
        );
    }

    // 3. DIAGONAL HERO (Dynamic slice)
    if (variation === 'diagonal-hero') {
        return (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.primary }}>
                <div className="absolute inset-0 w-full h-full bg-white z-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 45%)', backgroundColor: colors.bg }} />
                <div className="absolute z-10 top-20 left-20 max-w-3xl">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-4"
                    >
                        <h1 className="text-8xl font-black drop-shadow-sm" style={{ color: getReadableColor(colors.text, colors.bg) }}>{mainTitle}</h1>
                    </EditableElement>
                    <EditableElement
                        element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'subtitle'}
                        className="mb-8"
                    >
                        <p className="text-3xl font-medium" style={{ color: colors.secondary }}>{subtitle}</p>
                    </EditableElement>

                    {bullets.length > 0 && (
                        <ul className="space-y-4">
                            {bullets.slice(0, 3).map((b, i) => (
                                <li key={i} className="flex items-center gap-4">
                                    <div className="w-12 h-[2px]" style={{ backgroundColor: colors.accent }} />
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <span className="text-2xl font-bold opacity-80" style={{ color: getReadableColor(colors.text, colors.bg) }}>{b}</span>
                                    </EditableElement>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {imageSrc && (
                    <div className="absolute bottom-0 right-0 w-2/3 h-2/3 object-cover z-20" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}>
                        <img src={imageSrc} className="w-full h-full object-cover" alt="" />
                    </div>
                )}
                <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // 4. TYPOGRAPHIC GIANT (Swiss style)
    if (variation === 'typographic-giant') {
        return (
            <div className="relative w-full h-full overflow-hidden p-16 bg-zinc-900 border-[20px]" style={{ backgroundColor: colors.text, borderColor: colors.bg }}>
                <div className="h-full border-2 p-12 flex flex-col justify-between" style={{ borderColor: colors.bg }}>
                    <div className="flex justify-between items-start">
                        <span className="text-2xl font-mono" style={{ color: colors.bg }}>EST. {new Date().getFullYear()}</span>
                        <div className="w-20 h-20 rounded-full animate-spin-slow" style={{ border: `2px dashed ${colors.bg}` }} />
                    </div>
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                    >
                        <h1 className="text-[9rem] leading-[0.8] font-bold tracking-tighter" style={{ color: colors.bg }}>
                            {mainTitle}
                        </h1>
                    </EditableElement>
                    <EditableElement
                        element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'subtitle'}
                    >
                        <p className="text-3xl font-mono text-right" style={{ color: colors.bg }}>// {subtitle}</p>
                    </EditableElement>
                </div>
                <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // 5. BOXED MODERN (Card in center)
    if (variation === 'boxed-modern') {
        return (
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: colors.secondary }}>
                {imageSrc && <img src={imageSrc} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" alt="" />}
                <div className="relative z-10 bg-white p-24 shadow-2xl max-w-4xl text-center" style={{ backgroundColor: colors.bg }}>
                    <div className="border-4 p-8 mb-8 inline-block" style={{ borderColor: colors.primary }}>
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                        >
                            <h1 className="text-6xl font-bold uppercase tracking-widest" style={{ color: getReadableColor(colors.text, colors.bg) }}>{mainTitle}</h1>
                        </EditableElement>
                    </div>
                    {subtitle && (
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                            className="mb-8"
                        >
                            <p className="text-xl tracking-widest uppercase font-bold" style={{ color: colors.accent }}>{subtitle}</p>
                        </EditableElement>
                    )}

                    {bullets.length > 0 && (
                        <div className="flex justify-center gap-8 mt-4 border-t pt-8" style={{ borderColor: `${colors.text}10` }}>
                            {bullets.slice(0, 3).map((b, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <span className="text-sm font-bold opacity-40 mb-2" style={{ color: colors.text }}>0{i + 1}</span>
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <span className="text-lg font-medium" style={{ color: getReadableColor(colors.text, colors.bg) }}>{b}</span>
                                    </EditableElement>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // 6. GRADIENT MESH (Trendy, colorful)
    if (variation === 'gradient-mesh') {
        // Check if background is light (returns black text) or dark (returns white text)
        const isLightBg = getContrastColor(colors.bg) === '#000000';

        // For light backgrounds, 'screen' blending makes colors vanish. Use 'multiply' or normal.
        // For dark backgrounds, 'screen' creates nice glowing effects.
        const blendMode = isLightBg ? 'mix-blend-multiply' : 'mix-blend-screen';
        const centerBlend = isLightBg ? 'mix-blend-normal' : 'mix-blend-overlay';
        const blobOpacity = isLightBg ? 'opacity-30' : 'opacity-60';

        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col justify-end p-20" style={{ backgroundColor: colors.bg }}>
                {/* Enhanced Animated Blobs */}
                <div className={`absolute top-[-10%] right-[-10%] w-[1000px] h-[1000px] rounded-full blur-[150px] ${blobOpacity} ${blendMode} animate-pulse`} style={{ backgroundColor: colors.primary, animationDuration: '8s' }} />
                <div className={`absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] ${blobOpacity} ${blendMode} animate-pulse`} style={{ backgroundColor: colors.secondary, animationDuration: '10s', animationDelay: '1s' }} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] ${blobOpacity} ${centerBlend}`} style={{ backgroundColor: colors.accent }} />

                <div className="relative z-10 backdrop-blur-xl bg-white/20 p-16 rounded-[3rem] border border-white/30 max-w-5xl shadow-2xl">
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-6"
                    >
                        <h1 className="text-8xl font-bold tracking-tight" style={{ color: getReadableColor(colors.text, colors.bg) }}>{mainTitle}</h1>
                    </EditableElement>
                    {subtitle && (
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                            className="mb-8"
                        >
                            <p className="text-3xl font-light opacity-90" style={{ color: getReadableColor(colors.text, colors.bg) }}>{subtitle}</p>
                        </EditableElement>
                    )}
                    <div className="h-1.5 w-40 rounded-full mb-10" style={{ backgroundColor: colors.accent }} />

                    {bullets.length > 0 && (
                        <div className="grid grid-cols-1 gap-6">
                            {bullets.slice(0, 3).map((b, i) => (
                                <div key={i} className="flex items-center gap-6 group">
                                    <div className="w-4 h-4 rounded-full transition-all group-hover:scale-125" style={{ backgroundColor: colors.primary }} />
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <span className="text-2xl font-medium tracking-wide" style={{ color: getReadableColor(colors.text, colors.bg) }}>{b}</span>
                                    </EditableElement>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // 7. DARK TECH (Cyberpunk feel)
    if (variation === 'dark-tech') {
        return (
            <div className="relative w-full h-full overflow-hidden bg-black flex items-center p-24" style={{ backgroundColor: '#050505' }}>
                <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, ${colors.primary}20 0%, transparent 50%)` }} />
                <div className="grid grid-cols-12 gap-8 w-full z-10">
                    <div className="col-span-8">
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                            className="mb-8"
                        >
                            <h1 className="text-8xl font-bold text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, #ffffff, ${colors.primary})` }}>
                                {mainTitle}
                            </h1>
                        </EditableElement>
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                            className="mb-12"
                        >
                            <p className="text-2xl font-mono border-l-2 border-gray-600 pl-6" style={{ color: '#9ca3af' }}>{subtitle}</p>
                        </EditableElement>

                        {bullets.length > 0 && (
                            <div className="flex gap-12 ml-6">
                                {bullets.slice(0, 3).map((b, i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <div className="w-8 h-[1px] bg-primary" style={{ backgroundColor: colors.primary }} />
                                        <EditableElement
                                            element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                            onSelect={onSelect}
                                            isSelected={selectedId === `bullet-${i}`}
                                        >
                                            <span className="text-sm font-mono uppercase tracking-tighter opacity-70" style={{ color: '#ffffff' }}>[{b}]</span>
                                        </EditableElement>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="absolute bottom-10 right-10 flex gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 bg-white rounded-full opacity-50" />)}
                </div>
                <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // 8. OFFSET GALLERY (Images + text blocks)
    if (variation === 'offset-gallery') {
        return (
            <div className="relative w-full h-full overflow-hidden grid grid-cols-12 gap-4 p-8" style={{ backgroundColor: colors.bg }}>
                <div className="col-span-8 row-span-2 relative rounded-3xl overflow-hidden">
                    {imageSrc ? <img src={imageSrc} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gray-200" />}
                    <div className="absolute bottom-0 left-0 p-12 bg-white/90 m-6 rounded-2xl">
                        <EditableElement
                            element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'title'}
                            className="mb-4"
                        >
                            <h1 className="text-5xl font-bold" style={{ color: getReadableColor(colors.primary, '#ffffff') }}>{mainTitle}</h1>
                        </EditableElement>
                        {bullets.length > 0 && (
                            <div className="flex gap-4">
                                {bullets.slice(0, 2).map((b, i) => (
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <span className="text-sm font-bold opacity-60 px-3 py-1 rounded-full bg-gray-100">{b}</span>
                                    </EditableElement>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="col-span-4 bg-black rounded-3xl p-8 flex flex-col justify-end" style={{ backgroundColor: colors.secondary }}>
                    <EditableElement
                        element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'subtitle'}
                        className="mb-4"
                    >
                        <p className="text-3xl font-medium leading-tight text-white">{subtitle}</p>
                    </EditableElement>
                    {bullets.length > 2 && (
                        <EditableElement
                            element={{ id: 'bullet-2', type: 'text', value: bullets[2], path: 'bullets[2]', label: 'Tag 3' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'bullet-2'}
                        >
                            <p className="text-sm text-white/60 italic">{bullets[2]}</p>
                        </EditableElement>
                    )}
                </div>
                <div className="col-span-4 rounded-3xl opacity-20" style={{ backgroundColor: colors.primary }} />
                <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // 9. FLOATING GLASS (Premium)
    if (variation === 'floating-glass') {
        return (
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                {imageSrc && <img src={imageSrc} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" alt="" />}
                <div className="relative w-[90%] h-[80%] rounded-3xl border border-white/30 bg-white/10 backdrop-blur-lg shadow-2xl flex flex-col items-center justify-center text-center p-20">
                    <span className="tracking-[0.5em] text-sm font-bold mb-12" style={{ color: '#ffffff' }}>PRESENTATION</span>
                    <EditableElement
                        element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                        onSelect={onSelect}
                        isSelected={selectedId === 'title'}
                        className="mb-8"
                    >
                        <h1 className="text-8xl font-serif drop-shadow-lg text-white">{mainTitle}</h1>
                    </EditableElement>
                    {subtitle && (
                        <EditableElement
                            element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                            onSelect={onSelect}
                            isSelected={selectedId === 'subtitle'}
                            className="mb-12"
                        >
                            <p className="text-2xl font-light opacity-80 text-white italic">{subtitle}</p>
                        </EditableElement>
                    )}

                    {bullets.length > 0 && (
                        <div className="flex gap-12 mb-16">
                            {bullets.slice(0, 3).map((b, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-1 h-1 rounded-full bg-white" />
                                    <EditableElement
                                        element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                        onSelect={onSelect}
                                        isSelected={selectedId === `bullet-${i}`}
                                    >
                                        <span className="text-sm uppercase tracking-widest text-white/70">{b}</span>
                                    </EditableElement>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className="px-12 py-4 font-bold rounded-full hover:scale-105 transition-transform" style={{ backgroundColor: '#ffffff', color: '#000000' }}>START</button>
                </div>
                <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
            </div>
        );
    }

    // 10. CINEMATIC (Movie poster style)
    return (
        <div className="relative w-full h-full overflow-hidden flex flex-col justify-end pb-32 px-24" style={{ backgroundColor: 'black' }}>
            {imageSrc ? (
                <img src={imageSrc} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
            ) : (
                <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

            <div className="relative z-10 border-l-8 pl-12" style={{ borderColor: colors.primary }}>
                <EditableElement
                    element={{ id: 'title', type: 'text', value: mainTitle, path: 'title', label: 'Title' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'title'}
                    className="mb-6"
                >
                    <h1 className="text-8xl font-bold uppercase tracking-tight text-white">{mainTitle}</h1>
                </EditableElement>
                <EditableElement
                    element={{ id: 'subtitle', type: 'text', value: subtitle, path: 'subtitle', label: 'Subtitle' }}
                    onSelect={onSelect}
                    isSelected={selectedId === 'subtitle'}
                    className="mb-10 mr-12"
                >
                    <p className="text-4xl font-light text-gray-300">{subtitle} <span className="text-sm align-top opacity-50">©2025</span></p>
                </EditableElement>

                {bullets.length > 0 && (
                    <div className="flex gap-8 opacity-60">
                        {bullets.slice(0, 3).map((b, i) => (
                            <div key={i} className="text-sm font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                <EditableElement
                                    element={{ id: `bullet-${i}`, type: 'text', value: b, path: `bullets[${i}]`, label: `Bullet ${i + 1}` }}
                                    onSelect={onSelect}
                                    isSelected={selectedId === `bullet-${i}`}
                                >
                                    {b}
                                </EditableElement>
                                {i < bullets.slice(0, 3).length - 1 && <span>•</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <SlideFooter title="" slideNumber={1} colors={colors} unsplashPhotographer={slide.unsplashPhotographer} showPageNumber={showPageNumber} />
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
// Main component
export const ModernSlideRenderer = ({
    slide,
    theme = 'modern',
    className,
    colorPalette,
    fontConfig,
    onElementSelect,
    selectedElementId,
    showWatermark,
    showPageNumber, // This is coming from props as override
    templateOverlay // Destructure added prop
}: SlideRendererProps) => {
    // If templateOverlay config exists, prioritize its setting over the prop
    const finalShowPageNumber = templateOverlay?.footer?.showPageNumber !== undefined
        ? templateOverlay.footer.showPageNumber
        : (showPageNumber ?? true);
    // Get template colors
    const template = getTemplateById(theme);

    // Resolve colors: prefer dynamic palette, fallback to template, fallback to defaults
    const colors = colorPalette || template?.colors || {
        primary: '#2563EB',
        secondary: '#7C3AED',
        accent: '#2563EB',
        bg: '#ffffff',
        text: '#0F172A',
    };

    const slideType = slide.type || slide.layout || 'content';
    const normalizedType = slideType.toLowerCase();

    // Determine if this is a dark theme based on the background color
    const isDarkTheme = colors.bg ? colors.bg.toLowerCase().startsWith('#0') ||
        colors.bg.toLowerCase().startsWith('#1') ||
        colors.bg.toLowerCase().startsWith('#2') : false;

    const renderLayout = () => {
        const getComparisonVariation = (): ComparisonVariation => {
            // 0. Manual Override
            if (slide.variation && ['balanced-split', 'versus-cards', 'feature-grid', 'before-after', 'pros-cons'].includes(slide.variation)) {

                return slide.variation as ComparisonVariation;
            }

            // 1. Theme-based preference
            const isTech = theme.includes('tech') || theme.includes('modern') || theme.includes('startup');
            const isCorporate = theme.includes('corporate') || theme.includes('consulting') || theme.includes('finance');

            // 2. Content-based detection
            const text = (slide.title + (slide.content?.leftTitle || '') + (slide.content?.rightTitle || '')).toLowerCase();

            if (text.includes('compare') || text.includes('vs') || text.includes('versus')) return 'versus-cards';
            if (text.includes('feature') || text.includes('spec')) return 'feature-grid';
            if (text.includes('before') && text.includes('after')) return 'before-after';
            if (text.includes('pros') && text.includes('cons')) return 'pros-cons';
            if (text.includes('advantage') || text.includes('benefit')) return 'pros-cons';
            if (text.includes('problem') && text.includes('solution')) return 'before-after';

            // 3. Fallback to deterministic hash
            const str = (slide.id || '') + (slide.title || '');
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
            const index = Math.abs(hash) % 5;

            // Tech themes prefer cards/modern
            if (isTech && index % 2 === 0) return 'versus-cards';

            // Corporate themes prefer grid/split
            if (isCorporate && index % 2 === 0) return 'feature-grid';

            const variants: ComparisonVariation[] = ['balanced-split', 'versus-cards', 'feature-grid', 'before-after', 'pros-cons'];
            return variants[index];
        };

        const getChartVariation = (): ChartVariation => {
            // 0. Manual Override
            if (slide.variation && ['default-container', 'split-detail', 'floating-card', 'full-bleed-hero', 'minimal-stat'].includes(slide.variation)) return slide.variation as ChartVariation;

            // 1. Theme-based preference
            const isTech = theme.includes('tech') || theme.includes('modern') || theme.includes('startup');
            const isDark = theme.includes('dark') || theme.includes('black') || theme.includes('night');

            // 2. Content-based detection
            const text = (slide.title + (slide.content?.description || '')).toLowerCase();

            if (text.includes('analysis') || text.includes('breakdown') || text.includes('insight')) return 'split-detail';
            if (text.includes('growth') || text.includes('trend') || text.includes('impact')) return 'full-bleed-hero';
            if (text.includes('key') || text.includes('stat') || text.includes('highlight')) return 'minimal-stat';

            // 3. Fallback to deterministic hash
            const str = (slide.id || '') + (slide.title || '');
            let hash = 0;
            for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
            const index = Math.abs(hash) % 5;

            // Tech themes prefer cards/modern
            if (isTech && index % 2 === 0) return 'floating-card';

            // Dark themes prefer full bleed
            if (isDark && index % 2 === 0) return 'full-bleed-hero';

            const variants: ChartVariation[] = ['default-container', 'split-detail', 'floating-card', 'full-bleed-hero', 'minimal-stat'];
            return variants[index];
        };


        // Debug logging
        const contentKeys = Object.keys(slide.content || {}).filter(k => slide.content[k]);


        // Smart content detection: check actual data presence before layout matching
        // Support BOTH expected format AND AI's actual output format
        const hasChart = (
            slide.chart?.data?.length > 0 || slide.chart?.categories?.length > 0 ||
            slide.content?.chart?.data?.length > 0 || slide.content?.chart?.categories?.length > 0 ||
            // AI format: chartType + labels + datasets
            (slide.content?.labels?.length > 0 && slide.content?.datasets?.length > 0)
        );
        const hasTable = (
            slide.table?.rows?.length > 0 ||
            slide.content?.table?.rows?.length > 0 ||
            // AI format: headers + rows directly in content
            (slide.content?.headers?.length > 0 && slide.content?.rows?.length > 0)
        );
        const hasTimeline = (
            slide.timeline?.items?.length > 0 ||
            slide.content?.timeline?.items?.length > 0 ||
            // AI format: steps array with date/event objects OR events array
            (slide.content?.steps?.length > 0 && slide.content?.steps?.[0]?.date) ||
            (slide.content?.events?.length > 0 && slide.content?.events?.[0]?.date)
        );
        const hasInfographic = (
            slide.infographic?.steps?.length > 0 ||
            slide.content?.infographic?.steps?.length > 0 ||
            // AI format: type + steps (but steps are strings, not date objects)
            ((slide.content?.type || normalizedType.includes('infographic')) && slide.content?.steps?.length > 0 && !slide.content?.steps?.[0]?.date)
        );
        const hasComparison = (
            !normalizedType.includes('text') && // Prevent text-columns from being hijacked as comparison
            (
                slide.comparison?.left ||
                slide.content?.comparison?.left ||
                (slide.columns?.length === 2) ||
                // AI format: titles and points (fallback)
                (slide.content?.leftTitle || slide.content?.rightTitle) ||
                (slide.content?.leftPoints || slide.content?.rightPoints)
            )
        );
        const hasStats = (
            slide.stats?.length > 0 ||
            slide.metrics?.length > 0 ||
            slide.content?.stats?.length > 0 ||
            // AI format: statistics array
            slide.content?.statistics?.length > 0
        );
        const hasItems = (slide.items?.length > 0 || slide.content?.items?.length > 0);
        const hasQuote = (slide.quote?.text || slide.content?.quote?.text);
        // AI format: columns array for text-columns layout
        const hasTextColumns = (slide.content?.columns?.length > 0 || slide.content?.['text-columns']?.length > 0);

        // Helper to pick a variation for text columns
        const getMultiColumnVariation = (): TextColumnVariation => {
            if (slide.variation && ['default', 'cards', 'process', 'magazine-cols', 'classic', 'modern-cards', 'numbered-editorial', 'side-highlight', 'vertical-separators', 'bento-text'].includes(slide.variation)) return slide.variation as TextColumnVariation;

            const salt = slide.id || slide.title || 'cols';
            const slideIndex = slide.index || 0;

            // Robust hashing function
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            const baseHash = hashString(salt + slideIndex + 'cols');
            const themeHash = hashString(salt + slideIndex + 'theme');

            const variations: TextColumnVariation[] = ['classic', 'modern-cards', 'numbered-editorial', 'side-highlight', 'vertical-separators', 'bento-text'];
            const pseudoRandom = (themeHash % 100) / 100;

            let pickedIndex = baseHash % variations.length;
            let picked = variations[pickedIndex];

            // Theme affinities
            if (pseudoRandom > 0.3) {
                if (theme.includes('consulting') || theme.includes('corporate')) picked = variations[baseHash % 2 === 0 ? 2 : 4]; // numbered-editorial or vertical-separators
                else if (theme.includes('tech') || theme.includes('modern')) picked = variations[baseHash % 2 === 0 ? 1 : 5]; // modern-cards or bento-text
                else if (theme.includes('creative') || theme.includes('marketing')) picked = variations[baseHash % 2 === 0 ? 1 : 3]; // modern-cards or side-highlight
            }
            return picked;
        };

        // Helper to pick a variation for stats
        const getStatsVariation = (): StatsVariation => {
            if (slide.variation && ['classic-grid', 'metric-cards', 'big-hero-stat', 'data-progress', 'trend-focus'].includes(slide.variation)) return slide.variation as StatsVariation;

            const salt = slide.id || slide.title || 'stats';
            const slideIndex = slide.index || 0;

            // Robust hashing function
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            const baseHash = hashString(salt + slideIndex + 'stats');
            const themeHash = hashString(salt + slideIndex + 'theme');

            const variations: StatsVariation[] = ['classic-grid', 'metric-cards', 'big-hero-stat', 'data-progress', 'trend-focus'];
            const pseudoRandom = (themeHash % 100) / 100;

            let pickedIndex = baseHash % variations.length;
            let picked = variations[pickedIndex];

            // Theme affinities
            if (pseudoRandom > 0.3) {
                if (theme.includes('consulting') || theme.includes('corporate') || theme.includes('finance'))
                    picked = variations[baseHash % 2 === 0 ? 2 : 4]; // big-hero-stat or trend-focus
                else if (theme.includes('tech') || theme.includes('modern') || theme.includes('startup'))
                    picked = variations[baseHash % 2 === 0 ? 1 : 3]; // metric-cards or data-progress
                else if (theme.includes('creative') || theme.includes('marketing'))
                    picked = variations[baseHash % 2 === 0 ? 1 : 3]; // metric-cards or data-progress
            }

            return picked;
        };


        // Helper to pick a variation for timeline
        const getTimelineVariation = (): TimelineVariation => {
            if (slide.variation && ['horizontal-line', 'vertical-alternating', 'connected-cards', 'stepped-process', 'minimal-list'].includes(slide.variation)) return slide.variation as TimelineVariation;

            const salt = slide.id || slide.title || 'timeline';
            const slideIndex = slide.index || 0;

            // Robust hashing function
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            const baseHash = hashString(salt + slideIndex + 'timeline');
            const themeHash = hashString(salt + slideIndex + 'theme');

            const variations: TimelineVariation[] = ['horizontal-line', 'vertical-alternating', 'connected-cards', 'stepped-process', 'minimal-list'];
            const pseudoRandom = (themeHash % 100) / 100;

            let pickedIndex = baseHash % variations.length;
            let picked = variations[pickedIndex];

            // Theme affinities
            if (pseudoRandom > 0.3) {
                if (theme.includes('tech') || theme.includes('startup'))
                    picked = variations[baseHash % 2 === 0 ? 0 : 2]; // horizontal-line or connected-cards
                else if (theme.includes('consulting') || theme.includes('corporate'))
                    picked = variations[baseHash % 2 === 0 ? 1 : 3]; // vertical-alternating or stepped-process
                else if (theme.includes('creative') || theme.includes('marketing'))
                    picked = variations[baseHash % 2 === 0 ? 0 : 1]; // horizontal-line or vertical-alternating
            }

            return picked;
        };

        // Helper to pick a variation for bento/grid
        const getBentoVariation = (): BentoVariation => {
            if (slide.variation && ['default', 'magazine-grid', 'feature-focus', 'asymmetric-masonry'].includes(slide.variation)) return slide.variation as BentoVariation;

            const salt = slide.id || slide.title || 'bento';
            const slideIndex = slide.index || 0;

            // Robust hashing function
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            const baseHash = hashString(salt + slideIndex + 'bento');

            // 1. Content-based keywords
            const text = (slide.title + (slide.content?.description || '')).toLowerCase();

            if (text.includes('story') || text.includes('team') || text.includes('gallery') || text.includes('vision'))
                return 'magazine-grid';
            if (text.includes('product') || text.includes('feature') || text.includes('core') || text.includes('spotlight'))
                return 'feature-focus';
            if (text.includes('idea') || text.includes('brainstorm') || text.includes('creative') || text.includes('inspiration') || text.includes('mood'))
                return 'asymmetric-masonry';

            // 2. Deterministic Fallback
            const variations: BentoVariation[] = ['default', 'magazine-grid', 'feature-focus', 'asymmetric-masonry'];
            const pickedIndex = baseHash % variations.length;

            return variations[pickedIndex];
        };

        // Helper to pick a variation for product showcase
        const getShowcaseVariation = (): ShowcaseVariation => {
            if (slide.variation && ['default', 'split', 'floating', 'minimal'].includes(slide.variation)) return slide.variation as ShowcaseVariation;

            const salt = slide.id || slide.title || 'showcase';
            const slideIndex = slide.index || 0;

            // Robust hashing function
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            const baseHash = hashString(salt + slideIndex + 'showcase');
            const themeHash = hashString(salt + slideIndex + 'theme');

            // 1. Content-based keywords
            const text = (slide.title + (slide.content?.description || '')).toLowerCase();

            if (text.includes('app') || text.includes('mobile') || text.includes('platform') || text.includes('software') || text.includes('dashboard'))
                return 'app-mockup';
            if (text.includes('fashion') || text.includes('design') || text.includes('interior') || text.includes('life') || text.includes('style'))
                return 'lifestyle-split';
            if (text.includes('component') || text.includes('part') || text.includes('layer') || text.includes('stack'))
                return 'exploded-view';

            return 'default';
        };

        // Helper to pick a variation for infographic
        const getInfographicVariation = (): InfographicVariation => {
            if (slide.variation && ['funnel', 'process', 'pyramid', 'cycle-flow', 'hub-spoke'].includes(slide.variation)) return slide.variation as InfographicVariation;

            const salt = slide.id || slide.title || 'infographic';
            const slideIndex = slide.index || 0;

            // Robust hashing function
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            const baseHash = hashString(salt + slideIndex + 'infographic');

            // 1. Content-based keywords
            const text = (slide.title + (slide.content?.description || '')).toLowerCase();

            if (text.includes('loop') || text.includes('cycle') || text.includes('repeat') || text.includes('continuous') || text.includes('circle'))
                return 'cycle-flow';
            if (text.includes('network') || text.includes('connect') || text.includes('hub') || text.includes('central') || text.includes('radiate') || text.includes('spoke'))
                return 'hub-spoke';
            if (text.includes('funnel') || text.includes('pipeline') || text.includes('conversion'))
                return 'funnel';
            if (text.includes('hierarchy') || text.includes('structure') || text.includes('level') || text.includes('pyramid'))
                return 'pyramid';

            // 2. Deterministic Fallback
            const variations: InfographicVariation[] = ['funnel', 'process', 'pyramid', 'cycle-flow', 'hub-spoke'];
            const pickedIndex = baseHash % variations.length;

            return variations[pickedIndex];
        };

        // Helper to pick a variation for section divider
        const getSectionVariation = (): SectionVariation => {
            if (slide.variation && ['default', 'big-number-outline', 'minimal-bar', 'abstract-mesh'].includes(slide.variation)) return slide.variation as SectionVariation;

            const salt = slide.id || slide.title || 'section';
            const slideIndex = slide.index || 0;

            // Robust hashing function
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            const baseHash = hashString(salt + slideIndex + 'section');
            const themeHash = hashString(salt + slideIndex + 'theme');

            // 1. Content matches
            // If index is small (1-3), maybe big number?
            if (slideIndex <= 3 && slide.title?.length < 20) return 'big-number-outline';

            // 2. Fallback
            const variations: SectionVariation[] = ['default', 'big-number-outline', 'minimal-bar', 'abstract-mesh'];

            // Theme affinities
            const pseudoRandom = (themeHash % 100) / 100;

            if (pseudoRandom > 0.4) {
                if (theme.includes('minimal')) return 'minimal-bar';
                if (theme.includes('gradient') || theme.includes('modern')) return 'abstract-mesh';
                if (theme.includes('bold') || theme.includes('creative')) return 'big-number-outline';
            }

            const pickedIndex = baseHash % variations.length;
            const finalPick = variations[pickedIndex];

            return finalPick;
        };

        // Helper to pick a variation for image focus
        const getImageFocusVariation = (): ImageFocusVariation => {
            if (slide.variation && ['default', 'text-mask', 'split-curtain', 'polaroid-pile'].includes(slide.variation)) return slide.variation as ImageFocusVariation;

            const salt = slide.id || slide.title || 'image';
            const slideIndex = slide.index || 0;

            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            const baseHash = hashString(salt + slideIndex + 'image');

            // 1. Content Keywords
            const text = (slide.title + (slide.content?.description || '')).toLowerCase();
            if (text.includes('mask') || text.includes('hidden') || text.includes('reveal') || text.includes('focus'))
                return 'text-mask';
            if (text.includes('split') || text.includes('half') || text.includes('side'))
                return 'split-curtain';
            if (text.includes('gallery') || text.includes('collection') || text.includes('photos') || text.includes('memories') || (slide.images && slide.images.length > 1))
                return 'polaroid-pile';

            // 2. Deterministic Fallback
            const variations: ImageFocusVariation[] = ['default', 'text-mask', 'split-curtain', 'polaroid-pile'];

            // Bias towards default/hero for single images, polaroid for multiple
            if (slide.images && slide.images.length > 1) return 'polaroid-pile';

            return variations[baseHash % variations.length];
        };




        // Helper to pick a variation for table
        const getTableVariation = (): TableVariation => {
            if (slide.variation && ['default', 'data-grid', 'feature-matrix', 'pricing-tiers'].includes(slide.variation)) return slide.variation as TableVariation;

            const salt = slide.id || slide.title || 'table';
            const slideIndex = slide.index || 0;

            // Robust hashing function
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            const baseHash = hashString(salt + slideIndex + 'table');

            // 1. Content-based keywords
            const text = (slide.title + (slide.content?.description || '')).toLowerCase();

            if (text.includes('price') || text.includes('plan') || text.includes('tier') || text.includes('subscription') || text.includes('cost'))
                return 'pricing-tiers';
            if (text.includes('data') || text.includes('financial') || text.includes('report') || text.includes('statistic') || text.includes('metric'))
                return 'data-grid';
            if (text.includes('feature') || text.includes('compare') || text.includes('matrix') || text.includes('spec') || text.includes('vs'))
                return 'feature-matrix';

            // 2. Deterministic Fallback
            const variations: TableVariation[] = ['default', 'data-grid', 'feature-matrix']; // minimal pricing tier as fallback
            const pickedIndex = baseHash % variations.length;

            return variations[pickedIndex];
        };


        let LayoutComponent: React.ComponentType<any> = MasterContentLayout; // Default to MasterContentLayout

        // PRIORITY 1: Content-based detection (what data actually exists)
        if (hasChart) {

            return <ChartLayout slide={slide} colors={colors} variation={getChartVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        } else if (hasInfographic) {

            return <InfographicLayout slide={slide} colors={colors} variation={getInfographicVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        } else if (hasTimeline) {

            return <TimelineLayout slide={slide} colors={colors} variation={getTimelineVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }
        if (hasTable) {

            return <TableLayout slide={slide} colors={colors} variation={getTableVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }
        if (hasComparison) {

            return <ComparisonLayout slide={slide} colors={colors} variation={getComparisonVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }
        if (hasStats) {

            return <StatsLayout slide={slide} colors={colors} variation={getStatsVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }
        if (hasTextColumns) {

            return <ThreeColumnTextLayout slide={slide} colors={colors} variation={getMultiColumnVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }
        if (hasItems && (normalizedType.includes('bento') || normalizedType.includes('grid'))) {

            return <BentoGridLayout slide={slide} colors={colors} variation={getBentoVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }
        const itemsArray = slide.content?.items || [];
        if (hasItems && itemsArray.length >= 3) {
            // Fallback to Bento if has items but not explicitly requested, 30% chance or if type is 'features'
            if (normalizedType.includes('feature') || Math.random() > 0.7) {

                return <BentoGridLayout slide={slide} colors={colors} variation={getBentoVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
            }
        }
        if (hasQuote) {

            return <ThreeColumnTextLayout slide={slide} colors={colors} variation={getMultiColumnVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // PRIORITY 2: Layout type string matching (fallback)
        if (normalizedType.includes('showcase') || normalizedType.includes('product')) {

            return <ProductShowcaseLayout slide={slide} colors={colors} variation={getShowcaseVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Smart Injection: If theme is 'tech' or 'product' and has items, use Showcase occasionally
        if ((theme.includes('tech') || theme.includes('product')) && hasItems && itemsArray.length >= 3) {
            if (Math.random() > 0.6) {

                return <ProductShowcaseLayout slide={slide} colors={colors} variation={getShowcaseVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
            }
        }



        // STANDARD CONTENT - SMART VARIATION ENGINE
        // Instead of returning generic bullets, pick a variation
        if (normalizedType.includes('content') || normalizedType.includes('bullet') || normalizedType === 'text') {


            // Use combination of slide index + title for variety but not total randomness
            // FIX: Made deterministic by removing Date.now() and Math.random()
            const salt = slide.id || slide.title || 'salt';
            const slideIndex = slide.index || 0;

            // Robust hashing function (FNV-1a variant) for better distribution
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            // Calculate two distinct hashes to decouple selection from theme decision
            const baseHash = hashString(salt + slideIndex + 'variation');
            const themeHash = hashString(salt + slideIndex + 'theme');

            const variations: MasterVariation[] = ['classic', 'split-card', 'hero-block', 'magazine', 'minimal-offset'];

            // Deterministic pseudo-random number for theme decision (0-1 range)
            const pseudoRandom = (themeHash % 100) / 100;

            // Base choice based on baseHash
            let pickedIndex = baseHash % variations.length;
            let picked: MasterVariation = variations[pickedIndex];

            // 0. Manual Override (Check variations list validity)
            if (slide.variation && variations.includes(slide.variation as MasterVariation)) {
                picked = slide.variation as MasterVariation;
            } else {
                // Theme affinities are now SUGGESTIONS (70% chance to use theme suggestion)
                if (pseudoRandom > 0.3) {
                    if (theme.includes('tech')) picked = variations[(pickedIndex + 1) % variations.length]; // Affinity for more "structured" looks
                    else if (theme.includes('minimal') || theme.includes('corporate')) picked = variations[baseHash % 2 === 0 ? 0 : 4]; // classic or minimal-offset
                    else if (theme.includes('creative') || theme.includes('marketing')) picked = variations[baseHash % 2 === 0 ? 1 : 3]; // split-card or magazine
                    else if (theme.includes('startup') || theme.includes('product')) picked = variations[baseHash % 2 === 0 ? 1 : 2]; // split-card or hero-block
                    else if (theme.includes('consulting')) picked = variations[baseHash % 2 === 0 ? 0 : 2]; // classic or hero-block
                }
            }


            return <MasterContentLayout slide={slide} colors={colors} variation={picked} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Cover / Hero layouts
        if (normalizedType.includes('cover') || normalizedType.includes('hero')) {


            // Use combination of slide index + title + subtitle for variety
            const salt = (slide.id || slide.title || 'cover') + (slide.subtitle || '');
            const slideIndex = slide.index || 0;

            // Robust hashing function (FNV-1a variant)
            const hashString = (str: string) => {
                let hash = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    hash ^= str.charCodeAt(i);
                    hash = Math.imul(hash, 16777619);
                }
                return hash >>> 0;
            };

            // Calculate two distinct hashes
            const baseHash = hashString(salt + slideIndex + 'cover');
            const themeHash = hashString(salt + slideIndex + 'theme');

            let variations: CoverVariation[] = [
                'centered-minimal', 'full-split', 'diagonal-hero', 'typographic-giant',
                'boxed-modern', 'gradient-mesh', 'dark-tech', 'offset-gallery',
                'floating-glass', 'cinematic'
            ];

            // Filter out "Force Dark" layouts if the theme is light
            // This prevents jarring black slides in a white/light presentation
            if (!isDarkTheme) {
                // dark-tech and cinematic force black backgrounds
                variations = variations.filter(v => v !== 'dark-tech' && v !== 'cinematic');
            }

            // Deterministic pseudo-random number for theme decision
            const pseudoRandom = (themeHash % 100) / 100;

            // Base choice based on baseHash
            let coverPickedIndex = baseHash % variations.length;
            let picked: CoverVariation = variations[coverPickedIndex];

            // Theme affinities are now SUGGESTIONS (70% chance)
            if (slide.variation && variations.includes(slide.variation as CoverVariation)) {
                picked = slide.variation as CoverVariation;
            } else if (pseudoRandom > 0.3) {
                const offset = themeHash % 3;
                if (theme.includes('tech')) picked = variations[(coverPickedIndex + offset) % variations.length]; // Prefers tech, glass, dark
                else if (theme.includes('creative')) picked = variations[(coverPickedIndex + offset + 2) % variations.length]; // Prefers giant, mesh, gallery
                else if (theme.includes('minimal')) picked = variations[(coverPickedIndex + offset + 4) % variations.length]; // Prefers centered, boxed
                else if (theme.includes('corporate') || theme.includes('consulting')) picked = variations[themeHash % 2 === 0 ? 0 : 1]; // centered-minimal or full-split
                else if (theme.includes('marketing') || theme.includes('product')) picked = variations[themeHash % 2 === 0 ? 5 : (variations.includes('cinematic') ? 9 : 5)]; // gradient-mesh or cinematic (if available)
                else if (theme.includes('startup')) picked = variations[themeHash % 2 === 0 ? 2 : 4]; // diagonal-hero or boxed-modern
            }


            return <MasterCoverLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={picked} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Section divider
        if (normalizedType.includes('section') || normalizedType.includes('divider')) {

            return <SectionDividerLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getSectionVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Stats/Metrics by type - STRICT CHECK
        if (normalizedType.includes('stat') || normalizedType.includes('metric') || normalizedType.includes('kpi')) {
            if (hasStats) {

                return <StatsLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getStatsVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
            }

        }

        // Chart by type - STRICT CHECK: Only if data exists, otherwise fallback to text
        if (normalizedType.includes('chart') || (normalizedType.includes('graph') && !normalizedType.includes('infographic'))) {
            if (hasChart) {

                return <ChartLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getChartVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
            } else {

                // Fall through to default content handler
            }
        }

        // Timeline/Process by type - STRICT CHECK
        if (normalizedType.includes('timeline') || normalizedType.includes('roadmap') || normalizedType.includes('process')) {
            if (hasTimeline) {

                return <TimelineLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getTimelineVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
            } else if (hasInfographic) {
                return <InfographicLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getInfographicVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
            }
            // Fallback if no timeline data

        }

        // Comparison - STRICT CHECK
        if (normalizedType.includes('comparison') || normalizedType.includes('versus') || normalizedType.includes('before')) {
            if (hasComparison) {

                return <ComparisonLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getComparisonVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
            }

        }

        // Infographic
        if (normalizedType.includes('infographic') || normalizedType.includes('funnel') || normalizedType.includes('pyramid')) {

            return <InfographicLayout slide={slide} colors={colors} variation={getInfographicVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Quote - Use dedicated QuoteLayout
        if (normalizedType.includes('quote') || normalizedType.includes('testimonial')) {
            const quoteVariations: Array<'centered-hero' | 'side-accent' | 'minimal-elegant'> = ['centered-hero', 'side-accent', 'minimal-elegant'];
            // Simple hash for deterministic variation selection
            const title = slide.title || '';
            let hash = 0;
            for (let i = 0; i < title.length; i++) {
                hash = ((hash << 5) - hash) + title.charCodeAt(i);
                hash |= 0;
            }
            const quoteVariation = quoteVariations[Math.abs(hash) % quoteVariations.length];

            return <QuoteLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={quoteVariation} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Bento grid
        if (normalizedType.includes('bento') || normalizedType.includes('grid') || normalizedType.includes('feature')) {

            return <BentoGridLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getBentoVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Image focus
        if (normalizedType.includes('image') || normalizedType.includes('splash') || normalizedType.includes('full')) {

            return <ImageFocusLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getImageFocusVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Text Columns (explicit type match fallback)
        if (normalizedType.includes('text') && normalizedType.includes('column')) {

            return <ThreeColumnTextLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getMultiColumnVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Columns layout (legacy support) - Strict exclusion of text-columns
        if (normalizedType.includes('column') && !normalizedType.includes('text')) {

            return <ComparisonLayout slide={slide} colors={colors} variation={getComparisonVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Bento fallback for items
        if (hasItems) {

            return <BentoGridLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} variation={getBentoVariation()} onSelect={onElementSelect} selectedId={selectedElementId} />;
        }

        // Default: Content with bullets

        return <ContentBulletsLayout showPageNumber={finalShowPageNumber} slide={slide} colors={colors} onSelect={onElementSelect} selectedId={selectedElementId} />;
    };

    return (
        <div
            className={cn("w-full h-full relative overflow-hidden", className)}
            style={{
                backgroundColor: colors.bg,
                color: colors.text,
                fontFamily: fontConfig?.body ? getFontFamily(fontConfig.body) : 'inherit',
                '--slide-bg': colors.bg,
                '--slide-text': colors.text,
                '--slide-primary': colors.primary,
                '--slide-accent': colors.accent || colors.primary,
                '--slide-heading-font': fontConfig?.heading ? getFontFamily(fontConfig.heading) : 'inherit',
                '--slide-body-font': fontConfig?.body ? getFontFamily(fontConfig.body) : 'inherit',
            } as React.CSSProperties}
        >
            {renderLayout()}

            {/* Custom Floating Elements Layer */}
            {slide.elements && slide.elements.map((el: any) => (
                <FloatingElement
                    key={el.id}
                    element={el}
                    colors={colors}
                    onSelect={onElementSelect}
                    isSelected={selectedElementId === el.id}
                />
            ))}

            {/* Watermark for Free Users */}
            {showWatermark && (
                <div className="absolute bottom-3 right-4 z-50 pointer-events-none select-none opacity-60">
                    <span
                        className="text-xs font-medium tracking-wide px-2 py-1 rounded bg-black/10 backdrop-blur-sm"
                        style={{ color: colors.text }}
                    >
                        Generated with SlideAI
                    </span>
                </div>
            )}
        </div>
    );
};


