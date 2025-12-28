// src/components/slides/ModernSlideRenderer.tsx
// Enhanced slide renderer with support for charts, tables, timelines, infographics
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
}

// ============================================
// HELPER COMPONENTS
// ============================================

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
const SlideFooter = ({ slideNumber, title, colors }: { slideNumber?: number; title: string; colors?: any }) => (
    <div
        className="absolute bottom-0 left-0 right-0 h-20 flex items-center justify-between px-12"
        style={{
            borderTop: `1px solid ${colors?.primary || '#e5e5e5'}20`,
        }}
    >
        <span
            className="text-lg font-semibold"
            style={{ color: colors?.primary || '#666' }}
        >
            {slideNumber || 1}
        </span>
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
const CoverHeroLayout = ({ slide, colors }: { slide: any; colors: any }) => (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
        <AbstractShapes colors={colors} />

        {/* Background image with overlay */}
        {slide.backgroundImage && !slide.backgroundImage.includes('placehold') && (
            <>
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${slide.backgroundImage})` }}
                />
                <div className="absolute inset-0" style={{ backgroundColor: `${colors.bg}CC` }} />
            </>
        )}

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-20 pb-32 text-center">
            <h1 className="text-8xl md:text-9xl font-bold mb-10 leading-tight">
                {slide.title?.split(' ').map((word: string, i: number) => {
                    const isKeyword = ['vision', 'pitch', 'strategy', 'innovation', 'future', 'ai', 'tech'].some(kw =>
                        word.toLowerCase().includes(kw)
                    );
                    return isKeyword ?
                        <span key={i} style={{ color: colors.primary }}>{word} </span> :
                        <span key={i} style={{ color: colors.text }}>{word} </span>;
                })}
            </h1>

            {(slide.subtitle || slide.content?.subtitle) && (
                <div className="inline-block px-12 py-6 rounded-full bg-surface border border-border shadow-md">
                    <p className="text-3xl opacity-80" style={{ color: colors.text }}>{slide.subtitle || slide.content?.subtitle}</p>
                </div>
            )}

            {/* Key bullets if present */}
            {(slide.bullets?.length > 0 || slide.content?.bullets?.length > 0) && (
                <ul className="mt-10 space-y-3 text-left">
                    {(slide.bullets || slide.content?.bullets || []).slice(0, 4).map((bullet: string, i: number) => (
                        <li key={i} className="flex items-center gap-4">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                            <span className="text-2xl opacity-80" style={{ color: colors.text }}>{bullet}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        <SlideFooter title={slide.title} slideNumber={1} colors={colors} />
    </div>
);

// Section divider - Bold title slide
const SectionDividerLayout = ({ slide, colors }: { slide: any; colors: any }) => (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
        <AbstractShapes colors={colors} />

        <div className="relative z-10 flex items-center justify-center h-full px-20 pb-32">
            <h2 className="text-7xl md:text-8xl font-bold text-center" style={{ color: colors.primary }}>
                {slide.title}
            </h2>
        </div>

        <SlideFooter title={slide.title} slideNumber={2} colors={colors} />
    </div>
);

// Content with bullets layout
const ContentBulletsLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const bullets = slide.bullets || slide.content?.bullets || [];
    const subtitle = slide.subtitle || slide.content?.subtitle || slide.content?.text;

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-6xl md:text-7xl font-bold mb-16" style={{ color: colors.text }}>
                    {slide.title}
                </h2>

                <div className="flex-1 flex flex-col md:flex-row gap-16">
                    <div className="flex-1 space-y-8">
                        {subtitle && (
                            <p className="text-3xl mb-8 opacity-70" style={{ color: colors.text }}>{subtitle}</p>
                        )}

                        {bullets.length > 0 && (
                            <ul className="space-y-6">
                                {bullets.map((bullet: string, i: number) => (
                                    <li key={i} className="flex items-start gap-6">
                                        <span className="w-3 h-3 rounded-full mt-3 flex-shrink-0" style={{ backgroundColor: colors.primary }} />
                                        <span className="text-2xl leading-relaxed opacity-90" style={{ color: colors.text }}>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {slide.backgroundImage && !slide.backgroundImage.includes('placehold') && (
                        <div className="w-full md:w-96 flex items-center justify-center">
                            <div className="w-80 h-80 rounded-3xl overflow-hidden border-4 border-primary/20 shadow-2xl">
                                <img
                                    src={slide.backgroundImage}
                                    alt={slide.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={3} colors={colors} />
        </div>
    );
};

// Stats/Metrics layout - Big numbers
const StatsLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const stats = slide.stats || slide.content?.stats || slide.metrics || slide.content?.metrics || [];

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
                <h2 className="text-6xl md:text-7xl font-bold mb-16 text-center" style={{ color: colors.text }}>
                    {slide.title}
                </h2>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.slice(0, 4).map((stat: any, i: number) => (
                        <div
                            key={i}
                            className="bg-surface/80 backdrop-blur-md rounded-3xl p-8 border border-border shadow-lg flex flex-col items-center justify-center text-center"
                        >
                            <p className="text-5xl md:text-6xl font-bold mb-4" style={{ color: colors.primary }}>{stat.value}</p>
                            <p className="text-xl opacity-80" style={{ color: colors.text }}>{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={4} colors={colors} />
        </div>
    );
};

// Chart layout - Data visualization
const ChartLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const chart = slide.chart || slide.content?.chart;

    // Generate dynamic chart colors from theme palette
    const generateChartColors = () => {
        const baseColors = [colors.primary, colors.secondary, colors.accent];
        const variations: string[] = [];

        // Create variations by adjusting opacity/brightness
        baseColors.forEach(color => {
            variations.push(color);
            // Add a lighter version
            variations.push(color + 'CC'); // 80% opacity variant
        });

        // Fallback if we need more colors
        while (variations.length < 10) {
            variations.push(colors.primary);
        }

        return variations;
    };

    const chartColors = generateChartColors();

    // Debug logging
    console.log('[ChartLayout] Slide:', slide.title);
    console.log('[ChartLayout] Chart data:', chart);

    // Helper to safely extract data array from various formats
    const getDataArray = (): number[] => {
        if (!chart?.series) return [];

        // If series is an array of numbers directly
        if (Array.isArray(chart.series) && typeof chart.series[0] === 'number') {
            return chart.series;
        }

        // If series[0].data is an array of numbers
        if (chart.series[0]?.data && Array.isArray(chart.series[0].data)) {
            return chart.series[0].data;
        }

        // If series is an array of objects with value property
        if (Array.isArray(chart.series) && typeof chart.series[0] === 'object' && chart.series[0]?.value !== undefined) {
            return chart.series.map((s: any) => s.value || 0);
        }

        console.warn('[ChartLayout] Unable to extract data array from series:', chart.series);
        return [];
    };

    const dataArray = getDataArray();

    // Calculate pie chart segments as conic-gradient
    const getPieGradient = () => {
        if (dataArray.length === 0) return `conic-gradient(${colors.primary} 100%)`;

        const total = dataArray.reduce((a: number, b: number) => a + b, 0);
        if (total === 0) return `conic-gradient(${colors.primary} 100%)`;

        let currentAngle = 0;

        const segments = dataArray.map((value: number, i: number) => {
            const startAngle = currentAngle;
            const percentage = (value / total) * 360;
            currentAngle += percentage;
            return `${chartColors[i % chartColors.length]} ${startAngle}deg ${currentAngle}deg`;
        });

        return `conic-gradient(${segments.join(', ')})`;
    };

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-10"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'multiply'
                        }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-5xl md:text-6xl font-bold mb-8" style={{ color: colors.text }}>
                    {slide.title}
                </h2>

                {chart ? (
                    <div className="flex-1 flex items-center justify-center">
                        {/* Bar chart */}
                        {(chart.type === 'bar' || !chart.type) && (
                            <div className="w-full max-w-4xl">
                                <h3 className="text-2xl font-semibold mb-8 text-center" style={{ color: colors.text }}>{chart.title}</h3>
                                <div className="flex items-end justify-center gap-8 h-[400px]">
                                    {chart.categories?.map((cat: string, i: number) => {
                                        const maxVal = Math.max(...(chart.series?.[0]?.data || [100]));
                                        const value = chart.series?.[0]?.data?.[i] || 0;
                                        const height = (value / maxVal) * 100;
                                        return (
                                            <div key={i} className="flex flex-col items-center gap-4 flex-1">
                                                <span className="text-xl font-bold" style={{ color: chartColors[i % chartColors.length] }}>{value}</span>
                                                <div
                                                    className="w-full max-w-24 rounded-t-xl transition-all shadow-lg"
                                                    style={{
                                                        height: `${height * 3}px`,
                                                        backgroundColor: chartColors[i % chartColors.length],
                                                        boxShadow: `0 4px 20px ${chartColors[i % chartColors.length]}40`
                                                    }}
                                                />
                                                <span className="text-lg" style={{ color: colors.text, opacity: 0.7 }}>{cat}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pie/Donut chart with actual colored segments */}
                        {(chart.type === 'pie' || chart.type === 'donut') && (
                            <div className="flex items-center gap-16">
                                <div
                                    className="w-80 h-80 rounded-full relative flex items-center justify-center shadow-2xl"
                                    style={{ background: getPieGradient() }}
                                >
                                    {chart.type === 'donut' && (
                                        <div className="w-40 h-40 rounded-full shadow-inner" style={{ backgroundColor: colors.bg }} />
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {chart.categories?.map((cat: string, i: number) => {
                                        const value = dataArray[i] || 0;
                                        const total = dataArray.reduce((a: number, b: number) => a + b, 0) || 1;
                                        const percentage = Math.round((value / total) * 100);
                                        return (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded shadow-sm" style={{ backgroundColor: chartColors[i % chartColors.length] }} />
                                                <span className="text-xl" style={{ color: colors.text }}>
                                                    {cat}: <strong>{value}</strong> ({percentage}%)
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Line chart */}
                        {chart.type === 'line' && (
                            <div className="w-full max-w-4xl">
                                <h3 className="text-2xl font-semibold mb-8 text-center" style={{ color: colors.text }}>{chart.title}</h3>
                                <div className="relative h-[400px] border-l-2 border-b-2" style={{ borderColor: `${colors.text}30` }}>
                                    {/* Y-axis values */}
                                    <div className="absolute -left-16 top-0 bottom-0 flex flex-col justify-between text-sm" style={{ color: colors.text, opacity: 0.7 }}>
                                        {[100, 75, 50, 25, 0].map((v, i) => (
                                            <span key={i}>{Math.round((Math.max(...(chart.series?.[0]?.data || [100])) * v) / 100)}</span>
                                        ))}
                                    </div>
                                    {/* Data points and lines */}
                                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        {chart.series?.map((series: any, seriesIdx: number) => {
                                            const maxVal = Math.max(...(series.data || [100]));
                                            const points = series.data?.map((val: number, i: number) => {
                                                const x = (i / (series.data.length - 1)) * 100;
                                                const y = 100 - (val / maxVal) * 100;
                                                return `${x},${y}`;
                                            }).join(' ');
                                            return (
                                                <polyline
                                                    key={seriesIdx}
                                                    points={points}
                                                    fill="none"
                                                    stroke={chartColors[seriesIdx % chartColors.length]}
                                                    strokeWidth="3"
                                                />
                                            );
                                        })}
                                    </svg>
                                </div>
                                <div className="flex justify-between mt-4" style={{ color: colors.text, opacity: 0.7 }}>
                                    {chart.categories?.map((cat: string, i: number) => (
                                        <span key={i} className="text-sm">{cat}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-2xl" style={{ color: colors.text, opacity: 0.5 }}>
                        Chart data not available (layout: {slide.layout}, has chart: {!!chart})
                    </div>
                )}
            </div>

            <SlideFooter title={slide.title} slideNumber={5} colors={colors} />
        </div>
    );
};


// Table layout - Modern glassmorphism design (Variants: default, striped, minimal)
const TableLayout = ({ slide, colors, variant = 'default' }: { slide: any; colors: any, variant?: 'default' | 'striped' | 'minimal' }) => {
    const table = slide.table || slide.content?.table;

    const isStriped = variant === 'striped';
    const isMinimal = variant === 'minimal';

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col items-center justify-center px-16 py-12 h-full">
                <h2 className="text-5xl md:text-6xl font-bold mb-12 text-center" style={{ color: colors.text }}>
                    {slide.title}
                </h2>

                {table ? (
                    <div className={`w-full max-w-6xl overflow-hidden ${isMinimal ? '' : 'rounded-3xl shadow-2xl border backdrop-blur-md'}`}
                        style={{
                            backgroundColor: isMinimal ? 'transparent' : `${colors.bg}90`,
                            borderColor: `${colors.primary}30`,
                            boxShadow: isMinimal ? 'none' : `0 25px 50px -12px ${colors.primary}20`
                        }}>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: isMinimal ? 'transparent' : colors.primary }}>
                                    {table.columns?.map((col: string, i: number) => (
                                        <th
                                            key={i}
                                            className={`px-8 py-6 text-left text-lg font-bold uppercase tracking-wider ${isMinimal ? 'border-b-2' : ''}`}
                                            style={{
                                                color: isMinimal ? colors.primary : '#ffffff',
                                                borderColor: colors.primary
                                            }}
                                        >
                                            {col}
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
                                            backgroundColor: isStriped && rowIdx % 2 === 0 ? `${colors.primary}08` : 'transparent',
                                            borderBottom: `1px solid ${colors.text}10`
                                        }}
                                    >
                                        {row.map((cell: string, cellIdx: number) => (
                                            <td
                                                key={cellIdx}
                                                className="px-8 py-5 text-lg"
                                                style={{ color: colors.text }}
                                            >
                                                {cell}
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

            <SlideFooter title={slide.title} slideNumber={6} colors={colors} />
        </div>
    );
};


// Timeline layout - Process steps (Variants: default, vertical, zigzag)
const TimelineLayout = ({ slide, colors, variant = 'default' }: { slide: any; colors: any, variant?: 'default' | 'vertical' | 'zigzag' }) => {
    const timeline = slide.timeline || slide.content?.timeline;
    const items = timeline?.items || [];

    const isVertical = variant === 'vertical';

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-15"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'multiply'
                        }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className={`text-5xl md:text-6xl font-bold mb-16 ${isVertical ? 'text-left pl-12' : 'text-center'}`} style={{ color: colors.text }}>
                    {slide.title}
                </h2>

                <div className="flex-1 flex items-center justify-center">

                    {/* VERTICAL VARIANT */}
                    {isVertical ? (
                        <div className="relative w-full max-w-4xl h-full overflow-y-auto pr-8">
                            <div className="absolute top-0 bottom-0 left-8 w-1" style={{ backgroundColor: `${colors.primary}40` }} />
                            <div className="space-y-12">
                                {items.map((item: any, i: number) => (
                                    <div key={i} className="relative flex items-start gap-12 ml-6">
                                        <div className="absolute left-0 w-5 h-5 -ml-[10px] rounded-full border-4 z-10 mt-2" style={{ backgroundColor: colors.bg, borderColor: colors.primary }} />
                                        <div className="w-24 pt-1 text-right font-bold text-xl" style={{ color: colors.primary }}>{item.date}</div>
                                        <div className="flex-1 pb-8 border-b border-gray-100/10">
                                            <h4 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>{item.title}</h4>
                                            <p className="text-lg opacity-80" style={{ color: colors.text }}>{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* HORIZONTAL / DEFAULT VARIANT */
                        <div className="w-full relative">
                            {/* Timeline line */}
                            <div className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2" style={{ backgroundColor: `${colors.primary}40` }} />

                            {/* Timeline items */}
                            <div className="relative flex justify-between px-12">
                                {items.slice(0, 5).map((item: any, i: number) => (
                                    <div key={i} className={`flex flex-col items-center max-w-[240px] relative ${i % 2 === 0 ? '-top-12' : 'top-12'}`}>
                                        {/* Date */}
                                        <span className={`text-lg font-bold mb-4 ${i % 2 === 0 ? 'order-1' : 'order-3 mt-4'}`} style={{ color: colors.primary }}>{item.date}</span>

                                        {/* Circle node */}
                                        <div className={`w-6 h-6 rounded-full border-4 shadow-lg z-10 order-2`} style={{ backgroundColor: colors.primary, borderColor: colors.bg }} />

                                        {/* Content */}
                                        <div className={`text-center ${i % 2 === 0 ? 'order-3 mt-4' : 'order-1 mb-4'}`}>
                                            <h4 className="text-xl font-bold leading-tight" style={{ color: colors.text }}>{item.title}</h4>
                                            {item.description && (
                                                <p className="text-base mt-2 leading-snug" style={{ color: colors.text, opacity: 0.7 }}>{item.description}</p>
                                            )}
                                        </div>
                                        {/* Connector line to main axis */}
                                        <div className={`absolute left-1/2 w-0.5 h-12 bg-primary/30 -z-10 ${i % 2 === 0 ? 'top-[40px]' : 'bottom-[40px]'}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={7} colors={colors} />
        </div>
    );
};

// Comparison layout - Multiple variants
const ComparisonLayout = ({ slide, colors, variant = 'default' }: { slide: any; colors: any, variant?: 'default' | 'cards' | 'split' }) => {
    const comparison = slide.comparison || slide.content?.comparison;
    const columns = slide.columns || slide.content?.columns;

    const left = comparison?.left || columns?.[0];
    const right = comparison?.right || columns?.[1];

    const isSplit = variant === 'split';
    const isCards = variant === 'cards';

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            {!isSplit && <AbstractShapes colors={colors} />}

            {/* Split background */}
            {isSplit && (
                <div className="absolute inset-0 flex">
                    <div className="w-1/2 h-full" style={{ backgroundColor: colors.bg }} />
                    <div className="w-1/2 h-full opacity-10" style={{ backgroundColor: colors.primary }} />
                </div>
            )}

            <div className={`relative z-10 flex flex-col h-full ${isSplit ? '' : 'px-20 pt-16 pb-24'}`}>
                {!isSplit && (
                    <h2 className="text-5xl md:text-6xl font-bold mb-12 text-center" style={{ color: colors.text }}>
                        {slide.title}
                    </h2>
                )}

                {isSplit ? (
                    <div className="flex-1 flex w-full h-full">
                        {/* Left split */}
                        <div className="w-1/2 flex flex-col justify-center px-16 relative">
                            <div className="absolute top-24 left-16">
                                <h2 className="text-5xl font-bold mb-8" style={{ color: colors.text }}>{slide.title}</h2>
                            </div>
                            {left && (
                                <div className="mt-20">
                                    <h3 className="text-4xl font-bold mb-8" style={{ color: colors.text }}>{left.title}</h3>
                                    <ul className="space-y-6">
                                        {(left.items || []).map((item: string, j: number) => (
                                            <li key={j} className="flex items-start gap-4">
                                                <span className="w-3 h-3 rounded-full mt-2" style={{ backgroundColor: colors.primary }} />
                                                <span className="text-2xl opacity-90" style={{ color: colors.text }}>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        {/* Right split */}
                        <div className="w-1/2 flex flex-col justify-center px-16 relative bg-white/5">
                            {right && (
                                <div className="mt-20">
                                    <h3 className="text-4xl font-bold mb-8" style={{ color: colors.primary }}>{right.title}</h3>
                                    <ul className="space-y-6">
                                        {(right.items || []).map((item: string, j: number) => (
                                            <li key={j} className="flex items-start gap-4">
                                                <span className="w-3 h-3 rounded-full mt-2" style={{ backgroundColor: colors.primary }} />
                                                <span className="text-2xl opacity-90" style={{ color: colors.text }}>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`flex-1 grid grid-cols-2 gap-16 ${isCards ? 'items-stretch' : 'items-start'}`}>
                        {/* Standard/Cards Layout */}
                        {left && (
                            <div className={`${isCards ? 'bg-surface/50 backdrop-blur-md rounded-3xl p-10 border shadow-xl' : ''}`}
                                style={{ borderColor: `${colors.text}10` }}>
                                <h3 className="text-3xl font-bold mb-8 border-b pb-4" style={{ color: colors.text, borderColor: colors.primary }}>{left.title}</h3>
                                <ul className="space-y-5">
                                    {(left.items || []).map((item: string, j: number) => (
                                        <li key={j} className="flex items-start gap-4">
                                            <span className="text-xl" style={{ color: colors.text, opacity: 0.8 }}>• {item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {right && (
                            <div className={`${isCards ? 'bg-surface/80 backdrop-blur-md rounded-3xl p-10 border-2 shadow-2xl transform scale-105' : ''}`}
                                style={{ borderColor: colors.primary }}>
                                <h3 className="text-3xl font-bold mb-8 border-b pb-4" style={{ color: colors.primary, borderColor: colors.primary }}>{right.title}</h3>
                                <ul className="space-y-5">
                                    {(right.items || []).map((item: string, j: number) => (
                                        <li key={j} className="flex items-start gap-4">
                                            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0" style={{ backgroundColor: colors.primary }}>✓</span>
                                            <span className="text-xl font-medium" style={{ color: colors.text }}>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <SlideFooter title={slide.title} slideNumber={8} colors={colors} />
        </div>
    );
};

// Infographic layout - Funnels, pyramids, processes
// Infographic layout - Funnels, pyramids, processes
const InfographicLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const infographic = slide.infographic || slide.content?.infographic;
    const steps = infographic?.steps || [];
    const type = infographic?.type || 'funnel';

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

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-5xl md:text-6xl font-bold mb-12" style={{ color: colors.text }}>
                    {slide.title}
                </h2>

                <div className="flex-1 flex items-center justify-center">
                    {type === 'funnel' && (
                        <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
                            {steps.slice(0, 5).map((step: any, i: number) => {
                                const widthPercent = 100 - i * 15;
                                return (
                                    <div
                                        key={i}
                                        className="h-20 rounded-lg flex items-center justify-center text-white font-bold text-xl transition-all shadow-lg backdrop-blur-sm bg-opacity-90"
                                        style={{
                                            width: `${widthPercent}%`,
                                            backgroundColor: getStepColor(i),
                                            color: '#ffffff' // Always white text on colored bars
                                        }}
                                    >
                                        <span className="drop-shadow-md">{step.label}: {step.value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {type === 'process' && (
                        <div className="flex items-center gap-6 w-full justify-center">
                            {steps.slice(0, 5).map((step: any, i: number) => (
                                <div key={i} className="flex items-center">
                                    <div
                                        className="w-36 h-36 rounded-2xl flex flex-col items-center justify-center text-white p-4 shadow-xl"
                                        style={{ backgroundColor: getStepColor(i) }}
                                    >
                                        <span className="text-4xl font-bold">{i + 1}</span>
                                        <span className="text-sm text-center mt-2 font-medium">{step.label}</span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className="w-12 h-1 mx-2 opacity-30" style={{ backgroundColor: colors.text }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {type === 'pyramid' && (
                        <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
                            {steps.slice(0, 5).reverse().map((step: any, i: number) => {
                                const widthPercent = 30 + i * 15;
                                return (
                                    <div
                                        key={i}
                                        className="h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md"
                                        style={{
                                            width: `${widthPercent}%`,
                                            backgroundColor: getStepColor(steps.length - 1 - i),
                                        }}
                                    >
                                        {step.label}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={9} colors={colors} />
        </div>
    );
};

// Quote layout - Testimonial or key quote
// Quote layout - Testimonial or key quote
// Text Heavy Layout - 3 Columns with Icons
const ThreeColumnTextLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const content = slide.content?.text || slide.text || slide.description || "";
    // Split content into 3 rough chunks if it's a long string, or use existing chunks
    const chunks = Array.isArray(content) ? content : content.split('. ').reduce((acc: any[], sentence: string, i: number) => {
        if (i % 3 === 0) acc.push(sentence);
        else acc[acc.length - 1] += '. ' + sentence;
        return acc;
    }, []);

    const columns = chunks.slice(0, 3).map((text: string) => text.trim()).filter(Boolean);

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            {/* Background Image if available */}
            {(slide.backgroundImage || slide.imageSearchQuery) && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-10"
                        style={{
                            backgroundImage: `url(${slide.backgroundImage || `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}`})`,
                            mixBlendMode: 'multiply'
                        }}
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-5xl md:text-6xl font-bold mb-16 text-center" style={{ color: colors.text }}>
                    {slide.title}
                </h2>

                <div className="flex-1 grid grid-cols-3 gap-12 items-start">
                    {columns.map((colText: string, i: number) => (
                        <div key={i} className="flex flex-col gap-6">
                            <div className="w-16 h-1 rounded-full opacity-50" style={{ backgroundColor: colors.primary }} />
                            <p className="text-xl leading-relaxed text-justify opacity-90" style={{ color: colors.text }}>
                                {colText.endsWith('.') ? colText : colText + '.'}
                            </p>
                        </div>
                    ))}
                    {columns.length === 0 && (
                        <p className="col-span-3 text-center text-2xl opacity-60">No text content available.</p>
                    )}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={10} colors={colors} />
        </div>
    );
};



// Image focus layout - Hero image with overlay
const ImageFocusLayout = ({ slide, colors }: { slide: any; colors: any }) => (
    <div className="relative w-full h-full overflow-hidden">
        {/* Full-bleed background image */}
        {slide.backgroundImage && !slide.backgroundImage.includes('placehold') ? (
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.backgroundImage})` }}
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
            <h2 className="text-7xl md:text-8xl font-bold mb-8">{slide.title}</h2>
            {(slide.subtitle || slide.content?.subtitle || slide.content?.text) && (
                <p className="text-3xl max-w-4xl">{slide.subtitle || slide.content?.subtitle || slide.content?.text}</p>
            )}
        </div>
    </div>
);

// Bento Grid Layout - Modern CSS Grid features
const BentoGridLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const items = slide.content?.items || slide.items || [];
    // Ensure we have at least 3 items to look good, max 5 for this specific layout
    const displayItems = items.slice(0, 5);

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} variant="bento" />

            <div className="relative z-10 flex flex-col px-16 py-12 h-full">
                <h2 className="text-5xl font-bold mb-8" style={{ color: colors.text }}>
                    {slide.title}
                </h2>

                <div className="flex-1 grid grid-cols-6 grid-rows-2 gap-6">
                    {displayItems.map((item: any, i: number) => {
                        // Dynamic spanning logic for bento feel
                        const isLarge = i === 0;
                        const isWide = i === 3;
                        const colSpan = isLarge ? "col-span-3" : isWide ? "col-span-3" : "col-span-2";
                        const rowSpan = isLarge ? "row-span-2" : "row-span-1";

                        return (
                            <div
                                key={i}
                                className={`${colSpan} ${rowSpan} rounded-3xl p-8 flex flex-col justify-between transition-all hover:scale-[1.02] border backdrop-blur-sm bg-white/5`}
                                style={{
                                    borderColor: `${colors.text}20`,
                                    boxShadow: `0 8px 32px 0 ${colors.text}05`
                                }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-80" style={{ backgroundColor: `${colors.secondary}20` }}>
                                        <span className="text-xl" role="img" aria-label="icon">✨</span>
                                    </div>
                                    {item.value && (
                                        <span className="text-2xl font-bold" style={{ color: colors.primary }}>{item.value}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>{item.title}</h3>
                                    {item.description && (
                                        <p className="text-lg opacity-70" style={{ color: colors.text }}>{item.description}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <SlideFooter title={slide.title} slideNumber={8} colors={colors} />
        </div>
    );
};

// Product Showcase Layout - Tech focused
const ProductShowcaseLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const items = slide.content?.items || slide.items || [];
    const mainImage = slide.backgroundImage || slide.imageSearchQuery ? `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery || 'technology')}` : null;

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            {/* Dark technical grid background */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `linear-gradient(${colors.text} 1px, transparent 1px), linear-gradient(90deg, ${colors.text} 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="relative z-10 flex flex-col h-full px-16 py-12">
                <div className="text-center mb-12">
                    <h2 className="text-5xl font-bold uppercase tracking-widest mb-4" style={{ color: colors.primary }}>
                        {slide.title}
                    </h2>
                    {slide.subtitle && (
                        <p className="text-xl opacity-80" style={{ color: colors.text }}>{slide.subtitle}</p>
                    )}
                </div>

                <div className="flex-1 relative flex items-center justify-center">
                    {/* Central Product Placeholder / Image */}
                    <div className="w-[600px] h-[400px] rounded-2xl relative z-20 shadow-2xl skew-x-12 border-2 group transition-all hover:skew-x-0 duration-700"
                        style={{
                            backgroundColor: colors.bg,
                            borderColor: colors.primary,
                            boxShadow: `0 0 50px ${colors.primary}40`
                        }}>
                        {mainImage && (
                            <img src={mainImage} alt="Product" className="w-full h-full object-cover rounded-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {!mainImage && <span className="text-4xl font-mono" style={{ color: colors.primary }}>PRODUCT_VIEW_[01]</span>}
                        </div>
                    </div>

                    {/* Floating Features */}
                    <div className="absolute inset-0 z-30 pointer-events-none">
                        {items.slice(0, 4).map((item: any, i: number) => {
                            // Position features in corners
                            const positions = [
                                'top-0 left-20',
                                'top-0 right-20',
                                'bottom-10 left-20',
                                'bottom-10 right-20'
                            ];
                            return (
                                <div key={i} className={`absolute ${positions[i]} max-w-xs pointer-events-auto`}>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-8 h-8 flex items-center justify-center border rounded-full" style={{ borderColor: colors.secondary, color: colors.secondary }}>
                                            {i + 1}
                                        </div>
                                        <h4 className="text-xl font-bold" style={{ color: colors.text }}>{item.title}</h4>
                                    </div>
                                    <div className="h-[1px] w-full mb-2 bg-gradient-to-r from-transparent via-primary to-transparent" style={{ backgroundImage: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)` }} />
                                    <p className="text-sm opacity-70" style={{ color: colors.text }}>{item.description || item.value}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <SlideFooter title={slide.title} slideNumber={9} colors={colors} />
        </div>
    );
};

// ============================================
// MASTER CONTENT LAYOUT - THE VARIATION ENGINE
// ============================================
// Supports: Classic, Split Card, Hero Block, Minimal Offset, Magazine
type MasterVariation = 'classic' | 'split-card' | 'hero-block' | 'minimal-offset' | 'magazine';

const MasterContentLayout = ({ slide, colors, variation = 'classic' }: { slide: any; colors: any; variation?: MasterVariation }) => {
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
                        <h2 className="text-5xl font-bold mb-8" style={{ color: colors.text }}>{slide.title}</h2>
                        {text && <p className="text-xl mb-6 opacity-90" style={{ color: colors.text }}>{text}</p>}
                        <ul className="space-y-4">
                            {bullets.map((b: string, i: number) => (
                                <li key={i} className="flex items-start gap-4">
                                    <div className="w-2 h-2 rounded-full mt-3 flex-shrink-0" style={{ backgroundColor: colors.primary }} />
                                    <span className="text-xl" style={{ color: colors.text }}>{b}</span>
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
                <SlideFooter title={slide.title} slideNumber={2} colors={colors} />
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
                        <h2 className="text-4xl font-bold mb-8" style={{ color: '#000000' }}>{slide.title}</h2>
                        <ul className="space-y-6">
                            {bullets.map((b: string, i: number) => (
                                <li key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-black/5 transition-colors">
                                    <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg" style={{ backgroundColor: colors.secondary, color: '#ffffff' }}>{i + 1}</span>
                                    <span className="text-lg font-medium opacity-80" style={{ color: '#000000' }}>{b}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
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
                        <h2 className="text-6xl font-bold shadow-sm" style={{ color: '#ffffff' }}>{slide.title}</h2>
                    </div>
                </div>
                <div className="flex-1 p-12 grid grid-cols-3 gap-8 items-start">
                    {bullets.slice(0, 3).map((b: string, i: number) => (
                        <div key={i} className="p-8 rounded-2xl border h-full" style={{ borderColor: `${colors.text}20`, backgroundColor: `${colors.bg}` }}>
                            <div className="w-12 h-1 h-1 mb-6" style={{ backgroundColor: colors.accent }} />
                            <p className="text-xl leading-relaxed" style={{ color: colors.text }}>{b}</p>
                        </div>
                    ))}
                </div>
                <SlideFooter title={slide.title} slideNumber={3} colors={colors} />
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
                        <h2 className="text-7xl font-black leading-tight mb-8" style={{ color: colors.text }}>
                            {slide.title.split(' ').map((word: string, i: number) => (
                                <span key={i} className="block">{word}</span>
                            ))}
                        </h2>
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
                                    <p className="text-2xl font-medium pt-2" style={{ color: colors.text }}>{b}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
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
                <h2 className="text-5xl font-light mb-16 leading-tight" style={{ color: colors.text }}>
                    {slide.title}
                </h2>
                <div className="grid grid-cols-2 gap-16">
                    {bullets.map((b: string, i: number) => (
                        <div key={i} className="flex flex-col">
                            <div className="w-full h-[1px] mb-4 opacity-30" style={{ backgroundColor: colors.text }} />
                            <p className="text-xl" style={{ color: colors.text }}>{b}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ============================================
// MASTER COVER LAYOUT - THE VARIATION ENGINE
// ============================================
type CoverVariation = 'centered-minimal' | 'full-split' | 'diagonal-hero' | 'typographic-giant' | 'boxed-modern' | 'gradient-mesh' | 'dark-tech' | 'offset-gallery' | 'floating-glass' | 'cinematic';

const MasterCoverLayout = ({ slide, colors, variation = 'centered-minimal' }: { slide: any; colors: any; variation?: CoverVariation }) => {
    const subtitle = slide.subtitle || slide.content?.subtitle || slide.title?.split(':')[1] || "Presentation Deck";
    const mainTitle = slide.title?.split(':')[0] || slide.title || "Untitled Presentation";
    const imageSrc = slide.backgroundImage || (slide.imageSearchQuery ? `https://source.unsplash.com/1600x900/?${encodeURIComponent(slide.imageSearchQuery)}` : null);

    // 1. CENTERED MINIMAL (Clean, safe)
    if (variation === 'centered-minimal') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center text-center p-20" style={{ backgroundColor: colors.bg }}>
                <AbstractShapes colors={colors} />
                <div className="relative z-10 max-w-4xl">
                    <div className="w-24 h-1 mb-12 mx-auto" style={{ backgroundColor: colors.primary }} />
                    <h1 className="text-7xl font-bold mb-8 tracking-tight" style={{ color: colors.text }}>{mainTitle}</h1>
                    <p className="text-3xl font-light opacity-80" style={{ color: colors.text }}>{subtitle}</p>
                </div>
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
                    <h1 className="text-7xl font-black mb-8 leading-tight" style={{ color: colors.text }}>{mainTitle}</h1>
                    <p className="text-2xl opacity-70 mb-12" style={{ color: colors.text }}>{subtitle}</p>
                    <div className="w-full h-px opacity-20" style={{ backgroundColor: colors.text }} />
                    <div className="flex gap-4 mt-8">
                        <div className="w-12 h-12 rounded-full border-2" style={{ borderColor: colors.primary }} />
                        <div className="w-12 h-12 rounded-full border-2" style={{ borderColor: colors.secondary }} />
                    </div>
                </div>
            </div>
        );
    }

    // 3. DIAGONAL HERO (Dynamic slice)
    if (variation === 'diagonal-hero') {
        return (
            <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.primary }}>
                <div className="absolute inset-0 w-full h-full bg-white z-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 45%)', backgroundColor: colors.bg }} />
                <div className="absolute z-10 top-20 left-20 max-w-3xl">
                    <h1 className="text-8xl font-black mb-4 drop-shadow-sm" style={{ color: colors.text }}>{mainTitle}</h1>
                    <p className="text-3xl font-medium" style={{ color: colors.secondary }}>{subtitle}</p>
                </div>
                {imageSrc && (
                    <div className="absolute bottom-0 right-0 w-2/3 h-2/3 object-cover z-20" style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' }}>
                        <img src={imageSrc} className="w-full h-full object-cover" alt="" />
                    </div>
                )}
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
                    <h1 className="text-[9rem] leading-[0.8] font-bold tracking-tighter" style={{ color: colors.bg }}>
                        {mainTitle}
                    </h1>
                    <p className="text-3xl font-mono text-right" style={{ color: colors.bg }}>// {subtitle}</p>
                </div>
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
                        <h1 className="text-6xl font-bold uppercase tracking-widest" style={{ color: colors.text }}>{mainTitle}</h1>
                    </div>
                    <p className="text-xl tracking-widest uppercase font-bold" style={{ color: colors.accent }}>{subtitle}</p>
                </div>
            </div>
        );
    }

    // 6. GRADIENT MESH (Trendy, colorful)
    if (variation === 'gradient-mesh') {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col justify-end p-20" style={{ backgroundColor: colors.bg }}>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] opacity-40 mix-blend-multiply" style={{ backgroundColor: colors.primary }} />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[100px] opacity-40 mix-blend-multiply" style={{ backgroundColor: colors.secondary }} />

                <div className="relative z-10 backdrop-blur-sm bg-white/10 p-12 rounded-2xl border border-white/20 max-w-4xl">
                    <h1 className="text-7xl font-bold mb-6" style={{ color: colors.text }}>{mainTitle}</h1>
                    <div className="h-2 w-32 rounded-full mb-6" style={{ backgroundColor: colors.accent }} />
                    <p className="text-2xl opacity-80" style={{ color: colors.text }}>{subtitle}</p>
                </div>
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
                        <h1 className="text-8xl font-bold text-transparent bg-clip-text mb-8" style={{ backgroundImage: `linear-gradient(to right, #ffffff, ${colors.primary})` }}>
                            {mainTitle}
                        </h1>
                        <p className="text-2xl font-mono border-l-2 border-gray-600 pl-6" style={{ color: '#9ca3af' }}>{subtitle}</p>
                    </div>
                </div>
                <div className="absolute bottom-10 right-10 flex gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 bg-white rounded-full opacity-50" />)}
                </div>
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
                        <h1 className="text-5xl font-bold" style={{ color: colors.primary }}>{mainTitle}</h1>
                    </div>
                </div>
                <div className="col-span-4 bg-black rounded-3xl p-8 flex items-end" style={{ backgroundColor: colors.secondary }}>
                    <p className="text-3xl font-medium leading-tight" style={{ color: '#ffffff' }}>{subtitle}</p>
                </div>
                <div className="col-span-4 rounded-3xl opacity-20" style={{ backgroundColor: colors.primary }} />
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
                    <h1 className="text-8xl font-serif mb-12 drop-shadow-lg" style={{ color: '#ffffff' }}>{mainTitle}</h1>
                    <button className="px-12 py-4 font-bold rounded-full hover:scale-105 transition-transform" style={{ backgroundColor: '#ffffff', color: '#000000' }}>START</button>
                </div>
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
                <h1 className="text-8xl font-bold mb-6 uppercase tracking-tight" style={{ color: '#ffffff' }}>{mainTitle}</h1>
                <p className="text-4xl font-light mr-12" style={{ color: '#d1d5db' }}>{subtitle} <span className="text-sm align-top opacity-50">©2025</span></p>
            </div>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ModernSlideRenderer = ({ slide, theme, className, colorPalette }: SlideRendererProps) => {
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
        // Debug logging
        const contentKeys = Object.keys(slide.content || {}).filter(k => slide.content[k]);
        console.log(`[SlideRenderer] Slide: "${slide.title}" | type: "${normalizedType}" | content keys: [${contentKeys.join(', ')}]`);

        // Smart content detection: check actual data presence before layout matching
        const hasChart = (slide.chart?.data?.length > 0 || slide.content?.chart?.data?.length > 0);
        const hasTable = (slide.table?.rows?.length > 0 || slide.content?.table?.rows?.length > 0);
        const hasTimeline = (slide.timeline?.items?.length > 0 || slide.content?.timeline?.items?.length > 0);
        const hasInfographic = (slide.infographic?.steps?.length > 0 || slide.content?.infographic?.steps?.length > 0);
        const hasComparison = (slide.comparison?.items?.length > 0 || slide.content?.comparison?.items?.length > 0) || (slide.columns?.length === 2);
        const hasStats = (slide.stats?.length > 0 || slide.metrics?.length > 0 || slide.content?.stats?.length > 0);
        const hasItems = (slide.items?.length > 0 || slide.content?.items?.length > 0);
        const hasQuote = (slide.quote?.text || slide.content?.quote?.text);

        let LayoutComponent: React.ComponentType<any> = MasterContentLayout; // Default to MasterContentLayout

        // PRIORITY 1: Content-based detection (what data actually exists)
        if (hasChart) {
            console.log('  → Matched: ChartLayout (has chart data)');
            LayoutComponent = ChartLayout;
        } else if (hasInfographic) {
            console.log('  → Matched: InfographicLayout (has infographic data)');
            LayoutComponent = InfographicLayout;
        } else if (hasTimeline) {
            console.log('  → Matched: TimelineLayout (has timeline data)');
            return <TimelineLayout slide={slide} colors={colors} />;
        }
        if (hasTable) {
            console.log('  → Matched: TableLayout (has table data)');
            return <TableLayout slide={slide} colors={colors} />;
        }
        if (hasComparison) {
            console.log('  → Matched: ComparisonLayout (has comparison data)');
            return <ComparisonLayout slide={slide} colors={colors} />;
        }
        if (hasStats) {
            console.log('  → Matched: StatsLayout (has stats data)');
            return <StatsLayout slide={slide} colors={colors} />;
        }
        if (hasItems && (normalizedType.includes('bento') || normalizedType.includes('grid'))) {
            console.log('  → Matched: BentoGridLayout (has items + bento/grid type)');
            return <BentoGridLayout slide={slide} colors={colors} />;
        }
        if (hasItems && items.length >= 3) {
            // Fallback to Bento if has items but not explicitly requested, 30% chance or if type is 'features'
            if (normalizedType.includes('feature') || Math.random() > 0.7) {
                console.log('  → Matched: BentoGridLayout (smart inference)');
                return <BentoGridLayout slide={slide} colors={colors} />;
            }
        }
        if (hasQuote) {
            console.log('  → Matched: ThreeColumnTextLayout (was QuoteLargeLayout)');
            return <ThreeColumnTextLayout slide={slide} colors={colors} />;
        }

        // PRIORITY 2: Layout type string matching (fallback)
        if (normalizedType.includes('showcase') || normalizedType.includes('product')) {
            console.log('  → Matched: ProductShowcaseLayout (explicit)');
            return <ProductShowcaseLayout slide={slide} colors={colors} />;
        }

        // Smart Injection: If theme is 'tech' or 'product' and has items, use Showcase occasionally
        if ((theme.includes('tech') || theme.includes('product')) && hasItems && items.length >= 3) {
            if (Math.random() > 0.6) {
                console.log('  → Matched: ProductShowcaseLayout (smart theme injection)');
                return <ProductShowcaseLayout slide={slide} colors={colors} />;
            }
        }



        // STANDARD CONTENT - SMART VARIATION ENGINE
        // Instead of returning generic bullets, pick a variation
        if (normalizedType.includes('content') || normalizedType.includes('bullet') || normalizedType === 'text') {
            console.log('  → Matched: MasterContentLayout (Smart Variation Engine)');

            // Use combination of slide index + title for variety but not total randomness
            // FIX: Made deterministic by removing Date.now() and Math.random()
            const salt = slide.id || slide.title || 'salt';
            const slideIndex = slide.index || 0;

            // Simple string hashing function
            const hashString = (str: string) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32bit integer
                }
                return Math.abs(hash);
            };

            const hash = hashString(salt + slideIndex);

            const variations: MasterVariation[] = ['classic', 'split-card', 'hero-block', 'magazine', 'minimal-offset'];

            // Deterministic pseudo-random number for theme decision (0-1 range)
            const pseudoRandom = (hash % 100) / 100;

            // Base choice based on hash
            let pickedIndex = hash % variations.length;
            let picked: MasterVariation = variations[pickedIndex];

            // Theme affinities are now SUGGESTIONS, not OVERRIDES (50% chance to use theme suggestion based on deterministic random)
            if (pseudoRandom > 0.5) {
                if (theme.includes('tech')) picked = variations[(pickedIndex + 1) % variations.length];
                else if (theme.includes('minimal')) picked = variations[(pickedIndex + 2) % variations.length];
                else if (theme.includes('creative')) picked = variations[(pickedIndex + 3) % variations.length];
            }

            console.log(`  → Picked variation: ${picked}`);
            return <MasterContentLayout slide={slide} colors={colors} variation={picked} />;
        }

        // Cover / Hero layouts
        if (normalizedType.includes('cover') || normalizedType.includes('hero')) {
            console.log('  → Matched: MasterCoverLayout (Smart Variation Engine)');

            // Use combination of slide index + title for variety
            const salt = slide.id || slide.title || 'cover';
            const slideIndex = slide.index || 0;

            // Simple string hashing function
            const hashString = (str: string) => {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash; // Convert to 32bit integer
                }
                return Math.abs(hash);
            };

            const hash = hashString(salt + slideIndex);

            const variations: CoverVariation[] = [
                'centered-minimal', 'full-split', 'diagonal-hero', 'typographic-giant',
                'boxed-modern', 'gradient-mesh', 'dark-tech', 'offset-gallery',
                'floating-glass', 'cinematic'
            ];

            // Deterministic pseudo-random number
            const pseudoRandom = (hash % 100) / 100;

            // Base choice
            let pickedIndex = hash % variations.length;
            let picked: CoverVariation = variations[pickedIndex];

            // Theme affinities are now SUGGESTIONS (50% chance)
            if (pseudoRandom > 0.5) {
                const offset = hash % 3;
                if (theme.includes('tech')) picked = variations[(pickedIndex + offset) % variations.length];
                else if (theme.includes('creative')) picked = variations[(pickedIndex + offset + 2) % variations.length];
                else if (theme.includes('minimal')) picked = variations[(pickedIndex + offset + 4) % variations.length];
                else if (theme.includes('corporate')) picked = variations[(pickedIndex + offset + 6) % variations.length];
            }

            console.log(`  → Picked cover variation: ${picked}`);
            return <MasterCoverLayout slide={slide} colors={colors} variation={picked} />;
        }

        // Section divider
        if (normalizedType.includes('section') || normalizedType.includes('divider')) {
            console.log('  → Matched: SectionDividerLayout (type contains section/divider)');
            return <SectionDividerLayout slide={slide} colors={colors} />;
        }

        // Stats/Metrics by type - STRICT CHECK
        if (normalizedType.includes('stat') || normalizedType.includes('metric') || normalizedType.includes('kpi')) {
            if (hasStats) {
                console.log('  → Matched: StatsLayout (type match + data verified)');
                return <StatsLayout slide={slide} colors={colors} />;
            }
            console.log('  → Fallback: Stats layout requested but no data -> transitioning to text layout');
        }

        // Chart by type - STRICT CHECK: Only if data exists, otherwise fallback to text
        if (normalizedType.includes('chart') || normalizedType.includes('graph')) {
            if (hasChart) {
                console.log('  → Matched: ChartLayout (type match + data verified)');
                return <ChartLayout slide={slide} colors={colors} />;
            } else {
                console.log('  → Fallback: Chart type requested but no data -> defaulting to Content/ThreeCol');
                // Fall through to default content handler
            }
        }

        // Timeline/Process by type - STRICT CHECK
        if (normalizedType.includes('timeline') || normalizedType.includes('roadmap') || normalizedType.includes('process')) {
            if (hasTimeline) {
                console.log('  → Matched: TimelineLayout (type match + data verified)');
                return <TimelineLayout slide={slide} colors={colors} />;
            } else if (hasInfographic) {
                return <InfographicLayout slide={slide} colors={colors} />;
            }
            // Fallback if no timeline data
            console.log('  → Fallback: Timeline type requested but no data -> defaulting to Content/ThreeCol');
        }

        // Comparison - STRICT CHECK
        if (normalizedType.includes('comparison') || normalizedType.includes('versus') || normalizedType.includes('before')) {
            if (hasComparison) {
                console.log('  → Matched: ComparisonLayout (type match + data verified)');
                return <ComparisonLayout slide={slide} colors={colors} />;
            }
            console.log('  → Fallback: Comparison layout requested but no data -> transitioning to text layout');
        }

        // Infographic
        if (normalizedType.includes('infographic') || normalizedType.includes('funnel') || normalizedType.includes('pyramid')) {
            console.log('  → Matched: InfographicLayout (type contains infographic/funnel/pyramid)');
            return <InfographicLayout slide={slide} colors={colors} />;
        }

        // Quote
        // Quote - Redirect to Text Columns
        if (normalizedType.includes('quote') || normalizedType.includes('testimonial')) {
            console.log('  → Matched: ThreeColumnTextLayout (was QuoteLargeLayout)');
            return <ThreeColumnTextLayout slide={slide} colors={colors} />;
        }

        // Bento grid
        if (normalizedType.includes('bento') || normalizedType.includes('grid') || normalizedType.includes('feature')) {
            console.log('  → Matched: BentoGridLayout (type contains bento/grid/feature)');
            return <BentoGridLayout slide={slide} colors={colors} />;
        }

        // Image focus
        if (normalizedType.includes('image') || normalizedType.includes('splash') || normalizedType.includes('full')) {
            console.log('  → Matched: ImageFocusLayout (type contains image/splash/full)');
            return <ImageFocusLayout slide={slide} colors={colors} />;
        }

        // Columns layout (legacy support)
        if (normalizedType.includes('column')) {
            console.log('  → Matched: ComparisonLayout (type contains column - legacy)');
            return <ComparisonLayout slide={slide} colors={colors} />;
        }

        // Bento fallback for items
        if (hasItems) {
            console.log('  → Matched: BentoGridLayout (has items data, fallback)');
            return <BentoGridLayout slide={slide} colors={colors} />;
        }

        // Default: Content with bullets
        console.log('  → Matched: ContentBulletsLayout (default fallback)');
        return <ContentBulletsLayout slide={slide} colors={colors} />;
    };

    return (
        <div
            className={cn("w-full h-full", className)}
            style={{
                backgroundColor: colors.bg,
                color: colors.text,
                '--slide-bg': colors.bg,
                '--slide-text': colors.text,
                '--slide-primary': colors.primary,
                '--slide-accent': colors.accent || colors.primary,
            } as React.CSSProperties}
        >
            {renderLayout()}
        </div>
    );
};


