// src/lib/export/pptx/types.ts
// Types for PPTX export adapters

import pptxgen from 'pptxgenjs';

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
}

export interface SlideData {
    id?: string;
    type?: string;
    layout?: string;
    title?: string;
    subtitle?: string;
    bullets?: string[];
    stats?: Array<{ value: string; label: string; description?: string }>;
    metrics?: Array<{ value: string; label: string }>;
    chart?: {
        type?: string;
        data?: any[];
        categories?: string[];
        labels?: string[];
        datasets?: any[];
    };
    table?: {
        headers?: string[];
        rows?: string[][];
    };
    timeline?: {
        items?: Array<{ date?: string; title?: string; description?: string }>;
    };
    comparison?: {
        left?: { title?: string; points?: string[] };
        right?: { title?: string; points?: string[] };
    };
    infographic?: {
        steps?: Array<{ title?: string; description?: string }>;
    };
    items?: Array<{ title?: string; description?: string; value?: string; icon?: string }>;
    columns?: Array<{ title?: string; description?: string; icon?: string }>;
    content?: any;
    backgroundImage?: string;
    imageSearchQuery?: string;
    variation?: string;
}

export interface PresentationData {
    id: string;
    title: string;
    subtitle?: string;
    slides: SlideData[];
    theme: string;
    colorScheme?: ColorPalette;
    // Template Branding
    brandLogoUrl?: string;
    templateOverlay?: {
        logo?: {
            position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
            size: 'small' | 'medium' | 'large';
            showOnCover: boolean;
            showOnContent: boolean;
        };
        footer?: {
            text?: string;
            showPageNumber: boolean;
        };
    };
}

// Layout adapter interface
export interface LayoutAdapter {
    /**
     * Check if this adapter can handle the given slide
     */
    canHandle: (slide: SlideData) => boolean;

    /**
     * Render the slide using PptxGenJS
     */
    render: (
        slide: SlideData,
        pptxSlide: pptxgen.Slide,
        colors: ColorPalette,
        pptx: pptxgen
    ) => Promise<void>;
}

// Standard slide dimensions (16:9 in inches)
export const SLIDE_WIDTH = 13.333;
export const SLIDE_HEIGHT = 7.5;

// Common text styles
export const TEXT_STYLES = {
    title: {
        fontSize: 44,
        bold: true,
        fontFace: 'Arial',
    },
    subtitle: {
        fontSize: 24,
        fontFace: 'Arial',
    },
    body: {
        fontSize: 18,
        fontFace: 'Arial',
    },
    caption: {
        fontSize: 14,
        fontFace: 'Arial',
    },
    metric: {
        fontSize: 48,
        bold: true,
        fontFace: 'Arial',
    },
    metricLabel: {
        fontSize: 14,
        fontFace: 'Arial',
    },
};

// Helper to convert hex color to PPTX format (without #)
export const toHex = (color: string): string => {
    return color.replace('#', '');
};

// Helper to get contrasting text color
export const getContrastColor = (bgColor: string): string => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '000000' : 'FFFFFF';
};
