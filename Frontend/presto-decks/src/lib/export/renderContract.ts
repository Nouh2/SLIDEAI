import { TemplateOverlay } from '@/lib/api';

export interface ExportThemeContract {
    id: string;
    fontScale: number;
    titleFontScale: number;
    textFontScale: number;
}

export interface ExportSlideContract {
    id: string;
    type: string;
    layout: string;
    title?: string;
    subtitle?: string;
    variation?: string;
    [key: string]: any;
}

export interface ExportDeckContract {
    id: string;
    title: string;
    subtitle?: string;
    theme: string;
    themeConfig: ExportThemeContract;
    colorScheme?: any;
    slides: ExportSlideContract[];
    brandLogoUrl?: string;
    templateOverlay?: TemplateOverlay;
}

const has = (value: any) => value !== undefined && value !== null;

const resolveThemeId = (theme: any): string => {
    if (typeof theme === 'string' && theme.trim()) return theme;
    if (theme && typeof theme === 'object') {
        if (typeof theme.id === 'string' && theme.id.trim()) return theme.id;
        if (typeof theme.name === 'string' && theme.name.trim()) return theme.name;
    }
    return 'startup-pitch';
};

const resolveThemeScale = (theme: any) => {
    const fontScale = Number(theme?.fontScale ?? 1);
    const titleFontScale = Number(theme?.titleFontScale ?? fontScale);
    const textFontScale = Number(theme?.textFontScale ?? fontScale);

    return {
        fontScale: Number.isFinite(fontScale) ? fontScale : 1,
        titleFontScale: Number.isFinite(titleFontScale) ? titleFontScale : 1,
        textFontScale: Number.isFinite(textFontScale) ? textFontScale : 1,
    };
};

const normalizeTemplateOverlay = (overlay?: TemplateOverlay): TemplateOverlay | undefined => {
    if (!overlay) return undefined;

    return {
        logo: overlay.logo
            ? {
                position: overlay.logo.position ?? 'top-left',
                size: overlay.logo.size ?? 'medium',
                showOnCover: has(overlay.logo.showOnCover) ? overlay.logo.showOnCover : true,
                showOnContent: has(overlay.logo.showOnContent) ? overlay.logo.showOnContent : true,
            }
            : undefined,
        footer: overlay.footer
            ? {
                text: overlay.footer.text ?? '',
                showPageNumber: has(overlay.footer.showPageNumber) ? overlay.footer.showPageNumber : true,
            }
            : undefined,
    };
};

const inferType = (slide: any): string => {
    const raw = String(slide?.type || slide?.layout || '').toLowerCase();

    if (raw) return raw;
    if (slide?.chart || slide?.content?.chart) return 'chart';
    if (slide?.table || slide?.content?.table) return 'table';
    if (slide?.timeline || slide?.content?.timeline) return 'timeline';
    if (slide?.comparison || slide?.content?.comparison) return 'comparison';
    if (slide?.infographic || slide?.content?.infographic) return 'infographic';
    if (slide?.stats || slide?.content?.stats || slide?.metrics || slide?.content?.metrics) return 'stats';
    if (slide?.items || slide?.content?.items) return 'bento';
    if (slide?.backgroundImage) return 'image';
    return 'content';
};

const inferDefaultVariation = (slide: any, type: string): string | undefined => {
    if (typeof slide?.variation === 'string' && slide.variation.trim()) return slide.variation;

    if (type.includes('cover') || type.includes('hero')) return 'centered-minimal';
    if (type.includes('section') || type.includes('divider')) return 'default';
    if (type.includes('stats') || type.includes('metric') || type.includes('kpi')) return 'classic-grid';
    if (type.includes('timeline') || type.includes('roadmap') || type.includes('process')) return 'horizontal-line';
    if (type.includes('comparison') || type.includes('versus')) return 'balanced-split';
    if (type.includes('infographic') || type.includes('funnel') || type.includes('pyramid')) {
        return slide?.content?.type || 'funnel';
    }
    if (type.includes('table')) return 'default';
    if (type.includes('chart') || type.includes('graph')) return 'default-container';
    if (type.includes('bento') || type.includes('grid')) return 'default';
    if (type.includes('image') || type.includes('showcase')) return 'default';
    if (type.includes('swot')) return 'classic-grid';
    if (type.includes('executive')) return 'dashboard';
    if (type.includes('text-column')) return 'classic';
    if (type.includes('content') || type.includes('bullets')) return 'classic';
    return undefined;
};

const normalizeSlide = (slide: any, index: number): ExportSlideContract => {
    const type = inferType(slide);
    const layout = String(slide?.layout || type || 'content').toLowerCase();
    const variation = inferDefaultVariation(slide, type);

    return {
        ...slide,
        id: String(slide?.id || `slide-${index + 1}`),
        type,
        layout,
        ...(variation ? { variation } : {}),
    };
};

export const normalizeExportDeck = (deck: any): ExportDeckContract => {
    const themeId = resolveThemeId(deck?.theme);
    const themeScale = resolveThemeScale(deck?.theme);

    return {
        id: String(deck?.id || 'local-export'),
        title: String(deck?.title || 'Presentation'),
        subtitle: deck?.subtitle,
        theme: themeId,
        themeConfig: {
            id: themeId,
            ...themeScale,
        },
        colorScheme: deck?.colorScheme,
        slides: (deck?.slides || []).map((slide: any, index: number) => normalizeSlide(slide, index)),
        brandLogoUrl: deck?.brandLogoUrl,
        templateOverlay: normalizeTemplateOverlay(deck?.templateOverlay),
    };
};
