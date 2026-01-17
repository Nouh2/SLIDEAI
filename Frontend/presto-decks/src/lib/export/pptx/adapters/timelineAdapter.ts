// src/lib/export/pptx/adapters/timelineAdapter.ts
// Adapter for timeline/process slides

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex, SLIDE_WIDTH, SLIDE_HEIGHT } from '../types';

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
        // Background
        pptxSlide.background = { color: toHex(colors.bg) };

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: 0.8,
                y: 0.4,
                w: SLIDE_WIDTH - 1.6,
                h: 0.7,
                fontSize: 32,
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
                x: 2,
                y: 3,
                w: SLIDE_WIDTH - 4,
                h: 1,
                fontSize: 24,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
            });
            return;
        }

        // Draw horizontal timeline
        const lineY = 3.5;
        const startX = 1.5;
        const endX = SLIDE_WIDTH - 1.5;
        const lineWidth = endX - startX;

        // Main timeline line
        pptxSlide.addShape('rect', {
            x: startX,
            y: lineY,
            w: lineWidth,
            h: 0.05,
            fill: { color: toHex(colors.primary) },
        });

        // Timeline items
        const itemGap = lineWidth / (items.length);

        items.forEach((item: any, i: number) => {
            const x = startX + (i * itemGap) + (itemGap / 2);

            // Circle marker
            pptxSlide.addShape('ellipse', {
                x: x - 0.25,
                y: lineY - 0.225,
                w: 0.5,
                h: 0.5,
                fill: { color: toHex(colors.primary) },
                line: { color: toHex(colors.bg), width: 3 },
            });

            // Step number
            pptxSlide.addText(String(i + 1), {
                x: x - 0.25,
                y: lineY - 0.225,
                w: 0.5,
                h: 0.5,
                fontSize: 14,
                bold: true,
                fontFace: 'Arial',
                color: 'FFFFFF',
                align: 'center',
                valign: 'middle',
            });

            // Date/label above
            const dateText = item.date || item.year || item.period || `Step ${i + 1}`;
            pptxSlide.addText(dateText, {
                x: x - 1,
                y: lineY - 0.9,
                w: 2,
                h: 0.5,
                fontSize: 12,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.primary),
                align: 'center',
            });

            // Title below
            const title = item.title || item.event || item.name || '';
            pptxSlide.addText(title, {
                x: x - 1.2,
                y: lineY + 0.5,
                w: 2.4,
                h: 0.5,
                fontSize: 14,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
            });

            // Description
            const desc = item.description || '';
            if (desc) {
                pptxSlide.addText(desc, {
                    x: x - 1.2,
                    y: lineY + 1,
                    w: 2.4,
                    h: 1,
                    fontSize: 11,
                    fontFace: 'Arial',
                    color: toHex(colors.text),
                    align: 'center',
                    valign: 'top',
                });
            }
        });
    },
};
