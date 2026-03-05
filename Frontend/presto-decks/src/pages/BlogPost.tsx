import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BlogPost, getCategoryLabel, getPersonaLabel, getPostBySlug, getRelatedPosts, getTagLabel } from "@/lib/blog";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Sparkles } from "lucide-react";
import { SEO } from "@/components/common/SEO";
import { useAuth } from "@/contexts/AuthContext";
import type { Components } from "react-markdown";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const businessPages = [
    { title: "Generateur PowerPoint IA", href: "/generateur-powerpoint-ia" },
    { title: "Creer un PowerPoint avec IA", href: "/creer-powerpoint-avec-ia" },
    { title: "Outil IA presentation", href: "/outil-ia-presentation" },
];

export default function BlogPostPage() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const ctaPath = user ? "/create" : `/auth?returnTo=${encodeURIComponent("/create")}`;
    const relatedLinks = [
        ...relatedPosts.map((relatedPost) => ({
            title: relatedPost.title,
            href: `/blog/${relatedPost.slug}`,
        })),
        ...businessPages,
    ].slice(0, 4);

    const markdownComponents: Components = {
        a: ({ href = "", children }) => {
            const isSlideAiCta = href.includes("/create") || href.includes("slideai.fr/create");
            const isInternalLink = href.startsWith("/");
            const resolvedHref = isSlideAiCta ? ctaPath : href;

            if (isSlideAiCta) {
                return (
                    <a
                        href={resolvedHref}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-bold text-foreground no-underline shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span>{children}</span>
                    </a>
                );
            }

            if (isInternalLink) {
                return (
                    <Link
                        to={href}
                        className="font-semibold text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary/80"
                    >
                        {children}
                    </Link>
                );
            }

            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary/80"
                >
                    {children}
                </a>
            );
        },
        ul: ({ children }) => <ul className="my-6 space-y-3 pl-0">{children}</ul>,
        ol: ({ children }) => <ol className="my-6 space-y-3 pl-0">{children}</ol>,
        li: ({ children }) => (
            <li className="ml-0 flex items-start gap-3 leading-relaxed text-foreground/85">
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                <span className="flex-1">{children}</span>
            </li>
        ),
        p: ({ children }) => <p className="my-5 text-base md:text-lg leading-8 text-foreground/80">{children}</p>,
        h2: ({ children }) => <h2 className="mt-12 mb-5 text-2xl md:text-3xl font-bold text-foreground">{children}</h2>,
        h3: ({ children }) => <h3 className="mt-8 mb-4 text-xl md:text-2xl font-bold text-foreground">{children}</h3>,
        strong: ({ children }) => <strong className="font-extrabold text-foreground">{children}</strong>,
        code: ({ children }) => (
            <code className="rounded-md bg-secondary/30 px-2 py-1 text-sm font-medium text-foreground">
                {children}
            </code>
        ),
    };

    useEffect(() => {
        const loadPost = async () => {
            if (slug) {
                const data = await getPostBySlug(slug);
                setPost(data || null);
                if (data) {
                    const related = await getRelatedPosts(data, i18n.language, 2);
                    setRelatedPosts(related);
                }
            }
            setLoading(false);
        };
        loadPost();
    }, [slug, i18n.language]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen pt-32 px-4 text-center">
                <h1 className="text-2xl font-bold mb-4">{t('blog.notFound')}</h1>
                <Link to="/blog">
                    <Button variant="outline">{t('blog.backToBlog')}</Button>
                </Link>
            </div>
        );
    }

    return (
        <article className="min-h-screen pt-24 pb-16 px-4">
            <SEO
                title={post.title}
                description={post.excerpt}
                image={post.coverImage}
                url={`/blog/${post.slug}`}
                type="article"
            />
            <Helmet>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        "headline": post.title,
                        "image": post.coverImage ? [post.coverImage] : [],
                        "datePublished": post.date,
                        "dateModified": post.date,
                        "author": [{
                            "@type": "Organization",
                            "name": post.author,
                            "url": "https://www.slideai.fr"
                        }],
                        "publisher": {
                            "@type": "Organization",
                            "name": "SlideAI",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://www.slideai.fr/logo.png"
                            }
                        },
                        "description": post.excerpt,
                        "mainEntityOfPage": {
                            "@type": "WebPage",
                            "@id": `https://www.slideai.fr/blog/${post.slug}`
                        }
                    })}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            {
                                "@type": "ListItem",
                                position: 1,
                                name: "Accueil",
                                item: "https://www.slideai.fr/"
                            },
                            {
                                "@type": "ListItem",
                                position: 2,
                                name: "Blog",
                                item: "https://www.slideai.fr/blog"
                            },
                            {
                                "@type": "ListItem",
                                position: 3,
                                name: post.title,
                                item: `https://www.slideai.fr/blog/${post.slug}`
                            }
                        ]
                    })}
                </script>
            </Helmet>

            <div className="max-w-3xl mx-auto">
                <div className="space-y-4 mb-8">
                    <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t('blog.backToArticles')}
                    </Link>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link to="/">Accueil</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link to="/blog">Blog</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{post.title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {post.coverImage && (
                    <div className="rounded-2xl overflow-hidden aspect-video mb-8 shadow-2xl">
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                )}

                <header className="space-y-4 mb-10 text-center md:text-left">
                    <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                        {post.persona && (
                            <Link
                                to={`/blog/metier/${post.persona}`}
                                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-medium text-primary transition-colors hover:bg-primary/10"
                            >
                                {getPersonaLabel(post.persona)}
                            </Link>
                        )}
                        {post.category && (
                            <Link
                                to={`/blog/c/${post.category}`}
                                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-medium text-primary transition-colors hover:bg-primary/10"
                            >
                                {getCategoryLabel(post.category)}
                            </Link>
                        )}
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.date).toLocaleDateString(i18n.language, { dateStyle: 'long' })}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {post.author}
                        </div>
                    </div>
                    {!!post.tags?.length && (
                        <div className="flex flex-wrap gap-2">
                            {post.tags.slice(0, 4).map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground"
                                >
                                    {getTagLabel(tag)}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                <div className="max-w-none">
                    <ReactMarkdown components={markdownComponents}>{post.content}</ReactMarkdown>
                </div>

                <div className="mt-16 rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
                    <h3 className="text-2xl font-bold mb-5">Pages et articles lies</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        {relatedLinks.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className="rounded-xl border border-border/50 bg-background/70 p-4 text-sm font-medium text-foreground/80 transition-all hover:border-primary/40 hover:text-primary"
                            >
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 text-center">
                    <h3 className="text-2xl font-bold mb-4">{t('blog.cta.title')}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {t('blog.cta.description')}
                    </p>
                    <Link to={ctaPath}>
                        <Button size="lg" className="bg-gradient-primary">
                            <Sparkles className="w-4 h-4 mr-2" />
                            {t('blog.cta.button')}
                        </Button>
                    </Link>
                </div>
            </div>
        </article>
    );
}
