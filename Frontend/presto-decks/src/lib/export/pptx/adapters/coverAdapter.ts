// src/lib/export/pptx/adapters/coverAdapter.ts
// Adapter for cover/hero slides - Matches frontend CoverHeroLayout component

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex } from '../types';
import { LAYOUT, SLIDE, addGradientBackground, addSlideFooter } from '../layoutTokens';
import i18n from '@/lib/i18n';

export const coverAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        return type.includes('cover') || type.includes('hero') || type.includes('title');
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Add gradient background (matches AbstractShapes in frontend)
        addGradientBackground(pptxSlide, colors, toHex);

        // Background image if available
        if (slide.backgroundImage && !slide.backgroundImage.includes('placehold')) {
            try {
                pptxSlide.background = { path: slide.backgroundImage };
                // Add overlay for text readability (matches frontend's bg-opacity-80)
                pptxSlide.addShape('rect', {
                    x: 0,
                    y: 0,
                    w: SLIDE.WIDTH,
                    h: SLIDE.HEIGHT,
                    fill: { color: toHex(colors.bg), transparency: 20 },
                });
            } catch (e) {
                // Fallback handled by addGradientBackground
            }
        }

        // Decorative accent bar at top center (matches frontend accent line)
        const accentW = LAYOUT.cover.accentBar.w;
        pptxSlide.addShape('rect', {
            x: (SLIDE.WIDTH - accentW) / 2,
            y: LAYOUT.cover.accentBar.y,
            w: accentW,
            h: LAYOUT.cover.accentBar.h,
            fill: { color: toHex(colors.primary) },
        });

        // Title - Large, centered (matches text-8xl/9xl font-bold, centered)
        const mainTitle = slide.title || i18n.t('common.untitled');
        pptxSlide.addText(mainTitle, {
            x: LAYOUT.cover.title.x,
            y: LAYOUT.cover.title.y,
            w: LAYOUT.cover.title.w,
            h: LAYOUT.cover.title.h,
            fontSize: LAYOUT.cover.title.fontSize,
            bold: true,
            fontFace: 'Arial',
            color: toHex(colors.text),
            align: LAYOUT.cover.title.align,
            valign: LAYOUT.cover.title.valign,
        });

        // Subtitle in a "pill" style badge (matches inline-block px-12 py-6 rounded-full)
        const subtitle = slide.subtitle || slide.content?.subtitle;
        if (subtitle) {
            const subtitleW = SLIDE.WIDTH * 0.6;
            const subtitleH = 0.8;
            const subtitleX = (SLIDE.WIDTH - subtitleW) / 2;

            // Pill background
            pptxSlide.addShape('roundRect', {
                x: subtitleX,
                y: LAYOUT.cover.subtitle.y - 0.2,
                w: subtitleW,
                h: subtitleH,
                fill: { color: toHex(colors.bg), transparency: 50 },
                line: { color: toHex(colors.text), transparency: 80, width: 0.5 },
                rectRadius: LAYOUT.radius.full,
            });

            // Subtitle text
            pptxSlide.addText(subtitle, {
                x: subtitleX,
                y: LAYOUT.cover.subtitle.y - 0.15,
                w: subtitleW,
                h: subtitleH - 0.1,
                fontSize: LAYOUT.cover.subtitle.fontSize,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: LAYOUT.cover.subtitle.align,
                valign: 'middle',
            });
        }

        // Key bullets if present (matches frontend mt-10 space-y-3)
        const bullets = slide.bullets || slide.content?.bullets || [];
        if (bullets.length > 0) {
            const bulletStartY = LAYOUT.cover.bullets.y;
            const bulletX = SLIDE.WIDTH * 0.25;
            const bulletW = SLIDE.WIDTH * 0.5;

            bullets.slice(0, 4).forEach((bullet: string, i: number) => {
                const y = bulletStartY + (i * 0.55);

                // Bullet dot
                pptxSlide.addShape('ellipse', {
                    x: bulletX - 0.25,
                    y: y + 0.12,
                    w: 0.15,
                    h: 0.15,
                    fill: { color: toHex(colors.primary) },
                });

                // Bullet text
                pptxSlide.addText(bullet, {
                    x: bulletX,
                    y: y,
                    w: bulletW,
                    h: 0.5,
                    fontSize: LAYOUT.cover.bullets.fontSize,
                    fontFace: 'Arial',
                    color: toHex(colors.text),
                    transparency: 20,
                    align: 'left',
                    valign: 'middle',
                });
            });
        }

        // Footer (matches SlideFooter component)
        addSlideFooter(pptxSlide, {
            slideNumber: 1,
            title: slide.title,
            colors,
            toHex,
            showPageNumber: true,
        });
    },
};
