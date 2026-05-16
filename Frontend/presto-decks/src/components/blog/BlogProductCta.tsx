import { Link } from "react-router-dom";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Analytics } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { useLocalePath } from "@/hooks/use-locale-path";
import {
  BlogCtaPlacement,
  buildBlogCreatePath,
  createBlogAttribution,
  getBlogAttributionEventParams,
  rememberBlogAttribution,
} from "@/lib/blogAttribution";

type BlogProductCtaProps = {
  postSlug: string;
  postTitle: string;
  postCategory?: string | null;
  placement: Extract<BlogCtaPlacement, "top" | "inline" | "bottom">;
};

export function BlogProductCta({ postSlug, postTitle, postCategory, placement }: BlogProductCtaProps) {
  const { user } = useAuth();
  const { locale, localize } = useLocalePath();
  const isFr = locale === "fr";
  const attribution = createBlogAttribution({
    postSlug,
    postTitle,
    placement,
    category: postCategory,
    wasAuthenticated: Boolean(user),
  });
  const createPath = buildBlogCreatePath(attribution);
  const ctaPath = user ? createPath : `/auth?returnTo=${encodeURIComponent(createPath)}`;
  const variant = placement === "top" ? "article_top" : placement === "inline" ? "article_midpoint" : "article_bottom";

  const handleClick = () => {
    rememberBlogAttribution(attribution);
    Analytics.trackGaEvent("blog_cta_click", {
      ...getBlogAttributionEventParams(attribution),
      placement,
      cta_variant: variant,
      destination: user ? "create" : "auth",
    });
  };

  return (
    <aside className="my-10 rounded-lg border border-primary/25 bg-primary/5 p-5 md:p-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {isFr ? "Essai gratuit 7 jours" : "7-day free trial"}
          </div>
          <h3 className="text-xl font-extrabold leading-tight">
            {placement === "top"
              ? isFr
                ? "Generez une presentation a partir de cet article"
                : "Generate a presentation from this article"
              : isFr
                ? "Transformez ce guide en presentation"
                : "Turn this guide into a presentation"}
          </h3>
          <p className="max-w-xl text-sm leading-6 text-foreground/70">
            {isFr
              ? "Collez votre sujet ou importez un document. SlideAI structure les slides, applique un rendu professionnel et vous laisse exporter."
              : "Paste your topic or import a document. SlideAI structures the slides, designs the deck, and lets you export it."}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
          <Button asChild className="font-bold">
            <Link to={localize(ctaPath)} onClick={handleClick}>
              <FileText className="mr-2 h-4 w-4" />
              {isFr ? "Tester avec mon sujet" : "Try with my topic"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="font-bold">
            <Link to={localize("/examples")}>{isFr ? "Voir des exemples" : "See examples"}</Link>
          </Button>
        </div>
      </div>
    </aside>
  );
}
