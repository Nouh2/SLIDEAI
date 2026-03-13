const PPTX_FONT_MAP: Record<string, string> = {
    inter: 'Aptos',
    'open-sans': 'Open Sans',
    opensans: 'Open Sans',
    roboto: 'Roboto',
    montserrat: 'Montserrat',
    poppins: 'Poppins',
    lato: 'Lato',
    playfair: 'Playfair Display',
    'playfair display': 'Playfair Display',
    merriweather: 'Merriweather',
    arial: 'Arial',
    georgia: 'Georgia',
};

const normalizeKey = (value?: string) => (value || '').trim().toLowerCase();

const FALLBACK_SERIF = 'Georgia';
const FALLBACK_SANS = 'Aptos';

export const resolvePptxFontFace = (value?: string, role: 'heading' | 'body' = 'body'): string => {
    const normalized = normalizeKey(value);
    if (!normalized) {
        return role === 'heading' ? FALLBACK_SANS : FALLBACK_SANS;
    }

    if (PPTX_FONT_MAP[normalized]) {
        return PPTX_FONT_MAP[normalized];
    }

    if (normalized.includes('serif') || normalized.includes('playfair') || normalized.includes('merriweather') || normalized.includes('georgia')) {
        return FALLBACK_SERIF;
    }

    return FALLBACK_SANS;
};
