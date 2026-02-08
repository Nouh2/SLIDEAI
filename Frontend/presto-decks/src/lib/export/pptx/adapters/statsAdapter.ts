// src/lib/export/pptx/adapters/statsAdapter.ts
// Adapter for stats/metrics slides - Matches frontend StatsLayout component

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex } from '../types';
import { LAYOUT, SLIDE, addGradientBackground, addSlideFooter } from '../layoutTokens';

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
        // Add gradient background (matches AbstractShapes)
        addGradientBackground(pptxSlide, colors, toHex);

        // Background image if available (subtle overlay)
        if (slide.backgroundImage || slide.imageSearchQuery) {
            try {
                if (slide.backgroundImage) {
                    pptxSlide.addImage({
                        path: slide.backgroundImage,
                        x: 0, y: 0,
                        w: SLIDE.WIDTH, h: SLIDE.HEIGHT,
                        sizing: { type: 'cover', w: SLIDE.WIDTH, h: SLIDE.HEIGHT },
                    });
                }
                // Overlay
                pptxSlide.addShape('rect', {
                    x: 0, y: 0, w: SLIDE.WIDTH, h: SLIDE.HEIGHT,
                    fill: { color: toHex(colors.bg), transparency: 10 },
                });
            } catch (e) { /* ignore */ }
        }

        // Get stats data
        const stats = slide.stats || slide.metrics || slide.content?.stats || slide.content?.statistics || [];
        const displayStats = stats.slice(0, 4);
        const statCount = displayStats.length;

        // Title - Centered at top (matches text-6xl/7xl font-bold)
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: LAYOUT.stats.title.x,
                y: LAYOUT.stats.title.y,
                w: LAYOUT.stats.title.w,
                h: LAYOUT.stats.title.h,
                fontSize: LAYOUT.stats.title.fontSize,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: LAYOUT.stats.title.align,
            });
        }

        // Stats cards grid (matches flex-1 flex flex-wrap gap-8)
        const gridY = LAYOUT.stats.grid.startY;
        const cardH = LAYOUT.stats.grid.cardHeight;

        displayStats.forEach((stat: any, i: number) => {
            const { x, w } = LAYOUT.stats.getCardLayout(statCount, i);

            // Card background with rounded corners (matches rounded-[40px] bg-surface/40)
            pptxSlide.addShape('roundRect', {
                x: x,
                y: gridY,
                w: w,
                h: cardH,
                fill: { color: toHex(colors.bg), transparency: 60 },
                line: { color: toHex(colors.text), transparency: 80, width: 0.75 },
                rectRadius: LAYOUT.stats.grid.cardRadius,
                shadow: {
                    type: 'outer',
                    blur: 8,
                    offset: 4,
                    angle: 45,
                    color: toHex(colors.primary),
                    opacity: 0.1,
                },
            });

            // Stat value (matches text-5xl/6xl font-bold, primary color)
            const value = String(stat.value || stat.number || '0');
            pptxSlide.addText(value, {
                x: x,
                y: gridY + cardH * 0.25,
                w: w,
                h: cardH * 0.35,
                fontSize: LAYOUT.stats.grid.valueSize,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.primary),
                align: 'center',
                valign: 'middle',
            });

            // Stat label (matches text-xl opacity-80)
            const label = String(stat.label || stat.title || 'Metric');
            pptxSlide.addText(label, {
                x: x + 0.2,
                y: gridY + cardH * 0.65,
                w: w - 0.4,
                h: cardH * 0.25,
                fontSize: LAYOUT.stats.grid.labelSize,
                fontFace: 'Arial',
                color: toHex(colors.text),
                transparency: 20,
                align: 'center',
                valign: 'top',
            });
        });

        // Description below stats if available
        const description = slide.content?.description || slide.content?.text;
        if (description) {
            pptxSlide.addText(description, {
                x: SLIDE.WIDTH * 0.1,
                y: gridY + cardH + 0.4,
                w: SLIDE.WIDTH * 0.8,
                h: 0.8,
                fontSize: 14,
                fontFace: 'Arial',
                color: toHex(colors.text),
                transparency: 40,
                align: 'center',
            });
        }

        // Footer
        addSlideFooter(pptxSlide, {
            title: slide.title,
            colors,
            toHex,
            showPageNumber: true,
        });
    },
};
