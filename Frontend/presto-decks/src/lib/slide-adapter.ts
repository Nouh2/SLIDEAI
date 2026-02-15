import { SlideData } from './api';

export type SlideLayoutType =
    | 'bullets' | 'bento' | 'columns' | 'quote'
    | 'chart-bar' | 'chart-pie' | 'stats-grid' | 'data-table'
    | 'section-center' | 'section-split' | 'section-number'
    | 'funnel' | 'process' | 'pyramid' | 'cycle-flow' | 'hub-spoke';

/**
 * Adapts a slide's content to a target layout structure.
 * This allows instant switching between visual styles without AI regeneration.
 */
export function adaptToLayout(slide: SlideData, targetType: SlideLayoutType): SlideData {
    // Deep clone to avoid mutating original
    const newSlide = JSON.parse(JSON.stringify(slide));
    if (!newSlide.content) newSlide.content = {};

    // Helper: Extract bullet points from any structure
    const getBullets = (s: any): string[] => {
        if (s.bullets && Array.isArray(s.bullets)) return s.bullets;
        if (s.content?.bullets && Array.isArray(s.content.bullets)) return s.content.bullets;

        // From Bento items
        if (s.items && Array.isArray(s.items)) return s.items.map((i: any) => i.description || i.title || '');
        if (s.content?.items && Array.isArray(s.content.items)) return s.content.items.map((i: any) => i.description || i.title || '');

        // From Columns
        if (s.content?.columns && Array.isArray(s.content.columns)) return s.content.columns.map((c: any) => c.content || c.title || '');

        // From String content
        if (typeof s.content === 'string') return s.content.split('\n').filter((l: string) => l.trim().length > 0);

        return [];
    };

    // Helper: Create Title/Description items from bullets
    const getItems = (s: any): any[] => {
        if (s.items && Array.isArray(s.items) && s.items.length > 0) return s.items;
        if (s.content?.items && Array.isArray(s.content.items) && s.content.items.length > 0) return s.content.items;

        const bullets = getBullets(s);
        return bullets.map((b: string) => {
            // Try to split title/desc if formatted like "Title: Description"
            const parts = b.split(':');
            if (parts.length > 1 && parts[0].length < 50) {
                return {
                    title: parts[0].trim(),
                    description: parts.slice(1).join(':').trim(),
                    icon: 'check'
                };
            }
            return {
                title: b.length > 40 ? b.substring(0, 30) + '...' : b,
                description: b,
                icon: 'check'
            };
        });
    };

    // CLEANUP: Remove conflicting data structures to force renderer detection
    delete newSlide.chart;
    delete newSlide.content.chart;
    delete newSlide.stats;
    delete newSlide.content.stats;
    delete newSlide.timeline;
    delete newSlide.content.timeline;
    delete newSlide.infographic;
    delete newSlide.content.infographic;
    delete newSlide.content.columns; // Clear columns unless target is columns
    // delete newSlide.content.items;   // Don't clear items aggressively, reused by bento
    // delete newSlide.items;
    delete newSlide.content.bullets;
    delete newSlide.bullets;

    // Explicit cleanups based on target to prevent "ghost" data matching
    if (targetType !== 'bento') {
        delete newSlide.items;
        delete newSlide.content.items;
    }

    switch (targetType) {
        case 'bento':
            newSlide.type = 'bento'; // Explicit type
            newSlide.content.items = getItems(slide);
            // Ensure enough items for a good grid (duplicate if few?)
            // No, rendering small grid is fine.
            break;

        case 'bullets':
            newSlide.type = 'content';
            newSlide.content.bullets = getBullets(slide);
            break;

        case 'columns':
            newSlide.type = 'text-column';
            const bullets = getBullets(slide);
            // Take up to 3-4 items for columns
            newSlide.content.columns = bullets.slice(0, 4).map((b, i) => {
                // Try to split title/desc
                const parts = b.split(':');
                if (parts.length > 1) {
                    return { title: parts[0].trim(), content: parts.slice(1).join(':').trim() };
                }
                return { title: `Point ${i + 1}`, content: b };
            });
            break;

        case 'quote':
            newSlide.type = 'content'; // Quote layout is often handled via content type + quote field
            const txt = getBullets(slide).join(' ');
            newSlide.quote = {
                text: txt.substring(0, 150) + (txt.length > 150 ? '...' : ''),
                author: 'Source',
            };
            break;

        // DATA FAMILY
        case 'chart-bar':
        case 'chart-pie':
            newSlide.type = 'chart';
            if (!newSlide.content) newSlide.content = {};
            newSlide.content.chartType = targetType === 'chart-bar' ? 'bar' : 'pie';
            // Try to preserve existing chart data, or fake it if missing?
            // Actually, if we are in Data Family, we assume data exists.

            // If we are switching from stats to chart, we might want to adapt stats -> chart data
            if (!newSlide.chart && !newSlide.content.chart && slide.stats) {
                // Adapt stats to chart
                newSlide.content.chart = {
                    labels: slide.stats.map((s: any) => s.label),
                    datasets: [{
                        label: 'Data',
                        data: slide.stats.map((s: any) => parseFloat(s.value) || 10)
                    }]
                };
            }
            break;

        case 'stats-grid':
            newSlide.type = 'stats';
            // reuse logic
            break;

        case 'data-table':
            newSlide.type = 'table';
            break;

        // SECTION FAMILY
        case 'section-center':
        case 'section-split':
        case 'section-number':
            newSlide.type = 'section';
            // Variations are handled by the renderer's hashing/random logic usually,
            // but we might want to force a specific variation prop if we supported it.
            // For now, setting type='section' is enough to trigger the Section Layout.
            // To force specific look, we'd need to pass a 'variation' prop override to the renderer
            // or modify the title to influence the hash (hacky).
            // Better: The renderer should accept a 'forcedVariation' prop.
            break;

        // INFOGRAPHIC FAMILY
        case 'funnel':
        case 'process':
        case 'pyramid':
        case 'cycle-flow':
        case 'hub-spoke':
            newSlide.type = 'infographic';
            // We need to construct 'steps' from whatever content we have
            const steps = getItems(slide);

            // Map to standard step format expected by InfographicLayout
            newSlide.content = {
                ...newSlide.content,
                type: targetType, // Sets internal type for the layout component
                steps: steps.map(s => ({
                    label: s.title || s.content || '',
                    description: s.description || '',
                    value: ''
                }))
            };

            // Set variation prop to help the renderer select the right component immediately
            newSlide.variation = targetType;
            break;
    }

    return newSlide;
}
