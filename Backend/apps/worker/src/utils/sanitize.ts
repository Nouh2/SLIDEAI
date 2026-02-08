// apps/worker/src/utils/sanitize.ts
// Content sanitization, validation, and NORMALIZATION utilities
// This is the "DOUANIER" - it ensures all AI output is converted to standard format

import type { ThemeConfig } from '../config/themes';

/**
 * Represents a slide with all possible content types (STANDARD FORMAT)
 */
export interface SlideContent {
    subtitle?: string;
    text?: string;
    bullets?: string[];
    stats?: Array<{ value: string; label: string }>;
    items?: Array<{ title: string; description?: string; value?: string; image?: string }>;
    chart?: {
        type: 'bar' | 'line' | 'pie' | 'donut' | 'area';
        title?: string;
        categories: string[];
        series: Array<{ name: string; data: number[] }>;
    };
    table?: {
        columns: string[];
        rows: string[][];
    };
    timeline?: {
        items: Array<{ date: string; title: string; description?: string }>;
    };
    infographic?: {
        type: 'funnel' | 'pyramid' | 'process';
        steps: Array<{ label: string; value?: number | string }>;
    };
    comparison?: {
        left: { title: string; subtitle?: string; items: string[] };
        right: { title: string; subtitle?: string; items: string[] };
    };
    quote?: {
        text: string;
        author?: string;
        role?: string;
    };
    columns?: Array<{ title?: string; header?: string; text?: string; body?: string }>;
    notes?: string;
}

export interface Slide {
    id?: string;
    layout: string;
    title: string;
    imageSearchQuery?: string;
    backgroundImage?: string;
    sourceRef?: {
        sectionTitle: string;
        pageStart: number;
        pageEnd: number;
        originalText?: string;
    };
    content: SlideContent;
}

export interface Deck {
    id?: string;
    title: string;
    theme: string;
    colorPalette?: {
        primary: string;
        secondary: string;
        accent: string;
        bg: string;
        text: string;
    };
    themeConfig?: ThemeConfig;
    slides: Slide[];
    // Custom Templates data
    brandLogoUrl?: string;
    fontConfig?: {
        heading: string;
        body: string;
    };
    templateOverlay?: {
        logo?: {
            position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
            size: 'small' | 'medium' | 'large';
            showOnCover: boolean;
            showOnContent: boolean;
        };
        footer?: {
            text?: string;
            showPageNumber: boolean;
        };
    };
}

// ============================================
// NORMALIZATION FUNCTIONS (Per Layout Type)
// ============================================

/**
 * Normalize TIMELINE layout data
 * AI might send: events, steps, milestones, items
 * Standard format: timeline.items[{ date, title, description }]
 */
function normalizeTimeline(content: any): SlideContent {
    const sourceData = content.events || content.steps || content.milestones || content.timeline?.items || content.items || [];

    if (sourceData.length === 0) return content;

    const normalizedItems = sourceData.map((item: any) => ({
        date: item.date || item.time || item.year || '',
        title: item.event || item.title || item.name || item.milestone || '',
        description: item.description || item.details || item.text || ''
    }));

    return {
        ...content,
        timeline: { items: normalizedItems },
        // Clean up non-standard keys
        events: undefined,
        steps: undefined,
        milestones: undefined
    };
}

/**
 * Normalize STATS layout data
 * AI might send: stats, statistics, metrics, kpis
 * Standard format: stats[{ value, label }]
 */
function normalizeStats(content: any): SlideContent {
    const sourceData = content.stats || content.statistics || content.metrics || content.kpis || [];

    if (sourceData.length === 0) return content;

    const normalizedStats = sourceData.map((stat: any) => ({
        value: String(stat.value || stat.number || stat.metric || stat.figure || ''),
        label: stat.label || stat.title || stat.name || stat.description || ''
    }));

    return {
        ...content,
        stats: normalizedStats,
        // Clean up non-standard keys
        statistics: undefined,
        metrics: undefined,
        kpis: undefined
    };
}

/**
 * Normalize BENTO/GRID layout data
 * AI might send: items, features, cards, components
 * Standard format: items[{ title, description, value?, image? }]
 */
function normalizeBento(content: any): SlideContent {
    const sourceData = content.items || content.features || content.cards || content.components || content.elements || [];

    if (sourceData.length === 0) return content;

    const normalizedItems = sourceData.map((item: any) => ({
        title: item.title || item.name || item.header || '',
        description: item.description || item.text || item.body || item.content || '',
        value: item.value || item.metric || item.number || undefined,
        image: item.image || item.icon || item.img || undefined
    }));

    return {
        ...content,
        items: normalizedItems,
        // Clean up non-standard keys
        features: undefined,
        cards: undefined,
        components: undefined,
        elements: undefined
    };
}

/**
 * Normalize CHART layout data
 * AI might send: chart, labels+datasets, data+categories
 * Standard format: chart{ type, categories, series[{ name, data }] }
 */
function normalizeChart(content: any): SlideContent {
    // If already in standard format
    if (content.chart?.categories && content.chart?.series) {
        return content;
    }

    // AI format: labels + datasets
    if (content.labels && content.datasets) {
        const normalizedChart = {
            type: content.chartType || content.type || 'bar',
            title: content.chartTitle || content.title || '',
            categories: content.labels,
            series: content.datasets.map((ds: any) => ({
                name: ds.label || ds.name || 'Data',
                data: ds.data || []
            }))
        };

        return {
            ...content,
            chart: normalizedChart,
            // Clean up
            labels: undefined,
            datasets: undefined,
            chartType: undefined
        };
    }

    return content;
}

/**
 * Normalize TABLE layout data
 * AI might send: table, headers+rows
 * Standard format: table{ columns, rows }
 */
function normalizeTable(content: any): SlideContent {
    // If already in standard format
    if (content.table?.columns && content.table?.rows) {
        return content;
    }

    // AI format: headers + rows directly in content
    if (content.headers && content.rows) {
        return {
            ...content,
            table: {
                columns: content.headers,
                rows: content.rows
            },
            // Clean up
            headers: undefined
        };
    }

    return content;
}

/**
 * Normalize COMPARISON layout data
 * AI might send: comparison, leftTitle+leftBullets, columns
 * Standard format: comparison{ left: { title, items }, right: { title, items } }
 */
function normalizeComparison(content: any): SlideContent {
    // If already in standard format
    if (content.comparison?.left && content.comparison?.right) {
        return content;
    }

    // AI format: leftTitle/leftBullets + rightTitle/rightBullets
    if (content.leftTitle || content.rightTitle) {
        return {
            ...content,
            comparison: {
                left: {
                    title: content.leftTitle || 'Option A',
                    items: content.leftBullets || content.leftItems || content.leftPoints || []
                },
                right: {
                    title: content.rightTitle || 'Option B',
                    items: content.rightBullets || content.rightItems || content.rightPoints || []
                }
            },
            // Clean up
            leftTitle: undefined,
            leftBullets: undefined,
            leftItems: undefined,
            leftPoints: undefined,
            rightTitle: undefined,
            rightBullets: undefined,
            rightItems: undefined,
            rightPoints: undefined
        };
    }

    // AI format: columns array with 2 items
    if (content.columns?.length === 2 && !content.columns[0]?.body) {
        return {
            ...content,
            comparison: {
                left: {
                    title: content.columns[0].title || content.columns[0].header || 'Option A',
                    items: content.columns[0].items || content.columns[0].bullets || []
                },
                right: {
                    title: content.columns[1].title || content.columns[1].header || 'Option B',
                    items: content.columns[1].items || content.columns[1].bullets || []
                }
            }
        };
    }

    return content;
}

/**
 * Normalize INFOGRAPHIC layout data
 * AI might send: infographic, steps, phases, stages
 * Standard format: infographic{ type, steps[{ label, value? }] }
 */
function normalizeInfographic(content: any): SlideContent {
    // If already in standard format
    if (content.infographic?.steps) {
        return content;
    }

    // AI sends type + steps directly
    if (content.type && content.steps) {
        const normalizedSteps = content.steps.map((step: any) => {
            // Handle string steps
            if (typeof step === 'string') {
                return { label: step, value: undefined };
            }
            return {
                label: step.label || step.name || step.title || '',
                value: step.value || step.percent || step.number || undefined
            };
        });

        return {
            ...content,
            infographic: {
                type: content.type,
                steps: normalizedSteps
            },
            // Don't clean up type/steps as they might be referenced elsewhere
        };
    }

    return content;
}

/**
 * Normalize TEXT-COLUMNS layout data
 * AI might send: columns with header/body or title/text
 * Standard format: columns[{ title, text }]
 */
function normalizeTextColumns(content: any): SlideContent {
    if (!content.columns || content.columns.length === 0) return content;

    const normalizedColumns = content.columns.map((col: any) => ({
        title: col.header || col.title || '',
        text: col.body || col.text || col.content || ''
    }));

    return {
        ...content,
        columns: normalizedColumns
    };
}

/**
 * Normalize QUOTE layout data
 * AI might send: quote object, or quoteText/author directly
 * Standard format: quote{ text, author?, role? }
 */
function normalizeQuote(content: any): SlideContent {
    // If already in standard format
    if (content.quote?.text) {
        return content;
    }

    // AI sends quoteText/author directly
    if (content.quoteText || content.text) {
        return {
            ...content,
            quote: {
                text: content.quoteText || content.text || '',
                author: content.author || content.speaker || content.by || undefined,
                role: content.role || content.title || content.position || undefined
            },
            // Clean up
            quoteText: undefined,
            author: undefined,
            speaker: undefined,
            by: undefined,
            role: undefined
        };
    }

    return content;
}

// ============================================
// MASTER NORMALIZATION DISPATCHER
// ============================================

/**
 * Apply the correct normalization based on layout type
 */
function normalizeSlideContent(slide: Slide): Slide {
    const layout = slide.layout?.toLowerCase() || 'bullets';
    let content = slide.content || {};

    // Apply normalization based on layout
    switch (true) {
        case layout.includes('timeline') || layout.includes('roadmap'):
            content = normalizeTimeline(content);
            break;
        case layout.includes('stat') || layout.includes('metric') || layout.includes('kpi'):
            content = normalizeStats(content);
            break;
        case layout.includes('bento') || layout.includes('grid') || layout.includes('feature'):
            content = normalizeBento(content);
            break;
        case layout.includes('chart') || layout.includes('graph'):
            content = normalizeChart(content);
            break;
        case layout.includes('table'):
            content = normalizeTable(content);
            break;
        case layout.includes('comparison') || layout.includes('versus') || layout.includes('vs'):
            content = normalizeComparison(content);
            break;
        case layout.includes('infographic') || layout.includes('funnel') || layout.includes('pyramid') || layout.includes('process'):
            content = normalizeInfographic(content);
            break;
        case layout.includes('text-column') || layout.includes('column'):
            content = normalizeTextColumns(content);
            break;
        case layout.includes('quote') || layout.includes('testimonial'):
            content = normalizeQuote(content);
            break;
        default:
            // For other layouts (cover, bullets, image-focus, section), no special normalization needed
            break;
    }

    return { ...slide, content };
}

// ============================================
// MAIN SANITIZATION FUNCTION
// ============================================

/**
 * Ensure a slide has valid STRUCTURE (no fake content injection)
 */
function ensureSlideContent(slide: Slide, index: number, deckTitle: string): Slide {
    // Ensure content object exists
    if (!slide.content) {
        slide.content = {};
    }

    // Ensure title exists (minimal fallback)
    if (!slide.title) {
        slide.title = `Slide ${index + 1}`;
    }

    // Ensure imageSearchQuery exists for image fetching
    if (!slide.imageSearchQuery) {
        slide.imageSearchQuery = `${deckTitle} professional presentation`;
    }

    return slide;
}

/**
 * Main sanitization function
 * Ensures deck has valid structure and NORMALIZED content
 */
export function sanitizeDeck(deck: any, deckTitle?: string): Deck {
    const title = deck?.title || deckTitle || 'Presentation';

    // Only create fallback deck if AI returned nothing at all
    if (!deck?.slides || !Array.isArray(deck.slides) || deck.slides.length === 0) {
        console.warn('[Sanitize] ⚠️ AI returned empty slides - creating minimal fallback');
        deck = {
            title,
            theme: deck?.theme || 'startup-pitch',
            colorPalette: deck?.colorPalette,
            slides: [
                {
                    layout: 'cover',
                    title: title,
                    imageSearchQuery: 'professional presentation',
                    content: {
                        subtitle: 'Generated presentation',
                    },
                },
            ],
        };
    }

    // Process each slide: ensure structure + normalize content
    deck.slides = deck.slides.map((slide: any, index: number) => {
        if (!slide.layout) {
            slide.layout = index === 0 ? 'cover' : 'bullets';
        }

        // Step 1: Ensure basic structure
        slide = ensureSlideContent(slide, index, title);

        // Step 2: NORMALIZE content to standard format (THE KEY STEP)
        slide = normalizeSlideContent(slide);

        return slide;
    });

    console.log(`[Sanitize] ✅ Normalized ${deck.slides.length} slides`);

    return deck as Deck;
}

/**
 * Clean text for safe PPTX rendering
 * Removes problematic characters
 */
export function cleanText(text: string | undefined | null): string {
    if (!text) return '';
    return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\t/g, '    ') // Replace tabs with spaces
        .trim();
}
