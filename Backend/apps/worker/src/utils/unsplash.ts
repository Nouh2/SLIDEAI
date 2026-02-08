// apps/worker/src/utils/unsplash.ts
// Unsplash API integration for fetching slide background images

/**
 * Unsplash image response with attribution data
 */
export interface UnsplashImageResult {
    url: string;
    photographer?: {
        name: string;
        username: string;
        link: string;
    };
}

/**
 * Fetch a random image from Unsplash matching the query
 * Returns image URL and photographer info for attribution
 * Triggers download endpoint per Unsplash production guidelines
 */
export async function getUnsplashImage(
    query: string,
    styleKeywords: string
): Promise<UnsplashImageResult> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;

    // Abstract gradients/patterns as reliable fallbacks
    const FALLBACK_IMAGES = [
        "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1920&q=80", // Dark gradient
        "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1920&q=80", // Purple gradient
        "https://images.unsplash.com/photo-1550684442-7c2d2b7e93af?auto=format&fit=crop&w=1920&q=80", // Cyberpunk
        "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=1920&q=80", // Abstract mesh
    ];
    const randomFallback = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    const fallback: UnsplashImageResult = { url: randomFallback };

    // Skip if no valid API key
    if (!accessKey || accessKey.includes('fake') || accessKey.length < 10) {
        console.log(`[Unsplash] No valid API key, using fallback for: ${query}`);
        return fallback;
    }

    const fetchImage = async (q: string): Promise<UnsplashImageResult | null> => {
        try {
            console.log(`[Unsplash] Searching for: "${q}"`);
            const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
                q
            )}&orientation=landscape&content_filter=high`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Client-ID ${accessKey}`,
                    'Accept-Version': 'v1',
                },
            });

            if (!response.ok) {
                if (response.status === 404) return null; // Not found, try next strategy
                console.warn(`[Unsplash] Error ${response.status} for query: "${q}"`);
                return null;
            }

            const data: any = await response.json();

            // Trigger download tracking
            if (data.links?.download_location) {
                fetch(data.links.download_location, {
                    headers: { Authorization: `Client-ID ${accessKey}` },
                }).catch(err => console.warn('[Unsplash] Download tracking failed:', err));
            }

            const utmParams = '?utm_source=SlideAI&utm_medium=referral';
            const photographer = data.user ? {
                name: data.user.name || 'Unknown',
                username: data.user.username || '',
                link: (data.user.links?.html || `https://unsplash.com/@${data.user.username}`) + utmParams,
            } : undefined;

            const imageUrl = data.urls?.regular || data.urls?.full;
            if (!imageUrl) return null;

            console.log(`[Unsplash] ✅ Found image by ${photographer?.name}`);
            return {
                url: imageUrl,
                photographer,
            };
        } catch (error) {
            console.error(`[Unsplash] Exception for query "${q}":`, error);
            return null;
        }
    };

    // STRATEGY 1: Full Specific Query (Query + Style)
    // "marketing strategy product launch tech"
    const fullQuery = `${query} ${styleKeywords}`.trim();
    let result = await fetchImage(fullQuery);
    if (result) return result;

    // STRATEGY 2: Simplified Query (Just the specific subject)
    // "marketing strategy" - often better than specific + style if style is too restrictive
    if (query.trim()) {
        console.log(`[Unsplash] Retrying with simplified query: "${query}"`);
        result = await fetchImage(query);
        if (result) return result;
    }

    // STRATEGY 3: Just the Style (Thematic fallback)
    // "product launch tech" - ensures at least the vibe matches
    if (styleKeywords.trim()) {
        console.log(`[Unsplash] Retrying with style keywords only: "${styleKeywords}"`);
        result = await fetchImage(styleKeywords);
        if (result) return result;
    }

    // STRATEGY 4: Last Resort - Random Business/Tech (if style is empty)
    if (!result) {
        console.log('[Unsplash] All searches failed, using generic fallback');
        // Try one last generic search before giving up to hardcoded URL
        result = await fetchImage("abstract business technology");
        if (result) return result;
    }

    return fallback;
}

/**
 * Fetch multiple images in parallel for a deck
 * Limits concurrency to avoid rate limiting
 */
export async function fetchImagesForDeck(
    slides: Array<{ imageSearchQuery?: string }>,
    styleKeywords: string
): Promise<UnsplashImageResult[]> {
    const results: UnsplashImageResult[] = [];

    // Process in batches of 3 to avoid rate limiting
    const batchSize = 3;

    for (let i = 0; i < slides.length; i += batchSize) {
        const batch = slides.slice(i, i + batchSize);
        const batchPromises = batch.map((slide) =>
            slide.imageSearchQuery
                ? getUnsplashImage(slide.imageSearchQuery, styleKeywords)
                : Promise.resolve({ url: '' })
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to be nice to the API
        if (i + batchSize < slides.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    return results;
}
