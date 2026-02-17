import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { BlogPost, getPostBySlug } from "@/lib/blog";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Calendar, Sparkles } from "lucide-react";
import { SEO } from "@/components/common/SEO";

export default function BlogPostPage() {
    const { t, i18n } = useTranslation();
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPost = async () => {
            if (slug) {
                const data = await getPostBySlug(slug);
                setPost(data || null);
            }
            setLoading(false);
        };
        loadPost();
    }, [slug]);

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
            </Helmet>

            <div className="max-w-3xl mx-auto">
                <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('blog.backToArticles')}
                </Link>

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
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.date).toLocaleDateString(i18n.language, { dateStyle: 'long' })}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {post.author}
                        </div>
                    </div>
                </header>

                <div className="prose prose-invert prose-lg max-w-none prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>

                {/* Call to Action */}
                <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 text-center">
                    <h3 className="text-2xl font-bold mb-4">{t('blog.cta.title')}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        {t('blog.cta.description')}
                    </p>
                    <Link to="/create">
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
