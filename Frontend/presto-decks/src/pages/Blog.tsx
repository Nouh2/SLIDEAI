import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BlogCategorySummary, BlogPersonaSummary, BlogPost, getAllCategories, getAllPersonas, getAllPosts } from "@/lib/blog";
import { ArrowRight, Calendar, User } from "lucide-react";
import { SEO } from "@/components/common/SEO";
import { useTranslation } from "react-i18next";
import { useLocalePath } from "@/hooks/use-locale-path";

export default function Blog() {
    const { t, i18n } = useTranslation();
    const { locale, localize } = useLocalePath();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategorySummary[]>([]);
    const [personas, setPersonas] = useState<BlogPersonaSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const priorityGuides = [
        {
            title: "Exemples de presentation IA",
            description: "7 cas concrets pour choisir le bon type de presentation a generer.",
            href: "/blog/exemples-presentation-ia",
        },
        {
            title: "Prompts PowerPoint IA",
            description: "15 prompts prets a copier pour mieux cadrer votre deck.",
            href: "/blog/prompts-powerpoint-ia",
        },
        {
            title: "Creer des slides professionnelles avec l'IA",
            description: "Une methode simple pour obtenir des slides plus claires.",
            href: "/blog/creer-slides-professionnelles-ia",
        },
    ];

    useEffect(() => {
        const loadPosts = async () => {
            try {
                setLoading(true);
                const [data, categoryData, personaData] = await Promise.all([
                    getAllPosts(locale),
                    getAllCategories(locale),
                    getAllPersonas(locale),
                ]);
                setPosts(data);
                setCategories(categoryData);
                setPersonas(personaData);
            } catch (error) {
                console.error("Failed to load blog posts", error);
            } finally {
                setLoading(false);
            }
        };
        loadPosts();
    }, [i18n.language, locale]);

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <SEO
                title={t('blog.title', "Blog SlideAI - Conseils et Astuces pour vos présentations")}
                description={t('blog.subtitle', "Découvrez nos guides, tutoriels et articles sur l'intelligence artificielle et la création de présentations impactantes.")}
                url="/blog"
                alternates={{ fr: "/blog", en: "/blog", "x-default": "/blog" }}
            />

            <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-primary">
                        {t('blog.title')}
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {t('blog.subtitle')}
                    </p>
                </div>

                {!loading && locale === "fr" && (
                    <section className="rounded-lg border border-primary/20 bg-primary/5 p-5 md:p-7">
                        <div className="mb-5">
                            <h2 className="text-2xl md:text-3xl font-bold">Guides prioritaires</h2>
                            <p className="text-muted-foreground">
                                Les meilleurs points d'entree pour creer une presentation IA plus vite.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                            {priorityGuides.map((guide) => (
                                <Link
                                    key={guide.href}
                                    to={localize(guide.href)}
                                    className="rounded-lg border border-border/50 bg-background/80 p-5 transition-all hover:border-primary/40 hover:-translate-y-1"
                                >
                                    <h3 className="text-lg font-bold">{guide.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{guide.description}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {!loading && personas.length > 0 && (
                    <section className="space-y-5">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold">{locale === "fr" ? "Metiers" : "Roles"}</h2>
                            <p className="text-muted-foreground">
                                {locale === "fr"
                                    ? "Pages hub pour chaque profil qui cree des PowerPoint toute la journee."
                                    : "Hub pages for each profile creating PowerPoint decks all day long."}
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {personas.map((persona) => (
                                <Link
                                    key={persona.slug}
                                    to={localize(`/blog/metier/${persona.slug}`)}
                                    className="rounded-2xl border border-border/50 bg-card/60 p-5 transition-all hover:border-primary/40 hover:-translate-y-1"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="text-lg font-bold">{persona.label}</h3>
                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                            {persona.count} article{persona.count > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        {locale === "fr"
                                            ? `Voir tous les guides pour ${persona.label.toLowerCase()}.`
                                            : `Browse every guide for ${persona.label.toLowerCase()}.`}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {!loading && categories.length > 0 && (
                    <section className="space-y-5">
                        <div className="flex items-end justify-between gap-4">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold">{locale === "fr" ? "Clusters blog" : "Blog clusters"}</h2>
                                <p className="text-muted-foreground">
                                    {locale === "fr"
                                        ? "Des hubs thematiques pour renforcer le maillage interne et la navigation SEO."
                                        : "Topic hubs built to strengthen internal linking and SEO navigation."}
                                </p>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map((category) => (
                                <Link
                                    key={category.slug}
                                    to={localize(`/blog/c/${category.slug}`)}
                                    className="rounded-2xl border border-border/50 bg-card/60 p-5 transition-all hover:border-primary/40 hover:-translate-y-1"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className="text-lg font-bold">{category.label}</h3>
                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                            {category.count} article{category.count > 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        {locale === "fr"
                                            ? `Voir tous les contenus relies a ${category.label.toLowerCase()}.`
                                            : `Browse every article related to ${category.label.toLowerCase()}.`}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                to={localize(`/blog/${post.slug}`)}
                                className="group flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="aspect-video relative overflow-hidden bg-muted">
                                    {post.coverImage ? (
                                        <img
                                            src={post.coverImage}
                                            alt={post.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                                            <span className="text-4xl">📝</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 p-6 flex flex-col space-y-4">
                                    <div className="flex items-center text-xs text-muted-foreground gap-4">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(post.date).toLocaleDateString(i18n.language, { dateStyle: 'long' })}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {post.author}
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h2>

                                    <p className="text-muted-foreground text-sm line-clamp-3 flex-1">
                                        {post.excerpt}
                                    </p>

                                    <div className="pt-4 flex items-center text-primary font-medium text-sm">
                                        {t('blog.readMore')}
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
