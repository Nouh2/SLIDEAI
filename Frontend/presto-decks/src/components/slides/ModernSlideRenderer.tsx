// src/components/slides/ModernSlideRenderer.tsx
// Enhanced slide renderer with support for charts, tables, timelines, infographics
import { cn } from "@/lib/utils";
import { getTemplateById } from "@/data/slideTemplates";

interface SlideRendererProps {
    slide: any;
    theme: string;
    className?: string;
}

// ============================================
// HELPER COMPONENTS
// ============================================

// Abstract background shapes - subtle gradients
const AbstractShapes = ({ colors }: { colors: any }) => (
    <>
        <div
            className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
            style={{ background: `radial-gradient(circle, ${colors.primary}60, transparent)` }}
        />
        <div
            className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-10"
            style={{ background: `radial-gradient(circle, ${colors.primary}60, transparent)` }}
        />
        <div
            className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full blur-2xl opacity-8"
            style={{ background: `radial-gradient(circle, ${colors.primary}50, transparent)` }}
        />
    </>
);

// Slide footer with number
const SlideFooter = ({ slideNumber, title }: { slideNumber?: number; title: string }) => (
    <div className="absolute bottom-0 left-0 right-0 h-24 flex items-center justify-between px-12 border-t border-border/20">
        <span className="text-xl font-medium text-muted-foreground">{slideNumber || 1}</span>
        <span className="text-xl font-medium text-foreground/70">{title}</span>
        <span className="text-xl font-medium text-muted-foreground">2025</span>
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
                        <span key={i} className="text-gradient">{word} </span> :
                        <span key={i} className="text-foreground">{word} </span>;
                })}
            </h1>

            {(slide.subtitle || slide.content?.subtitle) && (
                <div className="inline-block px-12 py-6 rounded-full bg-surface border border-border shadow-md">
                    <p className="text-3xl text-foreground/80">{slide.subtitle || slide.content?.subtitle}</p>
                </div>
            )}

            {/* Key bullets if present */}
            {(slide.bullets?.length > 0 || slide.content?.bullets?.length > 0) && (
                <ul className="mt-10 space-y-3 text-left">
                    {(slide.bullets || slide.content?.bullets || []).slice(0, 4).map((bullet: string, i: number) => (
                        <li key={i} className="flex items-center gap-4">
                            <span className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-2xl text-foreground/80">{bullet}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        <SlideFooter title={slide.title} slideNumber={1} />
    </div>
);

// Section divider - Bold title slide
const SectionDividerLayout = ({ slide, colors }: { slide: any; colors: any }) => (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
        <AbstractShapes colors={colors} />

        <div className="relative z-10 flex items-center justify-center h-full px-20 pb-32">
            <h2 className="text-7xl md:text-8xl font-bold text-gradient text-center">
                {slide.title}
            </h2>
        </div>

        <SlideFooter title={slide.title} slideNumber={2} />
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
                <h2 className="text-6xl md:text-7xl font-bold text-foreground mb-16">
                    {slide.title}
                </h2>

                <div className="flex-1 flex flex-col md:flex-row gap-16">
                    <div className="flex-1 space-y-8">
                        {subtitle && (
                            <p className="text-3xl text-foreground/70 mb-8">{subtitle}</p>
                        )}

                        {bullets.length > 0 && (
                            <ul className="space-y-6">
                                {bullets.map((bullet: string, i: number) => (
                                    <li key={i} className="flex items-start gap-6">
                                        <span className="w-3 h-3 rounded-full mt-3 flex-shrink-0 bg-primary" />
                                        <span className="text-2xl text-foreground/90 leading-relaxed">{bullet}</span>
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

            <SlideFooter title={slide.title} slideNumber={3} />
        </div>
    );
};

// Stats/Metrics layout - Big numbers
const StatsLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const stats = slide.stats || slide.content?.stats || slide.metrics || slide.content?.metrics || [];

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-6xl md:text-7xl font-bold text-foreground mb-16 text-center">
                    {slide.title}
                </h2>

                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.slice(0, 4).map((stat: any, i: number) => (
                        <div
                            key={i}
                            className="bg-surface/80 backdrop-blur-md rounded-3xl p-8 border border-border shadow-lg flex flex-col items-center justify-center text-center"
                        >
                            <p className="text-5xl md:text-6xl font-bold text-gradient mb-4">{stat.value}</p>
                            <p className="text-xl text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={4} />
        </div>
    );
};

// Chart layout - Data visualization
const ChartLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const chart = slide.chart || slide.content?.chart;

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-8">
                    {slide.title}
                </h2>

                {chart ? (
                    <div className="flex-1 flex items-center justify-center">
                        {/* Simple bar chart visualization */}
                        {(chart.type === 'bar' || !chart.type) && (
                            <div className="w-full max-w-4xl">
                                <h3 className="text-2xl font-semibold text-foreground mb-8 text-center">{chart.title}</h3>
                                <div className="flex items-end justify-center gap-8 h-[400px]">
                                    {chart.categories?.map((cat: string, i: number) => {
                                        const maxVal = Math.max(...(chart.series?.[0]?.data || [100]));
                                        const value = chart.series?.[0]?.data?.[i] || 0;
                                        const height = (value / maxVal) * 100;
                                        return (
                                            <div key={i} className="flex flex-col items-center gap-4 flex-1">
                                                <span className="text-xl font-bold text-primary">{value}</span>
                                                <div
                                                    className="w-full max-w-24 rounded-t-xl transition-all"
                                                    style={{
                                                        height: `${height * 3}px`,
                                                        backgroundColor: colors.primary,
                                                    }}
                                                />
                                                <span className="text-lg text-muted-foreground">{cat}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Pie chart placeholder */}
                        {(chart.type === 'pie' || chart.type === 'donut') && (
                            <div className="flex items-center gap-16">
                                <div className="w-80 h-80 rounded-full border-[40px] relative" style={{ borderColor: colors.primary }}>
                                    {chart.type === 'donut' && (
                                        <div className="absolute inset-0 m-auto w-40 h-40 rounded-full" style={{ backgroundColor: colors.bg }} />
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {chart.categories?.map((cat: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded bg-primary" style={{ opacity: 1 - i * 0.2 }} />
                                            <span className="text-xl text-foreground">{cat}: {chart.series?.[0]?.data?.[i]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-2xl">
                        Chart data not available
                    </div>
                )}
            </div>

            <SlideFooter title={slide.title} slideNumber={5} />
        </div>
    );
};

// Table layout - Structured data
const TableLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const table = slide.table || slide.content?.table;

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-12">
                    {slide.title}
                </h2>

                {table ? (
                    <div className="flex-1 overflow-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    {table.columns?.map((col: string, i: number) => (
                                        <th
                                            key={i}
                                            className="px-8 py-6 text-left text-xl font-bold text-white bg-primary rounded-t-lg first:rounded-tl-2xl last:rounded-tr-2xl"
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {table.rows?.map((row: string[], rowIdx: number) => (
                                    <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? `${colors.primary}10` : colors.bg }}>
                                        {row.map((cell: string, cellIdx: number) => (
                                            <td
                                                key={cellIdx}
                                                className="px-8 py-5 text-lg text-foreground border-b border-border"
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
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-2xl">
                        Table data not available
                    </div>
                )}
            </div>

            <SlideFooter title={slide.title} slideNumber={6} />
        </div>
    );
};

// Timeline layout - Process steps
const TimelineLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const timeline = slide.timeline || slide.content?.timeline;
    const items = timeline?.items || [];

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-16">
                    {slide.title}
                </h2>

                <div className="flex-1 flex items-center">
                    <div className="w-full relative">
                        {/* Timeline line */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-primary/30 transform -translate-y-1/2" />

                        {/* Timeline items */}
                        <div className="relative flex justify-between">
                            {items.slice(0, 5).map((item: any, i: number) => (
                                <div key={i} className="flex flex-col items-center max-w-[200px]">
                                    {/* Date above */}
                                    <span className="text-lg font-bold text-primary mb-4">{item.date}</span>

                                    {/* Circle node */}
                                    <div className="w-8 h-8 rounded-full bg-primary border-4 border-background shadow-lg z-10" />

                                    {/* Title and description below */}
                                    <div className="mt-4 text-center">
                                        <h4 className="text-xl font-bold text-foreground">{item.title}</h4>
                                        {item.description && (
                                            <p className="text-base text-muted-foreground mt-2">{item.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={7} />
        </div>
    );
};

// Comparison layout - Before/After or A vs B
const ComparisonLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const comparison = slide.comparison || slide.content?.comparison;
    const columns = slide.columns || slide.content?.columns;

    // Support both comparison object and columns array
    const left = comparison?.left || columns?.[0];
    const right = comparison?.right || columns?.[1];

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-12 text-center">
                    {slide.title}
                </h2>

                <div className="flex-1 grid grid-cols-2 gap-12">
                    {/* Left side */}
                    {left && (
                        <div className="bg-surface/80 backdrop-blur-md rounded-3xl p-10 border border-border shadow-lg">
                            <h3 className="text-3xl font-bold text-foreground mb-6">{left.title}</h3>
                            {left.subtitle && (
                                <p className="text-xl text-muted-foreground mb-6">{left.subtitle}</p>
                            )}
                            <ul className="space-y-4">
                                {(left.items || []).map((item: string, j: number) => (
                                    <li key={j} className="flex items-start gap-4">
                                        <span className="w-3 h-3 rounded-full mt-2 bg-muted-foreground" />
                                        <span className="text-xl text-foreground/90">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Right side (highlighted) */}
                    {right && (
                        <div className="bg-primary/5 backdrop-blur-md rounded-3xl p-10 border-2 border-primary shadow-lg">
                            <h3 className="text-3xl font-bold text-primary mb-6">{right.title}</h3>
                            {right.subtitle && (
                                <p className="text-xl text-muted-foreground mb-6">{right.subtitle}</p>
                            )}
                            <ul className="space-y-4">
                                {(right.items || []).map((item: string, j: number) => (
                                    <li key={j} className="flex items-start gap-4">
                                        <span className="w-3 h-3 rounded-full mt-2 bg-primary" />
                                        <span className="text-xl text-foreground/90">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={8} />
        </div>
    );
};

// Infographic layout - Funnels, pyramids, processes
const InfographicLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const infographic = slide.infographic || slide.content?.infographic;
    const steps = infographic?.steps || [];
    const type = infographic?.type || 'funnel';

    const chartColors = ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'];

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-12">
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
                                        className="h-20 rounded-lg flex items-center justify-center text-white font-bold text-xl transition-all"
                                        style={{
                                            width: `${widthPercent}%`,
                                            backgroundColor: chartColors[i % chartColors.length],
                                        }}
                                    >
                                        {step.label}: {step.value}
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
                                        className="w-36 h-36 rounded-2xl flex flex-col items-center justify-center text-white p-4"
                                        style={{ backgroundColor: chartColors[i % chartColors.length] }}
                                    >
                                        <span className="text-4xl font-bold">{i + 1}</span>
                                        <span className="text-sm text-center mt-2">{step.label}</span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className="w-12 h-1 bg-muted-foreground mx-2" />
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
                                        className="h-16 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                                        style={{
                                            width: `${widthPercent}%`,
                                            backgroundColor: chartColors[(steps.length - 1 - i) % chartColors.length],
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

            <SlideFooter title={slide.title} slideNumber={9} />
        </div>
    );
};

// Quote layout - Testimonial or key quote
const QuoteLargeLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const quote = slide.quote || slide.content?.quote;

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-32 pb-32 text-center">
                <div className="text-9xl text-muted-foreground/20 mb-10">"</div>
                <p className="text-5xl md:text-6xl font-medium text-foreground mb-12 leading-relaxed">
                    {quote?.text || slide.title}
                </p>
                {quote?.author && (
                    <p className="text-3xl text-muted-foreground">
                        — {quote.author}{quote.role ? `, ${quote.role}` : ''}
                    </p>
                )}
            </div>

            <SlideFooter title="Quote" slideNumber={10} />
        </div>
    );
};

// Bento grid layout - Feature cards
const BentoGridLayout = ({ slide, colors }: { slide: any; colors: any }) => {
    const items = slide.items || slide.content?.items || [];
    const bullets = slide.bullets || slide.content?.bullets || [];

    // Convert bullets to items if no items exist
    const displayItems = items.length > 0 ? items :
        bullets.slice(0, 6).map((b: string, i: number) => ({ title: `Feature ${i + 1}`, value: b }));

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
            <AbstractShapes colors={colors} />

            <div className="relative z-10 flex flex-col px-20 pt-16 pb-24 h-full">
                <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-12">
                    {slide.title}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1">
                    {displayItems.slice(0, 6).map((item: any, i: number) => (
                        <div
                            key={i}
                            className="bg-surface/80 backdrop-blur-md rounded-3xl p-8 border border-border shadow-lg flex flex-col hover:shadow-xl hover:border-primary/30 transition-all"
                        >
                            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mb-4">
                                {String(i + 1).padStart(2, '0')}
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">{item.title}</h3>
                            <p className="text-lg text-muted-foreground flex-1">{item.value || item.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <SlideFooter title={slide.title} slideNumber={11} />
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

// ============================================
// MAIN COMPONENT
// ============================================

export const ModernSlideRenderer = ({ slide, theme, className }: SlideRendererProps) => {
    // Get template colors
    const template = getTemplateById(theme) || {
        colors: {
            primary: '#1fb6ff',
            secondary: '#1fb6ff',
            accent: '#1fb6ff',
            bg: '#ffffff',
            text: '#09090b',
        }
    };

    const colors = template.colors;
    const slideType = slide.type || slide.layout || 'content';
    const normalizedType = slideType.toLowerCase();

    // Determine if this is a dark theme based on the background color
    const isDarkTheme = colors.bg ? colors.bg.toLowerCase().startsWith('#0') ||
        colors.bg.toLowerCase().startsWith('#1') ||
        colors.bg.toLowerCase().startsWith('#2') : false;

    const renderLayout = () => {
        // Cover/Hero layouts
        if (normalizedType.includes('cover') || normalizedType.includes('hero')) {
            return <CoverHeroLayout slide={slide} colors={colors} />;
        }

        // Section divider
        if (normalizedType.includes('section') || normalizedType.includes('divider')) {
            return <SectionDividerLayout slide={slide} colors={colors} />;
        }

        // Stats/Metrics
        if (normalizedType.includes('stat') || normalizedType.includes('metric') || normalizedType.includes('kpi')) {
            return <StatsLayout slide={slide} colors={colors} />;
        }

        // Chart
        if (normalizedType.includes('chart') || normalizedType.includes('graph')) {
            return <ChartLayout slide={slide} colors={colors} />;
        }

        // Table
        if (normalizedType.includes('table') || normalizedType.includes('data')) {
            return <TableLayout slide={slide} colors={colors} />;
        }

        // Timeline
        if (normalizedType.includes('timeline') || normalizedType.includes('roadmap') || normalizedType.includes('process')) {
            return <TimelineLayout slide={slide} colors={colors} />;
        }

        // Comparison
        if (normalizedType.includes('comparison') || normalizedType.includes('versus') || normalizedType.includes('before')) {
            return <ComparisonLayout slide={slide} colors={colors} />;
        }

        // Infographic
        if (normalizedType.includes('infographic') || normalizedType.includes('funnel') || normalizedType.includes('pyramid')) {
            return <InfographicLayout slide={slide} colors={colors} />;
        }

        // Quote
        if (normalizedType.includes('quote') || normalizedType.includes('testimonial')) {
            return <QuoteLargeLayout slide={slide} colors={colors} />;
        }

        // Bento grid
        if (normalizedType.includes('bento') || normalizedType.includes('grid') || normalizedType.includes('feature')) {
            return <BentoGridLayout slide={slide} colors={colors} />;
        }

        // Image focus
        if (normalizedType.includes('image') || normalizedType.includes('splash') || normalizedType.includes('full')) {
            return <ImageFocusLayout slide={slide} colors={colors} />;
        }

        // Columns layout (legacy support)
        if (normalizedType.includes('column')) {
            return <ComparisonLayout slide={slide} colors={colors} />;
        }

        // Default: Content with bullets
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

