import { Link } from "react-router-dom";
import { seoLandingLinks } from "@/content/seo/marketingPages";

export function BusinessSeoSection() {
  return (
    <section className="pt-4 pb-8 md:pt-4 md:pb-10 px-4 relative z-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-5xl font-bold">Pages a forte intention pour vos presentations IA</h2>
          <p className="max-w-3xl mx-auto text-muted-foreground">
            Un cluster de pages pour capter les recherches les plus proches de l'action, puis renvoyer vers l'essai ou les exemples.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {seoLandingLinks.map((page) => (
            <Link
              key={page.href}
              to={page.href}
              className="rounded-2xl border border-border/60 bg-card/50 p-6 transition-all hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
                {page.shortLabel}
              </div>
              <h3 className="text-xl font-bold mb-3">{page.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
