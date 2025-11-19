import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const Footer = () => {
  const links = {
    product: [
      { label: "Exemples", href: "/examples" },
      { label: "Tarifs", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "Roadmap", href: "/roadmap" },
    ],
    legal: [
      { label: "Confidentialité", href: "/privacy" },
      { label: "CGU", href: "/terms" },
      { label: "RGPD", href: "/gdpr" },
    ],
  };

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]/30">
      <div className="container py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="space-y-2">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-semibold text-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                SlideAI
              </span>
            </Link>
            <p className="text-xs text-[var(--muted)] max-w-xs">
              Créez des présentations professionnelles en quelques minutes grâce à l'IA.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Produit</h3>
            <ul className="space-y-1.5">
              {links.product.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Légal</h3>
            <ul className="space-y-1.5">
              {links.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">Contact</h3>
            <p className="text-xs text-[var(--muted)]">
              contact@slideai.com
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
          © {new Date().getFullYear()} SlideAI. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};
