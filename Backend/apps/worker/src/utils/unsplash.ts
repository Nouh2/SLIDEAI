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
    const fallbackUrl = `https://placehold.co/1920x1080/1a1a2e/ffffff?text=${encodeURIComponent(
        query.slice(0, 20)
    )}`;
    const fallback: UnsplashImageResult = { url: fallbackUrl };

    // Skip if no valid API key
    if (!accessKey || accessKey.includes('fake') || accessKey.length < 10) {
        console.log(`[Unsplash] No valid API key, using fallback for: ${query}`);
        return fallback;
    }

    try {
        // Combine query with theme-specific keywords
        const fullQuery = `${query} ${styleKeywords}`.trim();
        console.log(`[Unsplash] Searching for: "${fullQuery}"`);

        const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
            fullQuery
        )}&orientation=landscape&content_filter=high`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Client-ID ${accessKey}`,
                'Accept-Version': 'v1',
            },
        });

        if (response.status === 403) {
            const errorBody = await response.text();
            console.warn(`[Unsplash] 403 Forbidden: ${errorBody}`);
            return fallback;
        }

        if (response.status === 401) {
            console.warn('[Unsplash] 401 Unauthorized - Invalid API key');
            return fallback;
        }

        if (!response.ok) {
            console.warn(`[Unsplash] Error ${response.status}`);
            return fallback;
        }

        const data: any = await response.json();

        // Trigger download endpoint per Unsplash production guidelines
        // This is required to track photo usage
        if (data.links?.download_location) {
            fetch(data.links.download_location, {
                headers: { Authorization: `Client-ID ${accessKey}` },
            }).catch(err => console.warn('[Unsplash] Download tracking failed:', err));
        }

        // Extract photographer info for attribution
        const photographer = data.user ? {
            name: data.user.name || 'Unknown',
            username: data.user.username || '',
            link: data.user.links?.html || `https://unsplash.com/@${data.user.username}`,
        } : undefined;

        // Return the regular size URL (good balance of quality and size)
        const imageUrl = data.urls?.regular || data.urls?.full || fallbackUrl;
        console.log(`[Unsplash] ✅ Found image by ${photographer?.name}: ${imageUrl.slice(0, 50)}...`);

        return {
            url: imageUrl,
            photographer,
        };

    } catch (error) {
        console.error('[Unsplash] Exception:', error);
        return fallback;
    }
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
