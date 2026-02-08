// src/lib/export/pptx/adapters/sectionAdapter.ts
// Adapter for section divider slides - Matches frontend SectionDividerLayout

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex } from '../types';
import { LAYOUT, SLIDE, addSlideFooter } from '../layoutTokens';

export const sectionAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        return type.includes('section') || type.includes('divider') || type.includes('chapter');
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Full primary color background (matches frontend primary bg)
        pptxSlide.background = { color: toHex(colors.primary) };

        // Add subtle texture pattern
        pptxSlide.addShape('rect', {
            x: 0,
            y: 0,
            w: SLIDE.WIDTH,
            h: SLIDE.HEIGHT,
            fill: { color: '000000', transparency: 95 },
        });

        // Large section number if available (matches frontend 3D-style number)
        const sectionNum = slide.content?.sectionNumber || '';
        if (sectionNum) {
            pptxSlide.addText(String(sectionNum), {
                x: SLIDE.WIDTH * 0.05,
                y: SLIDE.HEIGHT * 0.08,
                w: SLIDE.WIDTH * 0.3,
                h: SLIDE.HEIGHT * 0.35,
                fontSize: 120,
                bold: true,
                fontFace: 'Arial',
                color: 'FFFFFF',
                transparency: 20,
            });
        }

        // Decorative accent line (centered, before title)
        const accentW = SLIDE.WIDTH * 0.12;
        pptxSlide.addShape('rect', {
            x: (SLIDE.WIDTH - accentW) / 2,
            y: LAYOUT.section.title.y - 0.25,
            w: accentW,
            h: 0.06,
            fill: { color: 'FFFFFF' },
        });

        // Title - Large and centered
        const title = slide.title || 'Section';
        pptxSlide.addText(title, {
            x: SLIDE.WIDTH * 0.1,
            y: LAYOUT.section.title.y,
            w: SLIDE.WIDTH * 0.8,
            h: 1.2,
            fontSize: LAYOUT.section.title.fontSize,
            bold: true,
            fontFace: 'Arial',
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
        });

        // Subtitle if present
        const subtitle = slide.subtitle || slide.content?.subtitle;
        if (subtitle) {
            pptxSlide.addText(subtitle, {
                x: SLIDE.WIDTH * 0.15,
                y: LAYOUT.section.subtitle.y,
                w: SLIDE.WIDTH * 0.7,
                h: 0.8,
                fontSize: LAYOUT.section.subtitle.fontSize,
                fontFace: 'Arial',
                color: 'FFFFFF',
                transparency: 20,
                align: 'center',
                valign: 'middle',
            });
        }

        // Footer (optional - some section slides skip it)
        addSlideFooter(pptxSlide, {
            title: slide.title,
            colors: { ...colors, text: '#FFFFFF', primary: '#FFFFFF' },
            toHex,
            showPageNumber: false,
        });
    },
};
