// src/lib/export/pptx/adapters/comparisonAdapter.ts
// Adapter for comparison/vs slides

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex, SLIDE_WIDTH, SLIDE_HEIGHT } from '../types';

export const comparisonAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        const hasComparison = (
            slide.comparison?.left ||
            slide.content?.comparison?.left ||
            (slide.columns?.length === 2) ||
            slide.content?.leftTitle ||
            slide.content?.leftPoints
        );
        return (type.includes('comparison') || type.includes('versus') || type.includes('vs')) && hasComparison;
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Background
        pptxSlide.background = { color: toHex(colors.bg) };

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: 0.5,
                y: 0.3,
                w: SLIDE_WIDTH - 1,
                h: 0.7,
                fontSize: 28,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
            });
        }

        // Get comparison data
        const comparison = slide.comparison || slide.content?.comparison || slide.content;
        const columns = slide.columns as any[] | undefined;
        const left = {
            title: comparison?.left?.title || comparison?.leftTitle || columns?.[0]?.title || 'Option A',
            points: comparison?.left?.points || comparison?.leftPoints || columns?.[0]?.bullets || [],
        };
        const right = {
            title: comparison?.right?.title || comparison?.rightTitle || columns?.[1]?.title || 'Option B',
            points: comparison?.right?.points || comparison?.rightPoints || columns?.[1]?.bullets || [],
        };

        const halfWidth = (SLIDE_WIDTH - 2) / 2 - 0.3;
        const startY = 1.2;
        const cardHeight = SLIDE_HEIGHT - startY - 0.6;

        // Left side card
        pptxSlide.addShape('roundRect', {
            x: 0.5,
            y: startY,
            w: halfWidth,
            h: cardHeight,
            fill: { color: toHex(colors.bg) },
            line: { color: toHex(colors.primary), width: 2 },
            rectRadius: 0.1,
        });

        // Left header bar
        pptxSlide.addShape('rect', {
            x: 0.5,
            y: startY,
            w: halfWidth,
            h: 0.6,
            fill: { color: toHex(colors.primary) },
        });

        // Left title
        pptxSlide.addText(left.title, {
            x: 0.5,
            y: startY,
            w: halfWidth,
            h: 0.6,
            fontSize: 18,
            bold: true,
            fontFace: 'Arial',
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
        });

        // Left points
        if (left.points.length > 0) {
            pptxSlide.addText(
                left.points.map((p: string) => ({
                    text: p,
                    options: { bullet: { type: 'bullet', color: toHex(colors.primary) } },
                })),
                {
                    x: 0.7,
                    y: startY + 0.8,
                    w: halfWidth - 0.4,
                    h: cardHeight - 1,
                    fontSize: 13,
                    fontFace: 'Arial',
                    color: toHex(colors.text),
                    valign: 'top',
                    paraSpaceAfter: 6,
                }
            );
        }

        // Right side
        const rightX = 0.5 + halfWidth + 0.6;

        // Right side card
        pptxSlide.addShape('roundRect', {
            x: rightX,
            y: startY,
            w: halfWidth,
            h: cardHeight,
            fill: { color: toHex(colors.bg) },
            line: { color: toHex(colors.secondary), width: 2 },
            rectRadius: 0.1,
        });

        // Right header bar
        pptxSlide.addShape('rect', {
            x: rightX,
            y: startY,
            w: halfWidth,
            h: 0.6,
            fill: { color: toHex(colors.secondary) },
        });

        // Right title
        pptxSlide.addText(right.title, {
            x: rightX,
            y: startY,
            w: halfWidth,
            h: 0.6,
            fontSize: 18,
            bold: true,
            fontFace: 'Arial',
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
        });

        // Right points
        if (right.points.length > 0) {
            pptxSlide.addText(
                right.points.map((p: string) => ({
                    text: p,
                    options: { bullet: { type: 'bullet', color: toHex(colors.secondary) } },
                })),
                {
                    x: rightX + 0.2,
                    y: startY + 0.8,
                    w: halfWidth - 0.4,
                    h: cardHeight - 1,
                    fontSize: 13,
                    fontFace: 'Arial',
                    color: toHex(colors.text),
                    valign: 'top',
                    paraSpaceAfter: 6,
                }
            );
        }

        // VS badge in center
        const centerX = SLIDE_WIDTH / 2 - 0.35;
        const centerY = startY + 0.1;

        pptxSlide.addShape('ellipse', {
            x: centerX,
            y: centerY,
            w: 0.7,
            h: 0.7,
            fill: { color: toHex(colors.accent) },
        });

        pptxSlide.addText('VS', {
            x: centerX,
            y: centerY,
            w: 0.7,
            h: 0.7,
            fontSize: 12,
            bold: true,
            fontFace: 'Arial',
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
        });
    },
};
