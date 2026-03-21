import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight, Calendar, User } from "lucide-react";
import { SEO } from "@/components/common/SEO";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BlogPost, getPersonaDescription, getPersonaLabel, getPostsByPersona, hasPersonaInLanguage } from "@/lib/blog";
import { useTranslation } from "react-i18next";
import { useLocalePath } from "@/hooks/use-locale-path";
import { toAbsoluteUrl } from "@/lib/localeRouting";

export default function BlogPersona() {
  const { i18n } = useTranslation();
  const { locale, localize } = useLocalePath();
  const { persona } = useParams<{ persona: string }>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const alternateLocale = locale === "fr" ? "en" : "fr";

  useEffect(() => {
    const loadPosts = async () => {
      if (!persona) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPostsByPersona(persona, locale);
        setPosts(data);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [persona, i18n.language, locale]);

  const personaLabel = getPersonaLabel(persona || "", locale);
  const description = getPersonaDescription(persona || "", locale);
  const hasAlternatePersona = persona ? hasPersonaInLanguage(persona, alternateLocale) : false;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <SEO
        title={`${personaLabel} PowerPoint IA`}
        description={description}
        url={`/blog/metier/${persona || ""}`}
        alternates={hasAlternatePersona ? { fr: `/blog/metier/${persona}`, en: `/blog/metier/${persona}`, "x-default": "/blog" } : undefined}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: locale === "fr" ? "Accueil" : "Home", item: toAbsoluteUrl("/", locale) },
              { "@type": "ListItem", position: 2, name: "Blog", item: toAbsoluteUrl("/blog", locale) },
              { "@type": "ListItem", position: 3, name: personaLabel, item: toAbsoluteUrl(`/blog/metier/${persona}`, locale) },
            ],
          })}
        </script>
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-4">
          <Link to={localize("/blog")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {locale === "fr" ? "Retour au blog" : "Back to blog"}
          </Link>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={localize("/")}>{locale === "fr" ? "Accueil" : "Home"}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={localize("/blog")}>Blog</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{personaLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <header className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold">{personaLabel}</h1>
          <p className="max-w-3xl text-lg text-muted-foreground">{description}</p>
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
                to={localize(`/blog/${post.slug}`)}
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
                    {locale === "fr" ? "Lire l'article" : "Read article"}
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
