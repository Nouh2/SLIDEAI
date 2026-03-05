import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();

  const links = {
    product: [
      { label: "Generateur PowerPoint IA", href: "/generateur-powerpoint-ia" },
      { label: "Creer un PowerPoint avec IA", href: "/creer-powerpoint-avec-ia" },
      { label: "Outil IA presentation", href: "/outil-ia-presentation" },
      { label: t('footer.links.examples'), href: "/examples" },
      { label: "Blog", href: "/blog" },
      { label: t('footer.links.pricing'), href: "/pricing" },
    ],
    legal: [
      { label: t('footer.links.privacy'), href: "/privacy" },
      { label: t('footer.links.terms'), href: "/terms" },
      { label: t('footer.links.gdpr'), href: "/gdpr" },
    ],
  };

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]/30">
      <div className="container py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="space-y-2">
            <Link to="/" className="flex items-center space-x-2">
              <span className="font-semibold text-lg bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                SlideAI
              </span>
            </Link>
            <p className="text-xs text-[var(--muted)] max-w-xs">
              {t('footer.description')}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-sm">{t('footer.product')}</h3>
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
            <h3 className="font-semibold mb-3 text-sm">{t('footer.legal')}</h3>
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
            <h3 className="font-semibold mb-3 text-sm">{t('footer.contact')}</h3>
            <a href="mailto:contact@slideai.fr" className="text-xs text-[var(--muted)] hover:text-[var(--primary)] transition-colors">
              contact@slideai.fr
            </a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  );
};
