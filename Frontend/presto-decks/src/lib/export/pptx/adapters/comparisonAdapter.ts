// src/lib/export/pptx/adapters/comparisonAdapter.ts
// Adapter for comparison/vs slides - Matches frontend ComparisonLayout

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex } from '../types';
import { LAYOUT, SLIDE, addGradientBackground, addSlideFooter, getFontSize } from '../layoutTokens';

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
        // Add gradient background
        addGradientBackground(pptxSlide, colors, toHex);

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: LAYOUT.margin.px12,
                y: LAYOUT.comparison.title.y,
                w: SLIDE.WIDTH - (LAYOUT.margin.px12 * 2),
                h: 0.8,
                fontSize: LAYOUT.comparison.title.fontSize,
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

        // Calculate dimensions
        const marginX = LAYOUT.margin.px16;
        const gapBetween = LAYOUT.comparison.columns.gap;
        const halfWidth = (SLIDE.WIDTH - (marginX * 2) - gapBetween) / 2;
        const startY = 1.4;
        const cardHeight = SLIDE.HEIGHT - startY - LAYOUT.footer.height - 0.3;

        // ==================
        // LEFT SIDE
        // ==================
        const leftX = marginX;

        // Left card background
        pptxSlide.addShape('roundRect', {
            x: leftX,
            y: startY,
            w: halfWidth,
            h: cardHeight,
            fill: { color: toHex(colors.bg), transparency: 70 },
            line: { color: toHex(colors.primary), width: 2 },
            rectRadius: LAYOUT.radius['2xl'],
        });

        // Left header bar (rounded top)
        pptxSlide.addShape('rect', {
            x: leftX,
            y: startY,
            w: halfWidth,
            h: 0.7,
            fill: { color: toHex(colors.primary) },
        });

        // Left title
        pptxSlide.addText(left.title, {
            x: leftX,
            y: startY + 0.05,
            w: halfWidth,
            h: 0.6,
            fontSize: LAYOUT.comparison.columns.headerSize,
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
                    options: {
                        bullet: { type: 'bullet' as const, color: toHex(colors.primary) },
                        paraSpaceAfter: 8,
                    },
                })),
                {
                    x: leftX + 0.3,
                    y: startY + 0.9,
                    w: halfWidth - 0.6,
                    h: cardHeight - 1.2,
                    fontSize: LAYOUT.comparison.columns.pointSize,
                    fontFace: 'Arial',
                    color: toHex(colors.text),
                    valign: 'top',
                    lineSpacingMultiple: 1.2,
                }
            );
        }

        // ==================
        // RIGHT SIDE
        // ==================
        const rightX = marginX + halfWidth + gapBetween;

        // Right card background
        pptxSlide.addShape('roundRect', {
            x: rightX,
            y: startY,
            w: halfWidth,
            h: cardHeight,
            fill: { color: toHex(colors.bg), transparency: 70 },
            line: { color: toHex(colors.secondary), width: 2 },
            rectRadius: LAYOUT.radius['2xl'],
        });

        // Right header bar
        pptxSlide.addShape('rect', {
            x: rightX,
            y: startY,
            w: halfWidth,
            h: 0.7,
            fill: { color: toHex(colors.secondary) },
        });

        // Right title
        pptxSlide.addText(right.title, {
            x: rightX,
            y: startY + 0.05,
            w: halfWidth,
            h: 0.6,
            fontSize: LAYOUT.comparison.columns.headerSize,
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
                    options: {
                        bullet: { type: 'bullet' as const, color: toHex(colors.secondary) },
                        paraSpaceAfter: 8,
                    },
                })),
                {
                    x: rightX + 0.3,
                    y: startY + 0.9,
                    w: halfWidth - 0.6,
                    h: cardHeight - 1.2,
                    fontSize: LAYOUT.comparison.columns.pointSize,
                    fontFace: 'Arial',
                    color: toHex(colors.text),
                    valign: 'top',
                    lineSpacingMultiple: 1.2,
                }
            );
        }

        // VS Badge in center
        const centerX = SLIDE.WIDTH / 2 - 0.4;
        const centerY = startY + 0.08;

        pptxSlide.addShape('ellipse', {
            x: centerX,
            y: centerY,
            w: 0.8,
            h: 0.8,
            fill: { color: toHex(colors.accent) },
            shadow: {
                type: 'outer',
                blur: 6,
                offset: 2,
                angle: 45,
                color: '000000',
                opacity: 0.2,
            },
        });

        pptxSlide.addText('VS', {
            x: centerX,
            y: centerY,
            w: 0.8,
            h: 0.8,
            fontSize: 14,
            bold: true,
            fontFace: 'Arial',
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
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
