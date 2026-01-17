// src/lib/export/pptx/adapters/contentAdapter.ts
// Adapter for content/bullet slides - Default fallback

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex, SLIDE_WIDTH, SLIDE_HEIGHT } from '../types';

export const contentAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        // This is the default fallback adapter - must return true for most slides
        return true; // Always matches as fallback
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Background
        pptxSlide.background = { color: toHex(colors.bg) };

        // Decorative accent bar at top
        pptxSlide.addShape('rect', {
            x: 0,
            y: 0,
            w: SLIDE_WIDTH,
            h: 0.08,
            fill: { color: toHex(colors.primary) },
        });

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: 0.5,
                y: 0.4,
                w: SLIDE_WIDTH - 1,
                h: 0.9,
                fontSize: 32,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
            });
        }

        // Subtitle or description
        const subtitle = slide.subtitle || slide.content?.subtitle || slide.content?.description;
        let nextY = 1.4;

        if (subtitle) {
            pptxSlide.addText(subtitle, {
                x: 0.5,
                y: nextY,
                w: SLIDE_WIDTH - 1,
                h: 0.6,
                fontSize: 16,
                fontFace: 'Arial',
                color: toHex(colors.text),
            });
            nextY = 2.1;
        }

        // Bullets
        const bullets = slide.bullets || slide.content?.bullets || [];
        const hasImage = slide.backgroundImage || slide.imageSearchQuery;

        if (bullets.length > 0) {
            // Split layout if there's an image
            const bulletWidth = hasImage ? (SLIDE_WIDTH - 1) * 0.55 : SLIDE_WIDTH - 1;

            pptxSlide.addText(
                bullets.map((b: string) => ({
                    text: b,
                    options: { bullet: { type: 'bullet', color: toHex(colors.primary) } },
                })),
                {
                    x: 0.5,
                    y: nextY,
                    w: bulletWidth,
                    h: SLIDE_HEIGHT - nextY - 0.5,
                    fontSize: 16,
                    fontFace: 'Arial',
                    color: toHex(colors.text),
                    valign: 'top',
                    paraSpaceAfter: 10,
                }
            );
        }

        // Body text if no bullets
        const bodyText = slide.content?.text;
        if (!bullets.length && bodyText) {
            pptxSlide.addText(bodyText, {
                x: 0.5,
                y: nextY,
                w: SLIDE_WIDTH - 1,
                h: SLIDE_HEIGHT - nextY - 0.5,
                fontSize: 16,
                fontFace: 'Arial',
                color: toHex(colors.text),
                valign: 'top',
            });
        }

        // Image placeholder (right side)
        if (hasImage && bullets.length > 0) {
            const imgX = SLIDE_WIDTH * 0.58;
            const imgW = SLIDE_WIDTH * 0.38;
            const imgH = SLIDE_HEIGHT - nextY - 0.5;

            // Image placeholder box
            pptxSlide.addShape('roundRect', {
                x: imgX,
                y: nextY,
                w: imgW,
                h: imgH,
                fill: { color: 'F0F0F0' },
                line: { color: toHex(colors.primary), width: 1 },
                rectRadius: 0.1,
            });

            pptxSlide.addText('Image', {
                x: imgX,
                y: nextY + imgH / 2 - 0.3,
                w: imgW,
                h: 0.6,
                fontSize: 14,
                fontFace: 'Arial',
                color: toHex(colors.primary),
                align: 'center',
                valign: 'middle',
            });
        }
    },
};
