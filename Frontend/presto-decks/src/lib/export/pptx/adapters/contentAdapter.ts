// src/lib/export/pptx/adapters/contentAdapter.ts
// Adapter for content/bullet slides - Default fallback
// Matches frontend ContentBulletsLayout component

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex } from '../types';
import { LAYOUT, SLIDE, addGradientBackground, addSlideFooter, getFontSize } from '../layoutTokens';

export const contentAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        // This is the default fallback adapter - must return true for most slides
        return true;
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Add gradient background
        addGradientBackground(pptxSlide, colors, toHex);

        // Decorative accent bar at top (matches frontend border-top primary)
        pptxSlide.addShape('rect', {
            x: 0,
            y: 0,
            w: SLIDE.WIDTH,
            h: LAYOUT.content.accentBar.h,
            fill: { color: toHex(colors.primary) },
        });

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: LAYOUT.content.title.x,
                y: LAYOUT.content.title.y,
                w: LAYOUT.content.title.w,
                h: 1,
                fontSize: LAYOUT.content.title.fontSize,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
            });
        }

        // Subtitle or description
        const subtitle = slide.subtitle || slide.content?.subtitle || slide.content?.description;
        let nextY = 1.8;

        if (subtitle) {
            pptxSlide.addText(subtitle, {
                x: LAYOUT.content.title.x,
                y: nextY,
                w: LAYOUT.content.title.w,
                h: 0.6,
                fontSize: getFontSize('lg'),
                fontFace: 'Arial',
                color: toHex(colors.text),
                transparency: 30,
            });
            nextY = 2.6;
        }

        // Bullets
        const bullets = slide.bullets || slide.content?.bullets || [];
        const hasImage = slide.backgroundImage || slide.imageSearchQuery;

        if (bullets.length > 0) {
            // Split layout if there's an image
            const splitRatio = hasImage ? LAYOUT.content.image.splitRatio : 1;
            const bulletWidth = LAYOUT.content.title.w * splitRatio;

            // Create bullet text items with proper styling
            const bulletItems = bullets.map((b: string) => ({
                text: b,
                options: {
                    bullet: {
                        type: 'bullet' as const,
                        color: toHex(colors.primary),
                    },
                    paraSpaceAfter: 12,
                },
            }));

            pptxSlide.addText(bulletItems, {
                x: LAYOUT.content.bullets.x,
                y: nextY,
                w: bulletWidth,
                h: SLIDE.HEIGHT - nextY - LAYOUT.footer.height - 0.3,
                fontSize: LAYOUT.content.bullets.fontSize,
                fontFace: 'Arial',
                color: toHex(colors.text),
                valign: 'top',
                lineSpacingMultiple: 1.3,
            });

            // Image area (right side)
            if (hasImage) {
                const imgX = LAYOUT.content.bullets.x + bulletWidth + LAYOUT.gap.gap4;
                const imgW = LAYOUT.content.title.w - bulletWidth - LAYOUT.gap.gap4;
                const imgH = SLIDE.HEIGHT - nextY - LAYOUT.footer.height - 0.3;

                if (slide.backgroundImage && !slide.backgroundImage.includes('placehold')) {
                    try {
                        pptxSlide.addImage({
                            path: slide.backgroundImage,
                            x: imgX,
                            y: nextY,
                            w: imgW,
                            h: imgH,
                            sizing: { type: 'cover', w: imgW, h: imgH },
                            rounding: true,
                        });
                    } catch (e) {
                        // Add placeholder on error
                        addImagePlaceholder(pptxSlide, imgX, nextY, imgW, imgH, colors, toHex);
                    }
                } else {
                    addImagePlaceholder(pptxSlide, imgX, nextY, imgW, imgH, colors, toHex);
                }
            }
        }

        // Body text if no bullets
        const bodyText = slide.content?.text;
        if (!bullets.length && bodyText) {
            pptxSlide.addText(bodyText, {
                x: LAYOUT.content.bullets.x,
                y: nextY,
                w: LAYOUT.content.title.w,
                h: SLIDE.HEIGHT - nextY - LAYOUT.footer.height - 0.3,
                fontSize: getFontSize('lg'),
                fontFace: 'Arial',
                color: toHex(colors.text),
                valign: 'top',
                lineSpacingMultiple: 1.4,
            });
        }

        // Items/columns layout (if present)
        const items = slide.items || slide.columns || slide.content?.items || slide.content?.columns || [];
        if (items.length > 0 && !bullets.length) {
            const itemCount = Math.min(items.length, 4);
            const itemWidth = (LAYOUT.content.title.w - (LAYOUT.gap.gap6 * (itemCount - 1))) / itemCount;
            const itemStartX = LAYOUT.content.bullets.x;
            const itemY = nextY;

            items.slice(0, 4).forEach((item: any, i: number) => {
                const x = itemStartX + (i * (itemWidth + LAYOUT.gap.gap6));

                // Item card
                pptxSlide.addShape('roundRect', {
                    x: x,
                    y: itemY,
                    w: itemWidth,
                    h: 3.5,
                    fill: { color: toHex(colors.bg), transparency: 70 },
                    line: { color: toHex(colors.text), transparency: 85 },
                    rectRadius: LAYOUT.radius.xl,
                });

                // Item title
                if (item.title) {
                    pptxSlide.addText(item.title, {
                        x: x + 0.2,
                        y: itemY + 0.3,
                        w: itemWidth - 0.4,
                        h: 0.6,
                        fontSize: getFontSize('xl'),
                        bold: true,
                        fontFace: 'Arial',
                        color: toHex(colors.primary),
                    });
                }

                // Item description
                if (item.description) {
                    pptxSlide.addText(item.description, {
                        x: x + 0.2,
                        y: itemY + 1,
                        w: itemWidth - 0.4,
                        h: 2.2,
                        fontSize: getFontSize('base'),
                        fontFace: 'Arial',
                        color: toHex(colors.text),
                        valign: 'top',
                    });
                }
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

// Helper function for image placeholder
function addImagePlaceholder(
    pptxSlide: pptxgen.Slide,
    x: number, y: number, w: number, h: number,
    colors: any, toHex: (c: string) => string
) {
    pptxSlide.addShape('roundRect', {
        x, y, w, h,
        fill: { color: 'F5F5F5' },
        line: { color: toHex(colors.primary), width: 1, dashType: 'dash' },
        rectRadius: LAYOUT.radius.xl,
    });
    pptxSlide.addText('Image', {
        x,
        y: y + h / 2 - 0.3,
        w,
        h: 0.6,
        fontSize: 14,
        fontFace: 'Arial',
        color: toHex(colors.primary),
        transparency: 50,
        align: 'center',
        valign: 'middle',
    });
}
