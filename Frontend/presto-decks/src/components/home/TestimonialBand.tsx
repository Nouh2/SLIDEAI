import { useTranslation } from "react-i18next";
import { Quote } from "lucide-react";

/**
 * Single big testimonial on a contrast band.
 * Replaces the old grid of avatars — one strong emotional hit, Gamma-style.
 * Pure CSS; no framer-motion, no large blurs.
 */
export function TestimonialBand() {
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");

  const quote = isFr
    ? "SlideAI me fait gagner 3 à 4 heures par présentation client. Je passe ce temps sur l'analyse et la relation, plus sur la mise en forme."
    : "SlideAI saves me 3 to 4 hours per client deck. I now spend that time on analysis and the client relationship, not formatting.";

  const author = isFr ? "Aurélie M." : "Aurelie M.";
  const role = isFr ? "Consultante senior, freelance" : "Senior consultant, freelance";

  // Simple monogram SVG so we don't depend on an external avatar
  const monogram = author.charAt(0);

  return (
    <section className="relative z-10 my-10 md:my-14 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-12 md:px-12 md:py-16 text-white shadow-[0_30px_80px_-40px_rgba(15,42,69,0.55)]"
          style={{
            background:
              "linear-gradient(135deg, #0B2545 0%, #13315C 45%, #1A4A8A 100%)",
          }}
        >
          {/* lightweight accent gradient — no large blur */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-50"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--primary) / 0.45), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full opacity-40"
            style={{
              background:
                "radial-gradient(closest-side, rgba(168, 85, 247, 0.45), transparent 70%)",
            }}
          />

          <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-10">
            {/* Avatar monogram */}
            <div className="flex justify-center md:justify-start">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-3xl font-bold backdrop-blur-sm md:h-24 md:w-24 md:text-4xl"
                aria-hidden
              >
                {monogram}
              </div>
            </div>

            <div>
              <Quote className="h-7 w-7 text-white/40 md:h-8 md:w-8" />
              <blockquote className="mt-3 text-balance text-xl font-medium leading-snug md:text-2xl lg:text-[1.7rem] lg:leading-[1.3]">
                {quote}
              </blockquote>
              <figcaption className="mt-5 text-sm text-white/75 md:text-base">
                <span className="font-semibold text-white">{author}</span>
                <span className="mx-2 opacity-50">|</span>
                {role}
              </figcaption>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
