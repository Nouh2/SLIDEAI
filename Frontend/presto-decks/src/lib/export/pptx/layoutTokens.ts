// src/lib/export/pptx/layoutTokens.ts
// Shared layout tokens for consistent positioning between frontend CSS and PPTX export
// Conversion: Tailwind rem → PPTX inches (1rem ≈ 0.188")

import pptxgen from 'pptxgenjs';

// ============================================
// SLIDE DIMENSIONS (16:9)
// ============================================
export const SLIDE = {
    WIDTH: 13.333,  // inches
    HEIGHT: 7.5,    // inches
};

// ============================================
// CSS → INCHES CONVERSION
// ============================================
const REM_TO_INCH = 0.188;

// Helper: Convert Tailwind spacing value to inches
export const tailwindToInches = (remValue: number): number => remValue * REM_TO_INCH;

// Helper: Convert Tailwind font size to PowerPoint points
const TAILWIND_FONT_SIZES: Record<string, number> = {
    'xs': 9,
    'sm': 10,
    'base': 12,
    'lg': 14,
    'xl': 16,
    '2xl': 20,
    '3xl': 24,
    '4xl': 30,
    '5xl': 36,
    '6xl': 45,
    '7xl': 54,
    '8xl': 72,
    '9xl': 96,
};

export const getFontSize = (tailwindSize: keyof typeof TAILWIND_FONT_SIZES): number => {
    return TAILWIND_FONT_SIZES[tailwindSize] || 12;
};

// ============================================
// BASE VALUES (computed once, no circular refs)
// ============================================
const MARGIN = {
    px12: tailwindToInches(3),    // px-12 = 3rem ≈ 0.56"
    px16: tailwindToInches(4),    // px-16 = 4rem ≈ 0.75"
    px20: tailwindToInches(5),    // px-20 = 5rem ≈ 0.94"
    py12: tailwindToInches(3),
    py16: tailwindToInches(4),
};

const GAP = {
    gap4: tailwindToInches(1),
    gap6: tailwindToInches(1.5),
    gap8: tailwindToInches(2),
    gap12: tailwindToInches(3),
};

const RADIUS = {
    lg: 0.15,
    xl: 0.2,
    '2xl': 0.25,
    '3xl': 0.3,
    full: 0.5,
};

const FOOTER_HEIGHT = tailwindToInches(5);
const FOOTER_Y = SLIDE.HEIGHT - FOOTER_HEIGHT;

// ============================================
// LAYOUT TOKENS (using pre-computed values)
// ============================================
export const LAYOUT = {
    margin: MARGIN,
    gap: GAP,
    radius: RADIUS,

    // ========================================
    // COVER SLIDE LAYOUT
    // ========================================
    cover: {
        title: {
            x: SLIDE.WIDTH * 0.05,
            y: SLIDE.HEIGHT * 0.30,
            w: SLIDE.WIDTH * 0.90,
            h: SLIDE.HEIGHT * 0.25,
            fontSize: getFontSize('8xl'),
            align: 'center' as const,
            valign: 'middle' as const,
        },
        subtitle: {
            y: SLIDE.HEIGHT * 0.58,
            fontSize: getFontSize('3xl'),
            align: 'center' as const,
        },
        accentBar: {
            y: SLIDE.HEIGHT * 0.26,
            w: SLIDE.WIDTH * 0.15,
            h: 0.06,
        },
        bullets: {
            y: SLIDE.HEIGHT * 0.72,
            fontSize: getFontSize('2xl'),
        },
    },

    // ========================================
    // STATS/METRICS SLIDE LAYOUT
    // ========================================
    stats: {
        title: {
            x: SLIDE.WIDTH * 0.05,
            y: tailwindToInches(4),
            w: SLIDE.WIDTH * 0.90,
            h: tailwindToInches(4),
            fontSize: getFontSize('6xl'),
            align: 'center' as const,
        },
        grid: {
            startY: SLIDE.HEIGHT * 0.32,
            cardHeight: SLIDE.HEIGHT * 0.42,
            cardRadius: 0.4,
            valueSize: getFontSize('5xl'),
            labelSize: getFontSize('xl'),
        },
        getCardLayout: (count: number, index: number) => {
            const totalGap = GAP.gap8 * (count - 1);
            const availableWidth = SLIDE.WIDTH - (MARGIN.px20 * 2);
            const cardWidth = (availableWidth - totalGap) / count;
            const startX = MARGIN.px20;
            return {
                x: startX + (index * (cardWidth + GAP.gap8)),
                w: cardWidth,
            };
        },
    },

    // ========================================
    // CONTENT SLIDE LAYOUT
    // ========================================
    content: {
        title: {
            x: MARGIN.px12,
            y: tailwindToInches(1),
            w: SLIDE.WIDTH - (MARGIN.px12 * 2),
            fontSize: getFontSize('5xl'),
        },
        accentBar: {
            h: 0.05,
            y: 0,
        },
        bullets: {
            x: MARGIN.px12,
            startY: tailwindToInches(5),
            fontSize: getFontSize('lg'),
            spacing: tailwindToInches(0.6),
            bulletColor: (colors: any) => colors.primary,
        },
        image: {
            splitRatio: 0.55,
        },
    },

    // ========================================
    // CHART SLIDE LAYOUT
    // ========================================
    chart: {
        title: {
            x: MARGIN.px16,
            y: tailwindToInches(1),
            fontSize: getFontSize('5xl'),
        },
        area: {
            x: MARGIN.px16 * 0.8,
            y: SLIDE.HEIGHT * 0.20,
            w: SLIDE.WIDTH - (MARGIN.px16 * 1.6),
            h: SLIDE.HEIGHT * 0.68,
        },
    },

    // ========================================
    // FOOTER LAYOUT
    // ========================================
    footer: {
        height: FOOTER_HEIGHT,
        y: FOOTER_Y,
        paddingX: MARGIN.px12,
        fontSize: getFontSize('base'),
        pageNumberSize: getFontSize('lg'),
    },

    // ========================================
    // SECTION DIVIDER LAYOUT
    // ========================================
    section: {
        title: {
            fontSize: getFontSize('7xl'),
            y: SLIDE.HEIGHT * 0.40,
        },
        subtitle: {
            fontSize: getFontSize('2xl'),
            y: SLIDE.HEIGHT * 0.58,
        },
    },

    // ========================================
    // TIMELINE LAYOUT
    // ========================================
    timeline: {
        title: {
            fontSize: getFontSize('5xl'),
        },
        itemTitleSize: getFontSize('xl'),
        itemDescSize: getFontSize('base'),
        lineThickness: 0.03,
        dotRadius: 0.15,
    },

    // ========================================
    // COMPARISON LAYOUT
    // ========================================
    comparison: {
        title: {
            fontSize: getFontSize('5xl'),
            y: tailwindToInches(3),
        },
        columns: {
            gap: GAP.gap8,
            headerSize: getFontSize('2xl'),
            pointSize: getFontSize('lg'),
        },
    },

    // ========================================
    // TABLE LAYOUT
    // ========================================
    table: {
        title: {
            fontSize: getFontSize('5xl'),
        },
        headerSize: getFontSize('base'),
        cellSize: getFontSize('sm'),
        cellPadding: 0.1,
    },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getContentWidth = (marginKey: keyof typeof MARGIN = 'px20'): number => {
    return SLIDE.WIDTH - (MARGIN[marginKey] * 2);
};

export const getCenteredX = (elementWidth: number): number => {
    return (SLIDE.WIDTH - elementWidth) / 2;
};

export const addGradientBackground = (
    slide: pptxgen.Slide,
    colors: { primary: string; secondary: string; bg: string },
    toHex: (color: string) => string
): void => {
    slide.background = { color: toHex(colors.bg) };

    slide.addShape('ellipse', {
        x: -2,
        y: -2,
        w: 8,
        h: 8,
        fill: { color: toHex(colors.primary), transparency: 85 },
        line: { color: toHex(colors.primary), transparency: 100 },
    });

    slide.addShape('ellipse', {
        x: SLIDE.WIDTH - 5,
        y: SLIDE.HEIGHT - 4,
        w: 7,
        h: 6,
        fill: { color: toHex(colors.secondary), transparency: 88 },
        line: { color: toHex(colors.secondary), transparency: 100 },
    });
};

export const addSlideFooter = (
    slide: pptxgen.Slide,
    options: {
        slideNumber?: number;
        title?: string;
        colors: any;
        toHex: (color: string) => string;
        showPageNumber?: boolean;
    }
): void => {
    const { slideNumber, title, colors, toHex, showPageNumber = true } = options;

    slide.addShape('line', {
        x: 0,
        y: FOOTER_Y,
        w: SLIDE.WIDTH,
        h: 0,
        line: { color: toHex(colors.primary), transparency: 80, width: 0.5 },
    });

    if (showPageNumber && slideNumber) {
        slide.addText(String(slideNumber), {
            x: MARGIN.px12,
            y: FOOTER_Y + 0.15,
            w: 0.5,
            h: FOOTER_HEIGHT - 0.3,
            fontSize: getFontSize('lg'),
            fontFace: 'Arial',
            bold: true,
            color: toHex(colors.primary),
            align: 'left',
            valign: 'middle',
        });
    }

    if (title) {
        slide.addText(title, {
            x: SLIDE.WIDTH * 0.3,
            y: FOOTER_Y + 0.15,
            w: SLIDE.WIDTH * 0.4,
            h: FOOTER_HEIGHT - 0.3,
            fontSize: getFontSize('base'),
            fontFace: 'Arial',
            color: toHex(colors.text),
            transparency: 40,
            align: 'center',
            valign: 'middle',
        });
    }

    slide.addText(new Date().getFullYear().toString(), {
        x: SLIDE.WIDTH - MARGIN.px12 - 0.8,
        y: FOOTER_Y + 0.15,
        w: 0.8,
        h: FOOTER_HEIGHT - 0.3,
        fontSize: getFontSize('base'),
        fontFace: 'Arial',
        color: toHex(colors.text),
        transparency: 60,
        align: 'right',
        valign: 'middle',
    });
};

// Re-export for backward compatibility
export const SLIDE_WIDTH = SLIDE.WIDTH;
export const SLIDE_HEIGHT = SLIDE.HEIGHT;
