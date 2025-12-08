// apps/worker/src/config/themes.ts
// Rich theme configuration for SlideAI presentations

/**
 * Extended theme configuration with full styling options
 * Each theme defines colors, typography, shapes, and visual direction
 */
export interface ThemeConfig {
    id: string;
    name: string;
    mode: 'dark' | 'light';

    // Color palette
    colors: {
        background: string;      // Main slide background
        surface: string;         // Card/box backgrounds
        text: string;            // Primary text color
        textSecondary: string;   // Secondary/muted text
        accent: string;          // Primary accent (highlights, buttons)
        accentSecondary: string; // Secondary accent
        chartColors: string[];   // Colors for chart series
    };

    // Gradient support (optional)
    gradient?: {
        start: string;
        end: string;
        angle: number;
    };

    // Typography
    fonts: {
        heading: string;
        body: string;
    };

    // Shape styling
    shapes: {
        borderRadius: number;  // 0 = sharp corners, 0.3 = rounded
        shadow: boolean;       // Add shadow to shapes
        strokeWidth: number;   // Border width for shapes
    };

    // Visual direction for image search
    imageKeywords: string;

    // Icon style preference
    iconStyle: 'thin' | 'regular' | 'bold' | 'duotone';
}

/**
 * All available themes for SlideAI
 * Each theme is designed for specific use cases
 */
export const THEMES: Record<string, ThemeConfig> = {
    // ============================================
    // DARK THEMES
    // ============================================

    'tech-modern': {
        id: 'tech-modern',
        name: 'Tech Modern',
        mode: 'dark',
        colors: {
            background: '#0B0F19',
            surface: '#151B2B',
            text: '#FFFFFF',
            textSecondary: '#94A3B8',
            accent: '#00F0FF',
            accentSecondary: '#6366F1',
            chartColors: ['#00F0FF', '#6366F1', '#A855F7', '#EC4899', '#F43F5E'],
        },
        gradient: {
            start: '#0B0F19',
            end: '#1E1B4B',
            angle: 135,
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.15,
            shadow: true,
            strokeWidth: 1,
        },
        imageKeywords: 'technology futuristic neon cyberpunk dark abstract',
        iconStyle: 'regular',
    },

    'creative-portfolio': {
        id: 'creative-portfolio',
        name: 'Creative Portfolio',
        mode: 'dark',
        colors: {
            background: '#1E1E2E',
            surface: '#2A2A3E',
            text: '#F5F5F5',
            textSecondary: '#A1A1AA',
            accent: '#FF006E',
            accentSecondary: '#FB5607',
            chartColors: ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF'],
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.25,
            shadow: true,
            strokeWidth: 0,
        },
        imageKeywords: 'artistic colorful abstract creative vibrant design',
        iconStyle: 'bold',
    },

    'consulting': {
        id: 'consulting',
        name: 'Consulting Premium',
        mode: 'dark',
        colors: {
            background: '#0F172A',
            surface: '#1E293B',
            text: '#F8FAFC',
            textSecondary: '#94A3B8',
            accent: '#F59E0B',
            accentSecondary: '#3B82F6',
            chartColors: ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'],
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.1,
            shadow: true,
            strokeWidth: 1,
        },
        imageKeywords: 'business professional executive premium corporate',
        iconStyle: 'regular',
    },

    // ============================================
    // LIGHT THEMES
    // ============================================

    'startup-pitch': {
        id: 'startup-pitch',
        name: 'Startup Pitch',
        mode: 'light',
        colors: {
            background: '#FFFFFF',
            surface: '#F8FAFC',
            text: '#0F172A',
            textSecondary: '#64748B',
            accent: '#2563EB',
            accentSecondary: '#7C3AED',
            chartColors: ['#2563EB', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'],
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.2,
            shadow: true,
            strokeWidth: 0,
        },
        imageKeywords: 'startup office modern professional clean bright',
        iconStyle: 'regular',
    },

    'minimal-elegant': {
        id: 'minimal-elegant',
        name: 'Minimal Elegant',
        mode: 'light',
        colors: {
            background: '#FAFAFA',
            surface: '#FFFFFF',
            text: '#18181B',
            textSecondary: '#71717A',
            accent: '#18181B',
            accentSecondary: '#A1A1AA',
            chartColors: ['#18181B', '#52525B', '#A1A1AA', '#D4D4D8', '#E4E4E7'],
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0,
            shadow: false,
            strokeWidth: 1,
        },
        imageKeywords: 'minimalist architecture white abstract aesthetic clean',
        iconStyle: 'thin',
    },

    'corporate-report': {
        id: 'corporate-report',
        name: 'Corporate Report',
        mode: 'light',
        colors: {
            background: '#FFFFFF',
            surface: '#F1F5F9',
            text: '#1E293B',
            textSecondary: '#64748B',
            accent: '#0369A1',
            accentSecondary: '#059669',
            chartColors: ['#0369A1', '#059669', '#D97706', '#DC2626', '#7C3AED'],
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.1,
            shadow: true,
            strokeWidth: 0.5,
        },
        imageKeywords: 'corporate business chart office professional data',
        iconStyle: 'regular',
    },

    'product-launch': {
        id: 'product-launch',
        name: 'Product Launch',
        mode: 'light',
        colors: {
            background: '#FFFFFF',
            surface: '#FEF3C7',
            text: '#1C1917',
            textSecondary: '#78716C',
            accent: '#EA580C',
            accentSecondary: '#DC2626',
            chartColors: ['#EA580C', '#DC2626', '#CA8A04', '#16A34A', '#2563EB'],
        },
        gradient: {
            start: '#FEF3C7',
            end: '#FED7AA',
            angle: 180,
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.3,
            shadow: true,
            strokeWidth: 0,
        },
        imageKeywords: 'product launch tech device innovation energetic',
        iconStyle: 'bold',
    },

    'educational': {
        id: 'educational',
        name: 'Educational Course',
        mode: 'light',
        colors: {
            background: '#F0FDF4',
            surface: '#FFFFFF',
            text: '#166534',
            textSecondary: '#4D7C0F',
            accent: '#16A34A',
            accentSecondary: '#0D9488',
            chartColors: ['#16A34A', '#0D9488', '#2563EB', '#9333EA', '#E11D48'],
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.2,
            shadow: false,
            strokeWidth: 1,
        },
        imageKeywords: 'education learning school study academic students',
        iconStyle: 'regular',
    },

    'health-medical': {
        id: 'health-medical',
        name: 'Health & Medical',
        mode: 'light',
        colors: {
            background: '#F0FDFA',
            surface: '#FFFFFF',
            text: '#134E4A',
            textSecondary: '#5EEAD4',
            accent: '#0D9488',
            accentSecondary: '#2563EB',
            chartColors: ['#0D9488', '#2563EB', '#16A34A', '#7C3AED', '#EC4899'],
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.25,
            shadow: true,
            strokeWidth: 0,
        },
        imageKeywords: 'healthcare medical health clinic doctor hospital',
        iconStyle: 'regular',
    },

    'sustainability': {
        id: 'sustainability',
        name: 'Sustainability',
        mode: 'light',
        colors: {
            background: '#FEFCE8',
            surface: '#ECFCCB',
            text: '#365314',
            textSecondary: '#4D7C0F',
            accent: '#65A30D',
            accentSecondary: '#0D9488',
            chartColors: ['#65A30D', '#0D9488', '#059669', '#3B82F6', '#CA8A04'],
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.3,
            shadow: false,
            strokeWidth: 1,
        },
        imageKeywords: 'nature sustainability green eco environment earth',
        iconStyle: 'regular',
    },

    'marketing-campaign': {
        id: 'marketing-campaign',
        name: 'Marketing Campaign',
        mode: 'light',
        colors: {
            background: '#FFF7ED',
            surface: '#FFFFFF',
            text: '#1C1917',
            textSecondary: '#78716C',
            accent: '#EA580C',
            accentSecondary: '#DC2626',
            chartColors: ['#EA580C', '#DC2626', '#F59E0B', '#10B981', '#6366F1'],
        },
        fonts: {
            heading: 'Arial',
            body: 'Arial',
        },
        shapes: {
            borderRadius: 0.2,
            shadow: true,
            strokeWidth: 0,
        },
        imageKeywords: 'marketing advertising campaign social media creative',
        iconStyle: 'bold',
    },
};

/**
 * Normalize theme input to a valid ThemeConfig
 * Handles fuzzy matching and fallback
 */
export function normalizeTheme(input: string | undefined | null): ThemeConfig {
    if (!input) return THEMES['startup-pitch'];

    // Clean and normalize input
    const clean = input.toLowerCase().trim().replace(/\s+/g, '-');

    // Exact match
    if (THEMES[clean]) return THEMES[clean];

    // Fuzzy match: find theme that contains or is contained by input
    const foundKey = Object.keys(THEMES).find(
        (k) => k.includes(clean) || clean.includes(k)
    );

    if (foundKey) {
        console.log(`[Theme] Fuzzy match: "${input}" -> "${foundKey}"`);
        return THEMES[foundKey];
    }

    // Keyword-based matching for common terms
    const keywordMap: Record<string, string> = {
        tech: 'tech-modern',
        technology: 'tech-modern',
        cyber: 'tech-modern',
        dark: 'tech-modern',
        neon: 'tech-modern',
        startup: 'startup-pitch',
        pitch: 'startup-pitch',
        investor: 'startup-pitch',
        minimal: 'minimal-elegant',
        elegant: 'minimal-elegant',
        clean: 'minimal-elegant',
        corporate: 'corporate-report',
        report: 'corporate-report',
        business: 'corporate-report',
        creative: 'creative-portfolio',
        portfolio: 'creative-portfolio',
        artistic: 'creative-portfolio',
        product: 'product-launch',
        launch: 'product-launch',
        education: 'educational',
        course: 'educational',
        school: 'educational',
        health: 'health-medical',
        medical: 'health-medical',
        green: 'sustainability',
        eco: 'sustainability',
        marketing: 'marketing-campaign',
        campaign: 'marketing-campaign',
        consulting: 'consulting',
        premium: 'consulting',
    };

    for (const [keyword, themeId] of Object.entries(keywordMap)) {
        if (clean.includes(keyword)) {
            console.log(`[Theme] Keyword match: "${input}" -> "${themeId}"`);
            return THEMES[themeId];
        }
    }

    console.warn(`[Theme] Unknown theme "${input}", fallback to startup-pitch`);
    return THEMES['startup-pitch'];
}

/**
 * Get all available theme IDs
 */
export function getThemeIds(): string[] {
    return Object.keys(THEMES);
}
