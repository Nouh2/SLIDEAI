import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;
import matter from 'gray-matter';
import i18n from '@/lib/i18n';

export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    author: string;
    excerpt: string;
    coverImage?: string;
    content: string;
    language?: string;
    category?: string;
    tags?: string[];
    persona?: string;
}

export interface BlogCategorySummary {
    slug: string;
    label: string;
    count: number;
}

export interface BlogPersonaSummary {
    slug: string;
    label: string;
    count: number;
}

const CATEGORY_LABELS: Record<string, string> = {
    "consulting": "Conseil",
    "marketing": "Marketing",
    "sales": "Commercial",
    "finance": "Finance",
    "powerpoint-ai": "PowerPoint IA",
    "pitch-deck": "Pitch deck",
    "competitive": "Alternatives et comparatifs",
    "productivity": "Productivite",
};

const PERSONA_LABELS: Record<string, string> = {
    "consultant-rh": "Consultant RH",
    "consultant-seo": "Consultant SEO",
    "consultant-strategie": "Consultant strategie",
    "directeur-marketing": "Directeur marketing",
    "directeur-commercial": "Directeur commercial",
    "analyste-financier": "Analyste financier",
    "freelance": "Freelance",
    "product-manager": "Product manager",
    "sales-manager": "Sales manager",
};

function slugifyCategory(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function inferCategoryAndTags(slug: string, title: string): { category: string; tags: string[] } {
    const source = `${slug} ${title}`.toLowerCase();

    if (source.includes("consultant") || source.includes("audit") || source.includes("seo")) {
        return { category: "consulting", tags: ["consulting", "b2b", "powerpoint", "ia"] };
    }

    if (source.includes("marketing")) {
        return { category: "marketing", tags: ["marketing", "b2b", "powerpoint", "ia"] };
    }

    if (source.includes("commercial") || source.includes("vente") || source.includes("sales")) {
        return { category: "sales", tags: ["sales", "b2b", "powerpoint", "ia"] };
    }

    if (source.includes("financier") || source.includes("finance")) {
        return { category: "finance", tags: ["finance", "analyse", "powerpoint", "ia"] };
    }

    if (source.includes("gamma") || source.includes("alternative")) {
        return { category: "competitive", tags: ["alternatives", "presentation-ai", "saas"] };
    }

    if (source.includes("pitch")) {
        return { category: "pitch-deck", tags: ["pitch-deck", "presentation", "storytelling"] };
    }

    if (source.includes("pdf") || source.includes("texte") || source.includes("text")) {
        return { category: "productivity", tags: ["productivite", "workflow", "presentation-ai"] };
    }

    return { category: "powerpoint-ai", tags: ["powerpoint", "ia", "presentation-ai"] };
}

function inferPersona(slug: string, title: string): string | undefined {
    const source = `${slug} ${title}`.toLowerCase();

    if (source.includes("consultant-rh") || (source.includes("consultant") && source.includes("rh"))) {
        return "consultant-rh";
    }
    if (source.includes("consultant-seo") || (source.includes("consultant") && source.includes("seo"))) {
        return "consultant-seo";
    }
    if (source.includes("directeur-marketing") || (source.includes("directeur") && source.includes("marketing"))) {
        return "directeur-marketing";
    }
    if (source.includes("directeur-commercial") || (source.includes("directeur") && source.includes("commercial"))) {
        return "directeur-commercial";
    }
    if (source.includes("analyste-financier") || (source.includes("analyste") && source.includes("financier"))) {
        return "analyste-financier";
    }
    if (source.includes("freelance")) {
        return "freelance";
    }
    if (source.includes("product manager") || source.includes("product-manager")) {
        return "product-manager";
    }
    if (source.includes("strategie")) {
        return "consultant-strategie";
    }
    if (source.includes("sales") || source.includes("commercial")) {
        return "sales-manager";
    }

    return undefined;
}

export function getCategoryLabel(categorySlug: string): string {
    return CATEGORY_LABELS[categorySlug] || categorySlug;
}

export function getTagLabel(tagSlug: string): string {
    return tagSlug
        .split("-")
        .map((part) => part.toUpperCase() === "IA" ? "IA" : part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function getPersonaLabel(personaSlug: string): string {
    return PERSONA_LABELS[personaSlug] || getTagLabel(personaSlug);
}

export function getPersonaDescription(personaSlug: string): string {
    const label = getPersonaLabel(personaSlug);
    return `Guides SlideAI pour ${label.toLowerCase()} qui cree des presentations PowerPoint toute la journee dans un contexte B2B.`;
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
                title: data.title || i18n.t('common.untitled'),
                date: data.date || new Date().toISOString(),
                author: data.author || 'SlideAI',
                excerpt: data.excerpt || '',
                coverImage: data.coverImage,
                content: content,
                language: data.language,
                category: data.category ? slugifyCategory(data.category) : inferCategoryAndTags(slug, data.title || slug).category,
                tags: Array.isArray(data.tags) && data.tags.length > 0
                    ? data.tags.map((tag: string) => slugifyCategory(tag))
                    : inferCategoryAndTags(slug, data.title || slug).tags,
                persona: data.persona ? slugifyCategory(data.persona) : inferPersona(slug, data.title || slug),
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

export async function getPostsByCategory(categorySlug: string, language: string = "fr"): Promise<BlogPost[]> {
    const posts = await getAllPosts(language);
    return posts.filter((post) => post.category === categorySlug);
}

export async function getAllCategories(language: string = "fr"): Promise<BlogCategorySummary[]> {
    const posts = await getAllPosts(language);
    const counts = new Map<string, number>();

    posts.forEach((post) => {
        const category = post.category || "powerpoint-ai";
        counts.set(category, (counts.get(category) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([slug, count]) => ({
            slug,
            label: getCategoryLabel(slug),
            count,
        }))
        .sort((a, b) => b.count - a.count);
}

export async function getPostsByPersona(personaSlug: string, language: string = "fr"): Promise<BlogPost[]> {
    const posts = await getAllPosts(language);
    return posts.filter((post) => post.persona === personaSlug);
}

export async function getAllPersonas(language: string = "fr"): Promise<BlogPersonaSummary[]> {
    const posts = await getAllPosts(language);
    const counts = new Map<string, number>();

    posts.forEach((post) => {
        if (!post.persona) return;
        counts.set(post.persona, (counts.get(post.persona) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([slug, count]) => ({
            slug,
            label: getPersonaLabel(slug),
            count,
        }))
        .sort((a, b) => b.count - a.count);
}

export async function getRelatedPosts(post: BlogPost, language: string = "fr", limit: number = 4): Promise<BlogPost[]> {
    const posts = await getAllPosts(language);
    const currentTags = new Set(post.tags || []);

    return posts
        .filter((candidate) => candidate.slug !== post.slug)
        .map((candidate) => {
            const candidateTags = new Set(candidate.tags || []);
            const sharedTags = [...candidateTags].filter((tag) => currentTags.has(tag)).length;
            const sameCategory = candidate.category === post.category ? 2 : 0;

            return {
                post: candidate,
                score: sharedTags + sameCategory,
            };
        })
        .sort((a, b) => b.score - a.score || new Date(b.post.date).getTime() - new Date(a.post.date).getTime())
        .slice(0, limit)
        .map((entry) => entry.post);
}
