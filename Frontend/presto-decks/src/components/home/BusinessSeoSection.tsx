import { Link } from "react-router-dom";

const pages = [
  {
    title: "Generateur PowerPoint IA",
    href: "/generateur-powerpoint-ia",
    description: "Page pilier pour la requete business principale autour de la generation PowerPoint par IA.",
  },
  {
    title: "Creer un PowerPoint avec IA",
    href: "/creer-powerpoint-avec-ia",
    description: "Page orientee usage pour les visiteurs qui cherchent comment produire un deck rapidement.",
  },
  {
    title: "Outil IA presentation",
    href: "/outil-ia-presentation",
    description: "Page plus generique pour capter les recherches autour des outils IA de presentation.",
  },
];

export function BusinessSeoSection() {
  return (
    <section className="py-8 md:py-10 px-4 relative z-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-5xl font-bold">Pages utiles pour vos presentations IA</h2>
          <p className="max-w-3xl mx-auto text-muted-foreground">
            Trois pages piliers pour comprendre comment SlideAI aide a creer des presentations PowerPoint plus vite dans un contexte B2B.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {pages.map((page) => (
            <Link
              key={page.href}
              to={page.href}
              className="rounded-2xl border border-border/60 bg-card/50 p-6 transition-all hover:border-primary/40 hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-bold mb-3">{page.title}</h3>
              <p className="text-sm leading-7 text-muted-foreground">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
