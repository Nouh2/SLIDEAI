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

// Eagerly load all markdown files as raw strings
// This avoids "Failed to load module script" errors and simplifies data access
const modules = import.meta.glob('../content/blog/*.md', {
    query: '?raw',
    import: 'default',
    eager: true
});

/**
 * Parses all blog posts from the eager-loaded modules
 */
function getParsedPosts(): BlogPost[] {
    const posts: BlogPost[] = [];

    for (const path in modules) {
        try {
            // With eager: true and import: 'default', the value is the raw string content
            const rawContent = modules[path] as unknown as string;

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

    return posts;
}

export async function getAllPosts(language: string = 'fr'): Promise<BlogPost[]> {
    const posts = getParsedPosts();

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
    // We search across all languages because the slug should be unique enough or we just want the content regardless of current locale context if requested explicitly
    const posts = getParsedPosts();
    return posts.find((post) => post.slug === slug);
}
