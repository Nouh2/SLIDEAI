// apps/worker/src/utils/sanitize.ts
// Content sanitization and validation utilities

import type { ThemeConfig } from '../config/themes';

/**
 * Represents a slide with all possible content types
 */
export interface SlideContent {
    subtitle?: string;
    text?: string;
    bullets?: string[];
    stats?: Array<{ value: string; label: string }>;
    items?: Array<{ title: string; value: string }>;
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
        steps: Array<{ label: string; value: number | string }>;
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
    notes?: string;
}

export interface Slide {
    layout: string;
    title: string;
    imageSearchQuery?: string;
    backgroundImage?: string;
    content: SlideContent;
}

export interface Deck {
    title: string;
    theme: string;
    themeConfig?: ThemeConfig;
    slides: Slide[];
}

/**
 * Ensure a slide has valid content and fallback if empty
 */
function ensureSlideContent(slide: Slide, index: number, deckTitle: string): Slide {
    const content = slide.content || {};
    const layout = (slide.layout || '').toLowerCase();

    // Ensure title exists
    if (!slide.title) {
        slide.title = `Slide ${index + 1}`;
    }

    // Ensure imageSearchQuery exists
    if (!slide.imageSearchQuery) {
        slide.imageSearchQuery = `${deckTitle} professional presentation`;
    }

    // Layout-specific content validation
    if (layout.includes('cover') || index === 0) {
        // Cover slides need at least a subtitle or bullets
        if (!content.subtitle && !(content.bullets && content.bullets.length > 0)) {
            content.subtitle = 'Transforming ideas into impact';
            content.bullets = ['Key insight 1', 'Key insight 2', 'Key insight 3'];
        }
    } else if (layout.includes('stat') || layout.includes('metric')) {
        // Stats slides need stats
        if (!content.stats || content.stats.length === 0) {
            content.stats = [
                { value: '+45%', label: 'Year-over-year growth' },
                { value: '99.9%', label: 'Uptime reliability' },
            ];
        }
    } else if (layout.includes('bento') || layout.includes('grid')) {
        // Bento slides need items
        if (!content.items || content.items.length === 0) {
            // Try to convert bullets to items
            if (content.bullets && content.bullets.length > 0) {
                content.items = content.bullets.slice(0, 6).map((b, i) => ({
                    title: `Point ${i + 1}`,
                    value: b,
                }));
            } else {
                content.items = [
                    { title: 'Feature 1', value: 'Description of feature 1' },
                    { title: 'Feature 2', value: 'Description of feature 2' },
                    { title: 'Feature 3', value: 'Description of feature 3' },
                    { title: 'Feature 4', value: 'Description of feature 4' },
                ];
            }
        }
    } else if (layout.includes('chart')) {
        // Chart slides need chart data
        if (!content.chart) {
            content.chart = {
                type: 'bar',
                title: 'Performance Metrics',
                categories: ['Q1', 'Q2', 'Q3', 'Q4'],
                series: [{ name: 'Value', data: [65, 78, 90, 110] }],
            };
        }
    } else if (layout.includes('table')) {
        // Table slides need table data
        if (!content.table) {
            content.table = {
                columns: ['Item', 'Status', 'Progress'],
                rows: [
                    ['Task 1', 'Complete', '100%'],
                    ['Task 2', 'In Progress', '75%'],
                    ['Task 3', 'Pending', '0%'],
                ],
            };
        }
    } else if (layout.includes('timeline')) {
        // Timeline slides need timeline items
        if (!content.timeline) {
            content.timeline = {
                items: [
                    { date: 'Phase 1', title: 'Planning', description: 'Initial setup' },
                    { date: 'Phase 2', title: 'Development', description: 'Build and test' },
                    { date: 'Phase 3', title: 'Launch', description: 'Go live' },
                ],
            };
        }
    } else if (layout.includes('comparison')) {
        // Comparison slides need comparison data
        if (!content.comparison) {
            content.comparison = {
                left: { title: 'Before', items: ['Manual process', 'Time-consuming', 'Error-prone'] },
                right: { title: 'After', items: ['Automated', 'Fast', 'Accurate'] },
            };
        }
    } else if (layout.includes('infographic') || layout.includes('funnel')) {
        // Infographic slides need infographic data
        if (!content.infographic) {
            content.infographic = {
                type: 'funnel',
                steps: [
                    { label: 'Awareness', value: 10000 },
                    { label: 'Interest', value: 5000 },
                    { label: 'Decision', value: 1000 },
                    { label: 'Action', value: 500 },
                ],
            };
        }
    } else if (layout.includes('quote')) {
        // Quote slides need quote content
        if (!content.quote) {
            content.quote = {
                text: 'Innovation distinguishes between a leader and a follower.',
                author: 'Steve Jobs',
            };
        }
    } else {
        // Default content layout needs bullets
        if (!content.bullets || content.bullets.length === 0) {
            content.bullets = [
                `${slide.title}: Key point 1`,
                `${slide.title}: Key point 2`,
                `${slide.title}: Key point 3`,
            ];
        }
    }

    slide.content = content;
    return slide;
}

/**
 * Ensure a deck has required content variety
 * Transforms slides if needed to ensure layout diversity
 */
function ensureDeckVariety(deck: Deck): Deck {
    const slides = deck.slides || [];

    // Track layout usage
    const layoutCounts: Record<string, number> = {};
    let hasStats = false;
    let hasChart = false;
    let hasBento = false;

    slides.forEach((slide) => {
        const layout = (slide.layout || '').toLowerCase();
        layoutCounts[layout] = (layoutCounts[layout] || 0) + 1;

        if (layout.includes('stat')) hasStats = true;
        if (layout.includes('chart')) hasChart = true;
        if (layout.includes('bento') || layout.includes('grid')) hasBento = true;
    });

    // If no stats slide and we have more than 4 slides, convert one
    if (!hasStats && slides.length > 4) {
        const idx = Math.min(2, slides.length - 1);
        slides[idx].layout = 'stats';
        slides[idx].content = slides[idx].content || {};
        if (!slides[idx].content.stats) {
            slides[idx].content.stats = [
                { value: '+150%', label: 'Key metric growth' },
                { value: '98%', label: 'Customer satisfaction' },
            ];
        }
    }

    // If no bento grid and we have more than 5 slides, convert one
    if (!hasBento && slides.length > 5) {
        const idx = Math.min(3, slides.length - 2);
        if (!slides[idx].layout.includes('stat') && !slides[idx].layout.includes('cover')) {
            slides[idx].layout = 'bento';
            slides[idx].content = slides[idx].content || {};
            const bullets = slides[idx].content.bullets || [];
            slides[idx].content.items = bullets.slice(0, 4).map((b: string, i: number) => ({
                title: `Feature ${i + 1}`,
                value: b,
            }));
        }
    }

    deck.slides = slides;
    return deck;
}

/**
 * Main sanitization function
 * Ensures deck has valid structure and content
 */
export function sanitizeDeck(deck: any, deckTitle?: string): Deck {
    const title = deck?.title || deckTitle || 'Presentation';

    // Ensure slides array exists
    if (!deck?.slides || !Array.isArray(deck.slides) || deck.slides.length === 0) {
        deck = {
            title,
            theme: deck?.theme || 'startup-pitch',
            slides: [
                {
                    layout: 'cover',
                    title: title,
                    imageSearchQuery: 'professional presentation business',
                    content: {
                        subtitle: 'Generated presentation',
                        bullets: ['Key insight 1', 'Key insight 2'],
                    },
                },
            ],
        };
    }

    // Ensure each slide has valid layout
    deck.slides = deck.slides.map((slide: any, index: number) => {
        if (!slide.layout) {
            slide.layout = index === 0 ? 'cover' : 'bullets';
        }
        return ensureSlideContent(slide, index, title);
    });

    // Ensure deck has layout variety
    deck = ensureDeckVariety(deck);

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
