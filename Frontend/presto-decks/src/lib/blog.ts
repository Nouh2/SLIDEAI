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

const CATEGORY_LABELS: Record<string, { fr: string; en: string }> = {
    "consulting": { fr: "Conseil", en: "Consulting" },
    "marketing": { fr: "Marketing", en: "Marketing" },
    "sales": { fr: "Commercial", en: "Sales" },
    "finance": { fr: "Finance", en: "Finance" },
    "hr": { fr: "RH", en: "HR" },
    "product": { fr: "Produit", en: "Product" },
    "training": { fr: "Formation", en: "Training" },
    "powerpoint-ai": { fr: "PowerPoint IA", en: "AI PowerPoint" },
    "pitch-deck": { fr: "Pitch deck", en: "Pitch deck" },
    "competitive": { fr: "Alternatives et comparatifs", en: "Alternatives and comparisons" },
    "productivity": { fr: "Productivite", en: "Productivity" },
};

const PERSONA_LABELS: Record<string, { fr: string; en: string }> = {
    "consultant-rh": { fr: "Consultant RH", en: "HR consultant" },
    "consultant-seo": { fr: "Consultant SEO", en: "SEO consultant" },
    "consultant-strategie": { fr: "Consultant strategie", en: "Strategy consultant" },
    "directeur-marketing": { fr: "Directeur marketing", en: "Marketing director" },
    "directeur-commercial": { fr: "Directeur commercial", en: "Sales director" },
    "analyste-financier": { fr: "Analyste financier", en: "Financial analyst" },
    "analyste-credit-bancaire": { fr: "Analyste credit bancaire", en: "Credit risk analyst" },
    "controleur-de-gestion": { fr: "Controleur de gestion", en: "Financial controller" },
    "consultant-erp": { fr: "Consultant ERP", en: "ERP consultant" },
    "consultant-transformation-organisationnelle": { fr: "Consultant transformation organisationnelle", en: "Organizational transformation consultant" },
    "responsable-marketing-produit": { fr: "Responsable marketing produit", en: "Product marketing manager" },
    "responsable-marketing-retail": { fr: "Responsable marketing retail", en: "Retail marketing manager" },
    "responsable-communication": { fr: "Responsable communication", en: "Communications manager" },
    "recruteur": { fr: "Recruteur", en: "Recruiter" },
    "freelance": { fr: "Freelance", en: "Freelancer" },
    "product-manager": { fr: "Product manager", en: "Product manager" },
    "responsable-formation": { fr: "Responsable formation", en: "Training manager" },
    "consultant-cybersecurite": { fr: "Consultant cybersecurite", en: "Cybersecurity consultant" },
    "sales-manager": { fr: "Sales manager", en: "Sales manager" },
};

function normalizeLanguage(language?: string): "fr" | "en" {
    return String(language || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
}

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

    if (source.includes("retail") || source.includes("magasin") || source.includes("performance magasin")) {
        return { category: "marketing", tags: ["retail", "magasin", "performance", "powerpoint", "ia"] };
    }

    if (source.includes("marketing produit") || source.includes("positionnement produit") || source.includes("product marketing")) {
        return { category: "marketing", tags: ["marketing-produit", "positionnement", "powerpoint", "ia"] };
    }

    if (source.includes("communication") || source.includes("communication interne") || source.includes("plan de communication")) {
        return { category: "marketing", tags: ["communication", "plan", "powerpoint", "ia"] };
    }

    if (source.includes("product manager") || source.includes("roadmap produit") || source.includes("produit")) {
        return { category: "product", tags: ["product", "roadmap", "powerpoint", "ia"] };
    }

    if (source.includes("formation") || source.includes("training")) {
        return { category: "training", tags: ["formation", "supports", "powerpoint", "ia"] };
    }

    if (source.includes("recruteur") || source.includes("recrutement") || source.includes("recruit")) {
        return { category: "hr", tags: ["recrutement", "rh", "powerpoint", "ia"] };
    }

    if (source.includes("commercial") || source.includes("vente") || source.includes("sales")) {
        return { category: "sales", tags: ["sales", "b2b", "powerpoint", "ia"] };
    }

    if (source.includes("financier") || source.includes("finance")) {
        return { category: "finance", tags: ["finance", "analyse", "powerpoint", "ia"] };
    }

    if (source.includes("credit bancaire") || source.includes("analyse de risque") || source.includes("risque credit")) {
        return { category: "finance", tags: ["credit", "risque", "banque", "powerpoint", "ia"] };
    }

    if (source.includes("controleur de gestion") || source.includes("controleur-de-gestion") || source.includes("reporting financier")) {
        return { category: "finance", tags: ["controle-de-gestion", "reporting", "finance", "powerpoint", "ia"] };
    }

    if (source.includes("cyber") || source.includes("securite")) {
        return { category: "consulting", tags: ["cybersecurite", "audit", "powerpoint", "ia"] };
    }

    if (source.includes("erp")) {
        return { category: "consulting", tags: ["erp", "cadrage", "consulting", "powerpoint", "ia"] };
    }

    if (source.includes("transformation organisationnelle") || source.includes("organisationnelle")) {
        return { category: "consulting", tags: ["transformation", "organisation", "consulting", "powerpoint", "ia"] };
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
    if (source.includes("analyste credit bancaire") || source.includes("analyste-credit-bancaire") || source.includes("risque credit")) {
        return "analyste-credit-bancaire";
    }
    if (source.includes("controleur de gestion") || source.includes("controleur-de-gestion")) {
        return "controleur-de-gestion";
    }
    if (source.includes("freelance")) {
        return "freelance";
    }
    if (source.includes("product manager") || source.includes("product-manager")) {
        return "product-manager";
    }
    if (source.includes("responsable formation") || source.includes("responsable-formation")) {
        return "responsable-formation";
    }
    if (source.includes("consultant cybers") || source.includes("cybersecurite") || source.includes("cyber")) {
        return "consultant-cybersecurite";
    }
    if (source.includes("consultant erp") || source.includes("consultant-erp") || source.includes("erp")) {
        return "consultant-erp";
    }
    if (source.includes("transformation organisationnelle") || source.includes("consultant transformation organisationnelle") || source.includes("consultant-transformation-organisationnelle")) {
        return "consultant-transformation-organisationnelle";
    }
    if (source.includes("responsable marketing produit") || source.includes("responsable-marketing-produit") || source.includes("product marketing")) {
        return "responsable-marketing-produit";
    }
    if (source.includes("responsable marketing retail") || source.includes("responsable-marketing-retail") || source.includes("retail marketing")) {
        return "responsable-marketing-retail";
    }
    if (source.includes("responsable communication") || source.includes("responsable-communication") || source.includes("plan de communication")) {
        return "responsable-communication";
    }
    if (source.includes("recruteur") || source.includes("recrutement") || source.includes("recruit")) {
        return "recruteur";
    }
    if (source.includes("strategie")) {
        return "consultant-strategie";
    }
    if (source.includes("sales") || source.includes("commercial")) {
        return "sales-manager";
    }

    return undefined;
}

export function getCategoryLabel(categorySlug: string, language: string = "fr"): string {
    const locale = normalizeLanguage(language);
    return CATEGORY_LABELS[categorySlug]?.[locale] || categorySlug;
}

export function getTagLabel(tagSlug: string): string {
    return tagSlug
        .split("-")
        .map((part) => part.toUpperCase() === "IA" ? "IA" : part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}

export function getPersonaLabel(personaSlug: string, language: string = "fr"): string {
    const locale = normalizeLanguage(language);
    return PERSONA_LABELS[personaSlug]?.[locale] || getTagLabel(personaSlug);
}

export function getPersonaDescription(personaSlug: string, language: string = "fr"): string {
    const locale = normalizeLanguage(language);
    const label = getPersonaLabel(personaSlug, locale);
    return locale === "en"
        ? `SlideAI guides for ${label.toLowerCase()} building PowerPoint presentations in a B2B context.`
        : `Guides SlideAI pour ${label.toLowerCase()} qui cree des presentations PowerPoint toute la journee dans un contexte B2B.`;
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

export function hasPostInLanguage(slug: string, language: string): boolean {
    const posts = getParsedPosts();
    const currentLang = normalizeLanguage(language);

    return posts.some((post) => {
        const postLang = normalizeLanguage(post.language);
        return post.slug === slug && postLang === currentLang;
    });
}

export function hasCategoryInLanguage(categorySlug: string, language: string): boolean {
    const currentLang = normalizeLanguage(language);
    return getParsedPosts().some((post) => {
        const postLang = normalizeLanguage(post.language);
        return post.category === categorySlug && postLang === currentLang;
    });
}

export function hasPersonaInLanguage(personaSlug: string, language: string): boolean {
    const currentLang = normalizeLanguage(language);
    return getParsedPosts().some((post) => {
        const postLang = normalizeLanguage(post.language);
        return post.persona === personaSlug && postLang === currentLang;
    });
}

export async function getPostBySlug(slug: string, language?: string): Promise<BlogPost | undefined> {
    const posts = getParsedPosts();

    if (language) {
        const currentLang = normalizeLanguage(language);
        const localizedPost = posts.find((post) => {
            const postLang = normalizeLanguage(post.language);
            return post.slug === slug && postLang === currentLang;
        });

        if (localizedPost) {
            return localizedPost;
        }
    }

    return posts.find((post) => post.slug === slug);
}

export async function getPostsByCategory(categorySlug: string, language: string = "fr"): Promise<BlogPost[]> {
    const posts = await getAllPosts(language);
    return posts.filter((post) => post.category === categorySlug);
}

export async function getAllCategories(language: string = "fr"): Promise<BlogCategorySummary[]> {
    const posts = await getAllPosts(language);
    const locale = normalizeLanguage(language);
    const counts = new Map<string, number>();

    posts.forEach((post) => {
        const category = post.category || "powerpoint-ai";
        counts.set(category, (counts.get(category) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([slug, count]) => ({
            slug,
            label: getCategoryLabel(slug, locale),
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
    const locale = normalizeLanguage(language);
    const counts = new Map<string, number>();

    posts.forEach((post) => {
        if (!post.persona) return;
        counts.set(post.persona, (counts.get(post.persona) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([slug, count]) => ({
            slug,
            label: getPersonaLabel(slug, locale),
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
