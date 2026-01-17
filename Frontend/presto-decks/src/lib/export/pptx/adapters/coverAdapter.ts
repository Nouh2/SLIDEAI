// src/lib/export/pptx/adapters/coverAdapter.ts
// Adapter for cover/hero slides

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex, SLIDE_WIDTH, SLIDE_HEIGHT } from '../types';

export const coverAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        return type.includes('cover') || type.includes('hero') || type.includes('title');
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Background
        pptxSlide.background = { color: toHex(colors.bg) };

        // Add background image if available
        if (slide.backgroundImage) {
            try {
                pptxSlide.background = {
                    path: slide.backgroundImage,
                };
                // Add overlay for text readability
                pptxSlide.addShape('rect', {
                    x: 0,
                    y: 0,
                    w: SLIDE_WIDTH,
                    h: SLIDE_HEIGHT,
                    fill: { color: toHex(colors.bg), transparency: 40 },
                });
            } catch (e) {
                // Fallback to solid color if image fails
                pptxSlide.background = { color: toHex(colors.bg) };
            }
        }

        // Decorative accent line at top
        pptxSlide.addShape('rect', {
            x: SLIDE_WIDTH / 2 - 1.5,
            y: 1.8,
            w: 3,
            h: 0.1,
            fill: { color: toHex(colors.primary) },
        });

        // Title
        const mainTitle = slide.title?.split(':')[0] || slide.title || 'Untitled';
        pptxSlide.addText(mainTitle, {
            x: 0.5,
            y: 2.2,
            w: SLIDE_WIDTH - 1,
            h: 1.8,
            fontSize: 48,
            bold: true,
            fontFace: 'Arial',
            color: toHex(colors.text),
            align: 'center',
            valign: 'middle',
        });

        // Subtitle
        const subtitle = slide.subtitle || slide.content?.subtitle || slide.title?.split(':')[1]?.trim();
        if (subtitle) {
            pptxSlide.addText(subtitle, {
                x: 1,
                y: 4.2,
                w: SLIDE_WIDTH - 2,
                h: 0.8,
                fontSize: 22,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
                valign: 'middle',
            });
        }

        // Bullets as simple text (if present)
        const bullets = slide.bullets || slide.content?.bullets || [];
        if (bullets.length > 0) {
            const bulletText = bullets.slice(0, 3).join('  •  ');
            pptxSlide.addText(bulletText, {
                x: 1,
                y: 5.5,
                w: SLIDE_WIDTH - 2,
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
