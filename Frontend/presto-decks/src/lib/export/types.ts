// src/lib/export/types.ts
// Shared types for export utilities

export interface ExportProgress {
    current: number;
    total: number;
    status: 'preparing' | 'rendering' | 'generating' | 'complete' | 'error';
    message?: string;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

export interface ColorPalette {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
}

export interface SlideData {
    id: string;
    type?: string;
    layout?: string;
    title?: string;
    subtitle?: string;
    bullets?: string[];
    stats?: Array<{ value: string; label: string }>;
    chart?: any;
    table?: any;
    timeline?: any;
    comparison?: any;
    infographic?: any;
    items?: any[];
    content?: any;
    backgroundImage?: string;
    variation?: string;
}

export interface PresentationData {
    id: string;
    title: string;
    subtitle?: string;
    slides: SlideData[];
    theme: string;
    colorScheme?: ColorPalette;
}
