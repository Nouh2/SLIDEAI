import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;
import matter from 'gray-matter';

export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    author: string;
    excerpt: string;
    coverImage?: string;
    content: string;
    language?: string;
}

export async function getAllPosts(language: string = 'fr'): Promise<BlogPost[]> {
    // Import all markdown files from the content/blog directory
    const modules = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default' });
    const posts: BlogPost[] = [];

    for (const path in modules) {
        try {
            // Load the raw content
            const rawContent = await modules[path]() as string;

            // Parse frontmatter
            const { data, content } = matter(rawContent);

            // Extract slug from filename
            const slug = path.split('/').pop()?.replace('.md', '') || '';

            posts.push({
                slug,
                title: data.title || 'Untitled',
                date: data.date || new Date().toISOString(),
                author: data.author || 'SlideAI',
                excerpt: data.excerpt || '',
                coverImage: data.coverImage,
                content: content,
                language: data.language
            });
        } catch (e) {
            console.error(`Error loading blog post ${path}:`, e);
        }
    }

    // Filter by language if specified in frontmatter, default to all if no language specified
    const filteredPosts = posts.filter(post => {
        // Default to 'fr' if no language specified
        const postLang = (post.language || 'fr').toLowerCase().split('-')[0];
        const currentLang = (language || 'fr').toLowerCase().split('-')[0];

        return postLang === currentLang;
    });

    // Sort by date descending
    return filteredPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    // For single post, we search in all posts to find the slug, then check language match if needed in component
    // But getAllPosts needs language.
    // Let's modify getAllPosts to return all then filter? Or fetch all for slug search?
    // Optimization: Import all for slug lookup is fine for small blog.
    const modules = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default' });

    // We need to iterate again or call getAllPosts without filter? 
    // Let's make getAllPosts(language?: string)

    // Quick fix:
    // We want to find a post by slug regardless of language? No, slugs likely unique or suffixed?
    // "guide-ia-presentation" vs "guide-ia-presentation-en"?
    // The previous step created `guide-ia-presentation-en.md`. So slug is different.
    // So getPostBySlug just needs to find the post.

    // Re-using logic without filter:
    const allPosts = await getAllPostsAllLanguages();
    return allPosts.find((post) => post.slug === slug);
}

async function getAllPostsAllLanguages(): Promise<BlogPost[]> {
    const modules = import.meta.glob('../content/blog/*.md', { query: '?raw', import: 'default' });
    const posts: BlogPost[] = [];
    for (const path in modules) {
        try {
            const rawContent = await modules[path]() as string;
            const { data, content } = matter(rawContent);
            const slug = path.split('/').pop()?.replace('.md', '') || '';
            posts.push({
                slug,
                title: data.title || 'Untitled',
                date: data.date || new Date().toISOString(),
                author: data.author || 'SlideAI',
                excerpt: data.excerpt || '',
                coverImage: data.coverImage,
                content: content,
                language: data.language
            });
        } catch (e) {
            console.error(e);
        }
    }
    return posts;
}
