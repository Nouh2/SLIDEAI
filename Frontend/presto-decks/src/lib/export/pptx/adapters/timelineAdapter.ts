// src/lib/export/pptx/adapters/timelineAdapter.ts
// Adapter for timeline/process slides - Matches frontend TimelineLayout

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex } from '../types';
import { LAYOUT, SLIDE, addGradientBackground, addSlideFooter, getFontSize } from '../layoutTokens';

export const timelineAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        const hasTimeline = (
            (slide.timeline?.items?.length > 0) ||
            (slide.content?.timeline?.items?.length > 0) ||
            (slide.content?.steps?.length > 0 && slide.content?.steps?.[0]?.date) ||
            (slide.content?.events?.length > 0)
        );
        return (type.includes('timeline') || type.includes('roadmap') || type.includes('process')) && hasTimeline;
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Add gradient background
        addGradientBackground(pptxSlide, colors, toHex);

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: LAYOUT.margin.px16,
                y: LAYOUT.margin.py12,
                w: SLIDE.WIDTH - (LAYOUT.margin.px16 * 2),
                h: 0.8,
                fontSize: LAYOUT.timeline.title.fontSize,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
            });
        }

        // Get timeline data
        const timelineData = slide.timeline?.items ||
            slide.content?.timeline?.items ||
            slide.content?.steps ||
            slide.content?.events || [];

        const items = timelineData.slice(0, 5); // Max 5 items

        if (items.length === 0) {
            pptxSlide.addText('Timeline data not available', {
                x: SLIDE.WIDTH * 0.2,
                y: SLIDE.HEIGHT * 0.4,
                w: SLIDE.WIDTH * 0.6,
                h: 1,
                fontSize: 24,
                fontFace: 'Arial',
                color: toHex(colors.text),
                transparency: 50,
                align: 'center',
            });
            return;
        }

        // Draw horizontal timeline
        const lineY = SLIDE.HEIGHT * 0.48;
        const startX = LAYOUT.margin.px20;
        const endX = SLIDE.WIDTH - LAYOUT.margin.px20;
        const lineWidth = endX - startX;

        // Main timeline line
        pptxSlide.addShape('rect', {
            x: startX,
            y: lineY,
            w: lineWidth,
            h: LAYOUT.timeline.lineThickness,
            fill: { color: toHex(colors.primary) },
        });

        // Timeline items
        const itemGap = lineWidth / items.length;

        items.forEach((item: any, i: number) => {
            const x = startX + (i * itemGap) + (itemGap / 2);
            const dotR = LAYOUT.timeline.dotRadius;

            // Circle marker with border (matches frontend rounded-full bg-primary)
            pptxSlide.addShape('ellipse', {
                x: x - dotR,
                y: lineY - dotR + 0.015,
                w: dotR * 2,
                h: dotR * 2,
                fill: { color: toHex(colors.primary) },
                line: { color: toHex(colors.bg), width: 4 },
            });

            // Step number inside circle
            pptxSlide.addText(String(i + 1), {
                x: x - dotR,
                y: lineY - dotR + 0.015,
                w: dotR * 2,
                h: dotR * 2,
                fontSize: 12,
                bold: true,
                fontFace: 'Arial',
                color: 'FFFFFF',
                align: 'center',
                valign: 'middle',
            });

            // Date/label above (matches uppercase tracking-wider)
            const dateText = item.date || item.year || item.period || `Step ${i + 1}`;
            pptxSlide.addText(dateText.toUpperCase(), {
                x: x - 1.2,
                y: lineY - 0.9,
                w: 2.4,
                h: 0.5,
                fontSize: 10,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.primary),
                align: 'center',
            });

            // Title below line
            const title = item.title || item.event || item.name || '';
            pptxSlide.addText(title, {
                x: x - 1.2,
                y: lineY + 0.45,
                w: 2.4,
                h: 0.5,
                fontSize: LAYOUT.timeline.itemTitleSize,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
            });

            // Description
            const desc = item.description || '';
            if (desc) {
                pptxSlide.addText(desc, {
                    x: x - 1.3,
                    y: lineY + 1,
                    w: 2.6,
                    h: 1.2,
                    fontSize: LAYOUT.timeline.itemDescSize,
                    fontFace: 'Arial',
                    color: toHex(colors.text),
                    transparency: 30,
                    align: 'center',
                    valign: 'top',
                });
            }
        });

        // Footer
        addSlideFooter(pptxSlide, {
            title: slide.title,
            colors,
            toHex,
            showPageNumber: true,
        });
    },
};
