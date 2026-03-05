import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SEO } from "@/components/common/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessSeoLandingProps {
  title: string;
  description: string;
  h1: string;
  intro: string;
  url: string;
  keyword: string;
  secondaryKeyword: string;
  useCases: string[];
  benefits: string[];
  howItWorks: string[];
}

const businessPages = [
  { title: "Generateur PowerPoint IA", href: "/generateur-powerpoint-ia" },
  { title: "Creer un PowerPoint avec IA", href: "/creer-powerpoint-avec-ia" },
  { title: "Outil IA presentation", href: "/outil-ia-presentation" },
];

export function BusinessSeoLanding({
  title,
  description,
  h1,
  intro,
  url,
  keyword,
  secondaryKeyword,
  useCases,
  benefits,
  howItWorks,
}: BusinessSeoLandingProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ctaPath = user ? "/create" : `/auth?returnTo=${encodeURIComponent("/create")}`;
  const relatedPages = businessPages.filter((page) => page.href !== url);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://www.slideai.fr/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: h1,
        item: `https://www.slideai.fr${url}`,
      },
    ],
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <SEO title={title} description={description} keywords={`${keyword}, ${secondaryKeyword}`} url={url} />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="max-w-5xl mx-auto space-y-12">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour a l'accueil
        </button>

        <section className="space-y-6 rounded-3xl border border-border/60 bg-card/50 p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            {keyword}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">{h1}</h1>
          <p className="max-w-3xl text-lg text-muted-foreground leading-8">{intro}</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" onClick={() => navigate(ctaPath)} className="font-bold">
              <Sparkles className="h-4 w-4 mr-2" />
              Demarrer mon essai 7 jours
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" asChild className="font-bold">
              <Link to="/pricing">Voir les tarifs</Link>
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-6">
            <h2 className="text-2xl font-bold mb-4">Pour qui ?</h2>
            <ul className="space-y-3">
              {useCases.map((useCase) => (
                <li key={useCase} className="flex items-start gap-3 text-foreground/80">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-6">
            <h2 className="text-2xl font-bold mb-4">Benefices</h2>
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-foreground/80">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Comment ca marche</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {howItWorks.map((step, index) => (
              <div key={step} className="rounded-xl border border-border/40 bg-background/70 p-5">
                <div className="mb-3 text-sm font-bold text-primary">Etape {index + 1}</div>
                <p className="text-foreground/80 leading-7">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Pourquoi SlideAI pour {secondaryKeyword.toLowerCase()} ?
          </h2>
          <p className="text-muted-foreground leading-8">
            SlideAI aide les equipes B2B a structurer rapidement un support, produire des slides lisibles, puis finaliser le rendu
            avant export PowerPoint. L'objectif n'est pas de remplacer votre expertise, mais d'accelerer la partie repetitive.
          </p>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/40 p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-5">Pages liees</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {relatedPages.map((page) => (
              <Link
                key={page.href}
                to={page.href}
                className="rounded-xl border border-border/40 bg-background/70 p-5 transition-all hover:border-primary/40 hover:text-primary"
              >
                <div className="text-lg font-semibold">{page.title}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Explorer cette page business pour renforcer le maillage interne et capter une intention de recherche complementaire.
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
