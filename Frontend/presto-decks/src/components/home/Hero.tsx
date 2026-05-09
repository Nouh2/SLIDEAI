import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";
import { useLocalePath } from "@/hooks/use-locale-path";
import { homePageContent } from "@/content/seo/marketingPages";
import { TemplatePicker } from "./TemplatePicker";

/**
 * Slim hero (5 vertical elements):
 *  1. badge
 *  2. h1
 *  3. subtitle
 *  4. dual CTA
 *  5. single trust line
 *
 * Visual: TemplatePicker (right on desktop, below CTAs on mobile).
 * No framer-motion, no large blurs, no nested heavy reveals.
 */
export function Hero() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { localize } = useLocalePath();
  const isFr = i18n.language.startsWith("fr");
  const pageContent = isFr ? homePageContent.fr : homePageContent.en;
  const heroContent = pageContent.hero;
  const pageLabel = isFr ? "/" : "/en";

  const handleHeroCta = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      `Landing Hero CTA - ${pageLabel}`
    );
    navigate(localize("/pricing"));
  };

  const handleExamplesCta = () => {
    Analytics.trackEvent(
      "Navigation",
      "Examples Click",
      `Landing Hero Secondary CTA - ${pageLabel}`
    );
    navigate(localize("/examples"));
  };

  const trustItems = (heroContent.trustLine || "")
    .split(" - ")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section className="relative z-10 overflow-hidden px-4 pt-6 pb-8 md:pt-10 md:pb-12">
      {/* Single subtle accent — no large blur, no animation */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-70"
        style={{
          background:
            "radial-gradient(70% 60% at 30% 30%, hsl(var(--primary) / 0.12), transparent 70%), radial-gradient(60% 60% at 80% 20%, hsl(280 100% 70% / 0.10), transparent 70%)",
        }}
      />

      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left: copy block */}
        <div className="text-center lg:col-span-6 lg:text-left hero-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/70 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {heroContent.badge}
          </span>

          <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-[3.6rem]">
            {heroContent.headline}
          </h1>

          <p className="mt-5 max-w-xl text-base text-foreground/65 sm:text-lg lg:text-xl mx-auto lg:mx-0">
            {heroContent.subtitle}
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap lg:items-start lg:justify-start">
            <Button
              size="lg"
              onClick={handleHeroCta}
              className="group h-14 rounded-xl bg-gradient-primary px-7 text-base font-bold text-foreground transition-all duration-300 hover:shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.6)]"
            >
              {heroContent.primaryCta}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleExamplesCta}
              className="h-14 rounded-xl px-7 text-base font-bold"
            >
              {heroContent.secondaryCta}
            </Button>
          </div>

          {trustItems.length > 0 && (
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-foreground/60 lg:justify-start">
              {trustItems.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: template picker */}
        <div className="lg:col-span-6 hero-fade-in-delayed">
          <TemplatePicker />
        </div>
      </div>

      <style>{`
        @keyframes hero-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        .hero-fade-in { animation: hero-fade 520ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        .hero-fade-in-delayed { animation: hero-fade 620ms 120ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .hero-fade-in, .hero-fade-in-delayed { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
