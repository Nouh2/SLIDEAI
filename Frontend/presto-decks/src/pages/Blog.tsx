import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BlogPost, getAllPosts } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, User } from "lucide-react";
import { SEO } from "@/components/common/SEO";
import { useTranslation } from "react-i18next";

export default function Blog() {
    const { t, i18n } = useTranslation();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPosts = async () => {
            try {
                setLoading(true);
                const data = await getAllPosts(i18n.language);
                setPosts(data);
            } catch (error) {
                console.error("Failed to load blog posts", error);
            } finally {
                setLoading(false);
            }
        };
        loadPosts();
    }, [i18n.language]);

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <SEO
                title={t('blog.title', "Blog SlideAI - Conseils et Astuces pour vos présentations")}
                description={t('blog.subtitle', "Découvrez nos guides, tutoriels et articles sur l'intelligence artificielle et la création de présentations impactantes.")}
                url="/blog"
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

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <Link
                                key={post.slug}
                                to={`/blog/${post.slug}`}
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
