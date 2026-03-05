import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, Calendar, User } from "lucide-react";
import { SEO } from "@/components/common/SEO";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BlogPost, getCategoryLabel, getPostsByCategory } from "@/lib/blog";
import { useTranslation } from "react-i18next";

export default function BlogCategory() {
  const { i18n } = useTranslation();
  const { category } = useParams<{ category: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      if (!category) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPostsByCategory(category, i18n.language);
        setPosts(data);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [category, i18n.language]);

  const categoryLabel = getCategoryLabel(category || "");
  const title = `Blog ${categoryLabel} | SlideAI`;
  const description = `Articles SlideAI sur ${categoryLabel.toLowerCase()} pour mieux structurer vos presentations et votre maillage SEO.`;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <SEO title={title} description={description} url={`/blog/c/${category || ""}`} />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.slideai.fr/" },
              { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.slideai.fr/blog" },
              { "@type": "ListItem", position: 3, name: categoryLabel, item: `https://www.slideai.fr/blog/c/${category}` },
            ],
          })}
        </script>
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-4">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour au blog
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
                <BreadcrumbPage>{categoryLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold">{categoryLabel}</h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            Articles regroupes pour renforcer le cluster {categoryLabel.toLowerCase()} et orienter le maillage interne vers les bons sujets.
          </p>
        </header>

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
                className="group flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {post.coverImage ? (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />
                  )}
                </div>

                <div className="flex-1 p-6 flex flex-col space-y-4">
                  <div className="flex items-center text-xs text-muted-foreground gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.date).toLocaleDateString(i18n.language, { dateStyle: "long" })}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {post.author}
                    </div>
                  </div>

                  <h2 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-muted-foreground text-sm line-clamp-3 flex-1">{post.excerpt}</p>

                  <div className="pt-4 flex items-center text-primary font-medium text-sm">
                    Lire l'article
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
