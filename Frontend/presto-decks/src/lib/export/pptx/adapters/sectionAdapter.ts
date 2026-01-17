// src/lib/export/pptx/adapters/sectionAdapter.ts
// Adapter for section divider slides

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex, SLIDE_WIDTH, SLIDE_HEIGHT } from '../types';

export const sectionAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        return type.includes('section') || type.includes('divider') || type.includes('chapter');
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Full primary color background
        pptxSlide.background = { color: toHex(colors.primary) };

        // Large section number or decorative element
        const sectionNum = slide.content?.sectionNumber || '';
        if (sectionNum) {
            pptxSlide.addText(String(sectionNum), {
                x: 0.5,
                y: 0.5,
                w: 3,
                h: 2,
                fontSize: 100,
                bold: true,
                fontFace: 'Arial',
                color: 'FFFFFF',
            });
        }

        // Decorative line
        pptxSlide.addShape('rect', {
            x: 1,
            y: 3.2,
            w: 2,
            h: 0.08,
            fill: { color: 'FFFFFF' },
        });

        // Title
        const title = slide.title || 'Section';
        pptxSlide.addText(title, {
            x: 1,
            y: 3.5,
            w: SLIDE_WIDTH - 2,
            h: 1.5,
            fontSize: 48,
            bold: true,
            fontFace: 'Arial',
            color: 'FFFFFF',
            valign: 'top',
        });

        // Subtitle
        const subtitle = slide.subtitle || slide.content?.subtitle;
        if (subtitle) {
            pptxSlide.addText(subtitle, {
                x: 1,
                y: 5,
                w: SLIDE_WIDTH - 2,
                h: 0.8,
                fontSize: 22,
                fontFace: 'Arial',
                color: 'FFFFFF',
            });
        }
    },
};
