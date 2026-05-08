import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

/**
 * Unified pricing section.
 * Replaces OfferSection + SubscriptionSection + Bottom CTA.
 *
 * Structure:
 *   1. Hero offer card — Pro at 9,90€ first month (the launch carrot)
 *   2. 2 plan tiers (Pro highlighted / Team)
 *   3. Single text link to full /pricing page
 *
 * Pricing must stay in sync with /pricing page. Current plans: Pro and Team only.
 * No Starter, no yearly toggle on the landing — the /pricing page handles full options.
 */

type Tier = {
  id: "pro" | "team";
  name: { fr: string; en: string };
  tagline: { fr: string; en: string };
  price: { display: string; period: { fr: string; en: string } };
  priceNote?: { fr: string; en: string };
  features: { fr: string[]; en: string[] };
  cta: { fr: string; en: string };
  highlight?: boolean;
  contactSales?: boolean;
};

const TIERS: Tier[] = [
  {
    id: "pro",
    name: { fr: "Pro", en: "Pro" },
    tagline: {
      fr: "Pour les équipes qui veulent leur identité de marque et un livrable premium.",
      en: "For teams who want their brand identity and a premium deliverable.",
    },
    price: { display: "9,90€", period: { fr: "/mois", en: "/mo" } },
    priceNote: {
      fr: "Premier mois à 9,90€, puis 19,90€/mois",
      en: "First month at 9.90€, then 19.90€/mo",
    },
    features: {
      fr: [
        "Génération illimitée",
        "PDF vers PowerPoint (Pro)",
        "Brand kits illimités",
        "Export prioritaire PDF/PPTX",
        "Support prioritaire",
        "Export PowerPoint éditable",
      ],
      en: [
        "Unlimited generations",
        "PDF to PowerPoint (Pro)",
        "Unlimited brand kits",
        "Priority PDF/PPTX export",
        "Priority support",
        "Editable PowerPoint export",
      ],
    },
    cta: { fr: "Commencer à 9,90€", en: "Start at 9.90€" },
    highlight: true,
  },
  {
    id: "team",
    name: { fr: "Team", en: "Team" },
    tagline: {
      fr: "Pour cabinets, agences et équipes qui partagent un workspace.",
      en: "For firms, agencies and teams sharing a workspace.",
    },
    price: { display: "29€", period: { fr: "/mois", en: "/mo" } },
    priceNote: {
      fr: "Facturé mensuellement, minimum 3 sièges",
      en: "Billed monthly, 3 seats minimum",
    },
    features: {
      fr: [
        "Toutes les fonctionnalités Pro",
        "Workspace d'équipe partagé",
        "Gestion des membres",
        "Facturation centralisée",
      ],
      en: [
        "Everything in Pro",
        "Shared team workspace",
        "Member management",
        "Centralized billing",
      ],
    },
    cta: { fr: "Contacter les ventes", en: "Contact sales" },
    contactSales: true,
  },
];

export function PricingSection() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");
  const lang = isFr ? "fr" : "en";

  const launchOfferFeatures = isFr
    ? [
        "Génération illimitée de présentations",
        "Import PDF, Word et brief textuel",
        "Export PPTX éditable + PDF",
        "Brand kit + partage par lien",
        "Annulation possible à tout moment",
      ]
    : [
        "Unlimited presentation generation",
        "Import PDF, Word and plain brief",
        "Editable PPTX + PDF export",
        "Brand kit + public share link",
        "Cancel anytime",
      ];

  const handleLaunchOffer = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Landing Pricing - Launch Offer Pro 9.90"
    );
    navigate("/pricing?plan=pro&intro=1");
  };

  const handleTierSelect = (tier: Tier) => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      `Landing Pricing - ${tier.id}`
    );
    if (tier.contactSales) {
      navigate("/contact");
      return;
    }
    navigate(`/pricing?plan=${tier.id}`);
  };

  return (
    <section className="relative z-10 px-4 pt-6 pb-12 md:pt-10 md:pb-16">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <header className="mb-8 md:mb-10 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
            {isFr ? "Tarification" : "Pricing"}
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-balance">
            {isFr
              ? "Choisissez le plan qui suit votre rythme."
              : "Pick the plan that matches your rhythm."}
          </h2>
        </header>

        {/* === Launch offer hero card === */}
        <div
          className="relative mb-10 md:mb-14 overflow-hidden rounded-3xl text-white shadow-[0_30px_80px_-40px_rgba(15,42,69,0.55)]"
          style={{
            background:
              "linear-gradient(135deg, #0B2545 0%, #143263 45%, #1A4A8A 100%)",
          }}
        >
          {/* decorative gradients — no expensive blur */}
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
                "radial-gradient(closest-side, rgba(168, 85, 247, 0.35), transparent 70%)",
            }}
          />

          <div className="relative grid gap-8 p-7 md:grid-cols-[1.2fr_0.8fr] md:gap-10 md:p-10">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                <Sparkles className="h-3 w-3" />
                {isFr ? "Offre de lancement limitée" : "Limited launch offer"}
              </span>
              <h3 className="mt-3 text-2xl md:text-3xl font-bold leading-tight">
                {isFr
                  ? "Pro à 9,90€ le 1er mois."
                  : "Pro at 9.90€ the first month."}
              </h3>
              <p className="mt-2 text-white/75 text-base md:text-lg">
                {isFr
                  ? "Testez SlideAI sur de vrais livrables clients. Annulez quand vous voulez."
                  : "Test SlideAI on real client decks. Cancel anytime."}
              </p>

              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {launchOfferFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm md:text-[15px] text-white/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-stretch justify-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm md:p-6">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl md:text-6xl font-extrabold tracking-tight">
                  9,90
                </span>
                <span className="text-lg font-semibold text-white/85">€</span>
              </div>
              <div className="text-center text-sm text-white/65">
                {isFr ? "le 1er mois, puis 19,90€/mois" : "first month, then 9.90€/mo"}
              </div>
              <Button
                onClick={handleLaunchOffer}
                size="lg"
                className="h-12 rounded-xl bg-white text-primary hover:bg-white/95 font-bold text-base"
              >
                {isFr ? "Profiter de l'offre" : "Get the offer"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="text-center text-xs text-white/55">
                {isFr ? "Paiement sécurisé par Stripe" : "Secure payment by Stripe"}
              </div>
            </div>
          </div>
        </div>

        {/* === Tier cards === */}
        <div className="grid gap-5 md:grid-cols-2 md:gap-6 max-w-4xl mx-auto">
          {TIERS.map((tier) => {
            const isHighlight = tier.highlight;
            return (
              <article
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border bg-white/85 p-6 md:p-7 transition-all duration-300 ${
                  isHighlight
                    ? "border-primary/60 shadow-[0_24px_60px_-30px_hsl(var(--primary)/0.55)]"
                    : "border-border/60 shadow-[0_18px_48px_-30px_rgba(15,42,69,0.30)] hover:-translate-y-0.5"
                }`}
              >
                {isHighlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                    {isFr ? "Le plus populaire" : "Most popular"}
                  </span>
                )}
                {tier.contactSales && (
                  <span className="inline-flex w-fit items-center rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70 mb-2">
                    {isFr ? "Accompagnement" : "Concierge"}
                  </span>
                )}
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-2xl font-bold">{tier.name[lang]}</h3>
                  <p className="mt-2 text-sm text-foreground/65 max-w-xs">{tier.tagline[lang]}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary">
                      {tier.price.display}
                    </span>
                    <span className="text-base font-medium text-foreground/60">
                      {tier.price.period[lang]}
                    </span>
                  </div>
                  {tier.priceNote && (
                    <p className="mt-1 text-xs text-foreground/55">{tier.priceNote[lang]}</p>
                  )}
                </div>

                <Button
                  onClick={() => handleTierSelect(tier)}
                  variant={isHighlight ? "default" : "outline"}
                  size="lg"
                  className={`mt-5 h-12 rounded-xl font-bold ${
                    isHighlight
                      ? "bg-gradient-primary hover:shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.6)]"
                      : ""
                  }`}
                >
                  {tier.cta[lang]}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <ul className="mt-5 space-y-2 text-sm border-t border-border/40 pt-5">
                  {tier.features[lang].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        {/* Footer link */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="text-sm font-medium text-foreground/60 underline-offset-4 hover:text-primary hover:underline"
          >
            {isFr ? "Voir le comparatif complet et les packs" : "See full comparison and packs"}
          </button>
        </div>
      </div>
    </section>
  );
}
