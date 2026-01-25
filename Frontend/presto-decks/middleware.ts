// Middleware for meta tag injection

export const config = {
    matcher: '/view/:path*',
};

export default async function middleware(request: Request) {
    const url = new URL(request.url);
    const token = url.pathname.split('/').pop(); // Extract token from /view/:token

    // Only run for valid tokens and when it's a page request (accepts html)
    if (!token || !request.headers.get('accept')?.includes('text/html')) {
        return;
    }

    // 1. Fetch the presentation data
    // We need the absolute backend URL.
    // In production, define VITE_API_URL or API_URL or NEXT_PUBLIC_API_URL
    const apiUrl = process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';

    let title = 'SlideAI Presentation';
    let description = 'View this presentation on SlideAI';
    let theme = 'dark';
    let found = false;

    try {
        const res = await fetch(`${apiUrl}/public/view/${token}`);
        if (res.ok) {
            const data = await res.json();
            const firstSlide = data.slides?.[0];
            title = data.title || title;
            if (firstSlide) {
                // Use first slide title if main title is generic? Or just stick to Deck Title.
                // Usually Deck Title is best for OG Title.
                // Description can be subtitle.
                description = data.subtitle || firstSlide.subtitle || description;
                theme = data.theme || theme;
            }
            found = true;
        }
    } catch (e) {
        console.error('Middleware data fetch error:', e);
    }

    if (!found) {
        // If deck not found or error, let the client side handle the 404 UI
        // We just pass through without modifying tags (or maybe we should?)
        return;
    }

    // 2. Fetch the original index.html
    // We fetch from the same origin but at root path to get the SPA entry point
    const indexUrl = new URL('/', request.url);
    const indexRes = await fetch(indexUrl);
    const indexHtml = await indexRes.text();

    // 3. Replace Meta Tags
    // We construct the dynamic OG image URL
    const ogImageUrl = new URL('/api/og', request.url);
    ogImageUrl.searchParams.set('token', token);
    // We can pass theme/title directly to save the OG function a fetch, but passing token is safer for consistency
    // passing params:
    ogImageUrl.searchParams.set('title', title);
    ogImageUrl.searchParams.set('subtitle', description);
    ogImageUrl.searchParams.set('theme', theme);

    const replacements = [
        { pattern: /<meta property="og:title" content="[^"]*" \/>/, replacement: `<meta property="og:title" content="${escapeHtml(title)}" />` },
        { pattern: /<meta property="og:description" content="[^"]*" \/>/, replacement: `<meta property="og:description" content="${escapeHtml(description)}" />` },
        { pattern: /<meta property="og:image" content="[^"]*" \/>/, replacement: `<meta property="og:image" content="${ogImageUrl.toString()}" />` },
        { pattern: /<meta name="twitter:title" content="[^"]*" \/>/, replacement: `<meta name="twitter:title" content="${escapeHtml(title)}" />` },
        { pattern: /<meta name="twitter:description" content="[^"]*" \/>/, replacement: `<meta name="twitter:description" content="${escapeHtml(description)}" />` },
        { pattern: /<meta name="twitter:image" content="[^"]*" \/>/, replacement: `<meta name="twitter:image" content="${ogImageUrl.toString()}" />` },
    ];

    let modifiedHtml = indexHtml;
    for (const { pattern, replacement } of replacements) {
        modifiedHtml = modifiedHtml.replace(pattern, replacement);
    }

    return new Response(modifiedHtml, {
        headers: {
            'content-type': 'text/html;charset=UTF-8',
            'cache-control': 'public, max-age=60', // Short cache for dynamic content
        },
    });
}

function escapeHtml(unsafe: string) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
