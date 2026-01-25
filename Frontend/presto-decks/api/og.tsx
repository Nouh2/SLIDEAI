import { ImageResponse } from '@vercel/og';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // 1. Getting parameters directly (fastest)
        const title = searchParams.get('title') || 'SlideAI Presentation';
        const subtitle = searchParams.get('subtitle') || 'Created with SlideAI';
        const theme = searchParams.get('theme') || 'dark';
        const token = searchParams.get('token');

        // 2. Fetching real data if token is provided
        let slideData = { title, subtitle, theme };

        if (token) {
            // Use the backend API to fetch the deck
            // Note: We need the backend URL here. 
            // In production Vercel, this should be an env var.
            // Fallback to localhost for dev testing if env not found (though local dev needs help to reach backend)
            const apiUrl = process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

            try {
                const res = await fetch(`${apiUrl}/public/view/${token}`);
                if (res.ok) {
                    const data = await res.json();
                    const firstSlide = data.slides?.[0]; // Get the first slide
                    if (firstSlide) {
                        slideData = {
                            title: firstSlide.title || data.title,
                            subtitle: firstSlide.subtitle || firstSlide.content?.subtitle || data.subtitle,
                            theme: data.theme || theme,
                        };
                    }
                }
            } catch (e) {
                console.error("Failed to fetch deck data for OG:", e);
            }
        }

        // 3. Determine colors based on theme (Simplified mapping)
        const colors = getThemeColors(slideData.theme);

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.bg,
                        backgroundImage: `radial-gradient(circle at 25% 25%, ${colors.primary}40 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${colors.secondary}40 0%, transparent 50%)`,
                        fontFamily: '"Inter", sans-serif',
                        padding: '40px 80px',
                        textAlign: 'center',
                        color: colors.text,
                        position: 'relative',
                    }}
                >
                    {/* Decorative shapes */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})` }} />

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                        }}
                    >
                        <h1
                            style={{
                                fontSize: 72,
                                fontWeight: 800,
                                background: `linear-gradient(90deg, ${colors.text}, ${colors.text}aa)`,
                                backgroundClip: 'text',
                                color: 'transparent',
                                marginBottom: 20,
                                lineHeight: 1.1,
                                letterSpacing: '-0.02em',
                            }}
                        >
                            {truncate(slideData.title, 60)}
                        </h1>

                        {slideData.subtitle && (
                            <p
                                style={{
                                    fontSize: 32,
                                    color: colors.text,
                                    opacity: 0.7,
                                    maxWidth: '80%',
                                    lineHeight: 1.4,
                                    fontWeight: 500,
                                }}
                            >
                                {truncate(slideData.subtitle, 100)}
                            </p>
                        )}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginTop: 40,
                            opacity: 0.5,
                            fontSize: 24,
                            fontWeight: 600,
                            color: colors.text,
                        }}
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <line x1="3" x2="21" y1="9" y2="9" />
                            <line x1="9" x2="9" y1="21" y2="9" />
                        </svg>
                        <span>SlideAI</span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            },
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}

// Helpers
function truncate(str: string, n: number) {
    if (!str) return '';
    return (str.length > n) ? str.substr(0, n - 1) + '...' : str;
}

function getThemeColors(theme: string) {
    // Default Dark Neo colors
    const defaults = {
        bg: '#0F172A', // Slate 900
        text: '#F8FAFC', // Slate 50
        primary: '#3B82F6', // Blue 500
        secondary: '#8B5CF6', // Violet 500
    };

    if (!theme) return defaults;

    // Simple mapping based on known themes (expand as needed)
    const themeMap: any = {
        'light': { bg: '#FFFFFF', text: '#1E293B', primary: '#2563EB', secondary: '#7C3AED' },
        'dark': defaults,
        'midnight': { bg: '#000000', text: '#FFFFFF', primary: '#FFFFFF', secondary: '#333333' },
        'corporate': { bg: '#FFFFFF', text: '#111827', primary: '#0F766E', secondary: '#0EA5E9' },
        'playful': { bg: '#FFF7ED', text: '#431407', primary: '#EA580C', secondary: '#F59E0B' },
        'tech': { bg: '#0B1120', text: '#E2E8F0', primary: '#06B6D4', secondary: '#6366F1' },
    };

    // Try to match partial theme name
    const key = Object.keys(themeMap).find(k => theme.toLowerCase().includes(k));
    return key ? themeMap[key] : defaults;
}
