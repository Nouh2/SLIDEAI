// src/lib/export/pptx/adapters/statsAdapter.ts
// Adapter for stats/metrics slides

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex, SLIDE_WIDTH, SLIDE_HEIGHT } from '../types';

export const statsAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        const hasStats = (
            (slide.stats && slide.stats.length > 0) ||
            (slide.metrics && slide.metrics.length > 0) ||
            (slide.content?.stats && slide.content.stats.length > 0) ||
            (slide.content?.statistics && slide.content.statistics.length > 0)
        );
        return (type.includes('stat') || type.includes('metric') || type.includes('kpi')) && hasStats;
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Background
        pptxSlide.background = { color: toHex(colors.bg) };

        // Get stats data
        const stats = slide.stats || slide.metrics || slide.content?.stats || slide.content?.statistics || [];

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: 0.5,
                y: 0.4,
                w: SLIDE_WIDTH - 1,
                h: 0.8,
                fontSize: 32,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
            });
        }

        // Stats grid (up to 4)
        const displayStats = stats.slice(0, 4);
        const cardWidth = 2.8;
        const cardHeight = 2.2;
        const gap = 0.3;
        const totalWidth = displayStats.length * cardWidth + (displayStats.length - 1) * gap;
        const startX = (SLIDE_WIDTH - totalWidth) / 2;
        const startY = 1.8;

        displayStats.forEach((stat: any, i: number) => {
            const x = startX + i * (cardWidth + gap);

            // Card background with border
            pptxSlide.addShape('roundRect', {
                x: x,
                y: startY,
                w: cardWidth,
                h: cardHeight,
                fill: { color: toHex(colors.bg) },
                line: { color: toHex(colors.primary), width: 2 },
                rectRadius: 0.1,
            });

            // Stat value
            pptxSlide.addText(String(stat.value || stat.number || '0'), {
                x: x,
                y: startY + 0.4,
                w: cardWidth,
                h: 1,
                fontSize: 36,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.primary),
                align: 'center',
                valign: 'middle',
            });

            // Stat label
            pptxSlide.addText(String(stat.label || stat.title || 'Metric'), {
                x: x + 0.2,
                y: startY + 1.5,
                w: cardWidth - 0.4,
                h: 0.6,
                fontSize: 12,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
                valign: 'top',
            });
        });

        // Description below stats if available
        const description = slide.content?.description || slide.content?.text;
        if (description) {
            pptxSlide.addText(description, {
                x: 1,
                y: 4.5,
                w: SLIDE_WIDTH - 2,
                h: 1,
                fontSize: 14,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
            });
        }
    },
};
