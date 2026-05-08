import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, FileBarChart, TrendingUp, Grid3x3, Gauge, LayoutList, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

/**
 * Bento grid of 6 deck use cases. Each card auto-uses an exported PNG
 * if present at /landing-bento/{filename}.png. Otherwise an SVG placeholder
 * matching the eventual layout is rendered, so the design works end-to-end
 * even before all PNGs are dropped in.
 *
 * Drop exported decks (16:9, 1920x1080 PNG, no editor chrome) into:
 *   public/landing-bento/
 *
 * Naming follows the `imageBase` field of each card below.
 */

type DeckUseCase = {
  id: string;
  imageBase: string;
  /** File extension of the exported deck. Default "png" — use "jpg" for photo-heavy slides */
  imageExt?: "png" | "jpg" | "jpeg" | "webp";
  // i18n keys
  label: { fr: string; en: string };
  title: { fr: string; en: string };
  desc: { fr: string; en: string };
  Icon: typeof FileBarChart;
  // Placeholder variant when no image is present
  placeholder: PlaceholderVariant;
  // Optional accent color for placeholder
  accent?: string;
};

type PlaceholderVariant =
  | "cover-photo-right"
  | "bar-chart"
  | "cover-bold"
  | "kpi-cards"
  | "matrix-2x2"
  | "timeline";

const USE_CASES: DeckUseCase[] = [
  {
    id: "audit",
    imageBase: "audit-marketing",
    label: { fr: "Audit", en: "Audit" },
    title: { fr: "Audit marketing client", en: "Client marketing audit" },
    desc: {
      fr: "Performance par canal, benchmark sectoriel, recommandations prioritaires.",
      en: "Channel performance, sector benchmark, priority recommendations.",
    },
    Icon: FileBarChart,
    placeholder: "bar-chart",
    accent: "#2563EB",
  },
  {
    id: "plan-action",
    imageBase: "plan-action",
    label: { fr: "Plan d'action", en: "Action plan" },
    title: { fr: "Plan d'action priorisé", en: "Prioritized action plan" },
    desc: {
      fr: "Phases séquencées, dépendances et jalons clés.",
      en: "Sequenced phases, dependencies, and key milestones.",
    },
    Icon: TrendingUp,
    placeholder: "timeline",
    accent: "#F97316",
  },
  {
    id: "reco",
    imageBase: "recommandations",
    label: { fr: "Stratégie", en: "Strategy" },
    title: { fr: "Recommandations stratégiques", en: "Strategic recommendations" },
    desc: {
      fr: "Matrice impact / effort sur 8 initiatives prioritaires.",
      en: "Impact / effort matrix across 8 priority initiatives.",
    },
    Icon: Grid3x3,
    placeholder: "matrix-2x2",
    accent: "#A855F7",
  },
  {
    id: "reporting",
    imageBase: "reporting-mensuel",
    label: { fr: "Reporting", en: "Reporting" },
    title: { fr: "Reporting mensuel", en: "Monthly reporting" },
    desc: {
      fr: "Dashboard KPI : CA, pipeline, win rate, vélocité.",
      en: "KPI dashboard: revenue, pipeline, win rate, velocity.",
    },
    Icon: Gauge,
    placeholder: "kpi-cards",
    accent: "#F59E0B",
  },
  {
    id: "comex",
    imageBase: "comite-direction",
    label: { fr: "Comex", en: "Exec" },
    title: { fr: "Comité de direction", en: "Executive review" },
    desc: {
      fr: "Synthèse exécutive Q3 : faits, analyse, décisions.",
      en: "Q3 executive synthesis: facts, analysis, decisions.",
    },
    Icon: LayoutList,
    placeholder: "cover-photo-right",
    accent: "#0B2545",
  },
  {
    id: "synthese",
    imageBase: "synthese-strategique",
    imageExt: "jpg",
    label: { fr: "Synthèse", en: "Synthesis" },
    title: { fr: "Synthèse stratégique", en: "Strategic synthesis" },
    desc: {
      fr: "Plan 2026 : roadmap 4 trimestres, jalons, dépendances.",
      en: "2026 plan: 4-quarter roadmap, milestones, dependencies.",
    },
    Icon: Map,
    placeholder: "timeline",
    accent: "#1FB6FF",
  },
];

/**
 * Inline SVG placeholders. Will be replaced 1:1 once a matching PNG is dropped
 * in /public/landing-bento/. Each variant matches the layout pattern of the
 * eventual deck so the design preview is faithful.
 */
function Placeholder({ variant, accent = "#1FB6FF", title, label }: {
  variant: PlaceholderVariant;
  accent?: string;
  title: string;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className="block w-full h-full"
      aria-label={title}
    >
      <defs>
        <linearGradient id={`grad-${variant}-${accent.replace("#", "")}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F4F7FB" />
        </linearGradient>
        <linearGradient id={`accent-${accent.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#grad-${variant}-${accent.replace("#", "")})`} />

      {variant === "cover-photo-right" && (
        <>
          {/* photo half */}
          <rect width="160" height="180" fill={accent} opacity="0.12" />
          <g transform="translate(20 40)" fill={accent} opacity="0.4">
            <rect x="0" y="60" width="20" height="80" />
            <rect x="26" y="30" width="28" height="110" />
            <rect x="60" y="50" width="22" height="90" />
            <rect x="86" y="20" width="34" height="120" />
          </g>
          {/* text half */}
          <text x="180" y="74" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="18" fill="#0B2545">
            {label.length > 14 ? label.slice(0, 12) + "…" : label}
          </text>
          <text x="180" y="92" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="18" fill="#0B2545">
            B2B 2025
          </text>
          <rect x="180" y="106" width="100" height="2" fill={accent} opacity="0.4" />
          <text x="180" y="124" fontFamily="Inter, sans-serif" fontSize="8" fill="#475569">
            Synthèse exécutive
          </text>
        </>
      )}

      {variant === "bar-chart" && (
        <>
          <text x="20" y="32" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="11" fill="#0B2545">
            Performance par canal
          </text>
          <rect x="20" y="42" width="60" height="2" fill={accent} />
          {/* axis */}
          <line x1="20" y1="150" x2="300" y2="150" stroke="#CBD5E1" strokeWidth="1" />
          {/* bars */}
          {[
            { x: 40, h: 70, label: "SEO" },
            { x: 90, h: 90, label: "SEA" },
            { x: 140, h: 50, label: "Social" },
            { x: 190, h: 65, label: "Email" },
            { x: 240, h: 80, label: "Display" },
          ].map((b) => (
            <g key={b.label}>
              <rect x={b.x} y={150 - b.h} width="28" height={b.h} fill={`url(#accent-${accent.replace("#", "")})`} rx="2" />
              <text x={b.x + 14} y="164" fontSize="7" fontFamily="Inter, sans-serif" fill="#64748B" textAnchor="middle">
                {b.label}
              </text>
            </g>
          ))}
        </>
      )}

      {variant === "cover-bold" && (
        <>
          <rect width="320" height="180" fill={accent} />
          <rect x="0" y="0" width="320" height="180" fill="#000000" opacity="0.1" />
          <circle cx="260" cy="40" r="50" fill="#FFFFFF" opacity="0.12" />
          <text x="20" y="80" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="22" fill="#FFFFFF">
            Series A
          </text>
          <text x="20" y="106" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="12" fill="#FFFFFF" opacity="0.85">
            Investor pitch deck
          </text>
          <rect x="20" y="122" width="60" height="3" fill="#FFFFFF" opacity="0.6" />
          <text x="20" y="156" fontFamily="Inter, sans-serif" fontSize="9" fill="#FFFFFF" opacity="0.7">
            12 slides · 2026
          </text>
        </>
      )}

      {variant === "kpi-cards" && (
        <>
          <text x="20" y="32" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="11" fill="#0B2545">
            Reporting mensuel - sales
          </text>
          {[
            { x: 20, n: "1.2M", l: "CA" },
            { x: 96, n: "+18%", l: "vs M-1" },
            { x: 172, n: "42%", l: "Win rate" },
            { x: 248, n: "21j", l: "Velocity" },
          ].map((k) => (
            <g key={k.l}>
              <rect x={k.x} y="50" width="64" height="58" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
              <text x={k.x + 8} y="76" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="16" fill={accent}>
                {k.n}
              </text>
              <text x={k.x + 8} y="96" fontFamily="Inter, sans-serif" fontSize="8" fill="#64748B">
                {k.l}
              </text>
            </g>
          ))}
          {/* mini sparkline */}
          <polyline
            points="20,140 60,128 100,134 140,118 180,124 220,108 260,114 300,98"
            stroke={accent}
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {variant === "matrix-2x2" && (
        <>
          <text x="20" y="28" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="11" fill="#0B2545">
            Matrice impact / effort
          </text>
          <g transform="translate(70 42)">
            <rect width="180" height="120" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
            <line x1="90" y1="0" x2="90" y2="120" stroke="#CBD5E1" />
            <line x1="0" y1="60" x2="180" y2="60" stroke="#CBD5E1" />
            <text x="20" y="14" fontSize="6" fill="#64748B" fontFamily="Inter, sans-serif">FORT IMPACT</text>
            <text x="100" y="116" fontSize="6" fill="#64748B" fontFamily="Inter, sans-serif">FAIBLE EFFORT</text>
            {/* points */}
            <circle cx="120" cy="22" r="6" fill={accent} />
            <circle cx="140" cy="32" r="5" fill={accent} opacity="0.8" />
            <circle cx="100" cy="44" r="4" fill={accent} opacity="0.7" />
            <circle cx="50" cy="34" r="5" fill={accent} opacity="0.5" />
            <circle cx="62" cy="86" r="4" fill="#94A3B8" />
            <circle cx="34" cy="98" r="3" fill="#94A3B8" />
            <circle cx="148" cy="92" r="4" fill="#94A3B8" opacity="0.7" />
            <circle cx="160" cy="78" r="3" fill={accent} opacity="0.6" />
          </g>
        </>
      )}

      {variant === "timeline" && (
        <>
          <text x="20" y="32" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="11" fill="#0B2545">
            Roadmap 2026
          </text>
          {/* timeline rail */}
          <line x1="36" y1="100" x2="296" y2="100" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="3 3" />
          {[
            { x: 50, q: "Q1", h: "Foundations" },
            { x: 130, q: "Q2", h: "Beta" },
            { x: 210, q: "Q3", h: "Launch" },
            { x: 280, q: "Q4", h: "Scale" },
          ].map((m, i) => (
            <g key={m.q}>
              <circle cx={m.x} cy="100" r="8" fill={accent} opacity={0.85 - i * 0.08} />
              <circle cx={m.x} cy="100" r="3" fill="#FFFFFF" />
              <text x={m.x} y="76" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="9" fill={accent} textAnchor="middle">
                {m.q}
              </text>
              <text x={m.x} y="124" fontFamily="Inter, sans-serif" fontSize="7" fill="#475569" textAnchor="middle">
                {m.h}
              </text>
            </g>
          ))}
        </>
      )}

      {/* tiny placeholder badge in corner */}
      <g transform="translate(282 12)" opacity="0.5">
        <rect width="28" height="14" rx="3" fill="#0B2545" opacity="0.08" />
        <text x="14" y="10" fontSize="7" fontFamily="monospace" fill="#0B2545" textAnchor="middle" opacity="0.7">
          DEMO
        </text>
      </g>
    </svg>
  );
}

function DeckCard({ useCase, isFr }: { useCase: DeckUseCase; isFr: boolean }) {
  const { imageBase, imageExt = "png", label, title, desc, Icon, placeholder, accent } = useCase;
  const lang = isFr ? "fr" : "en";
  const imgSrc = `/landing-bento/${imageBase}.${imageExt}`;
  const [imgFailed, setImgFailed] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white/70 shadow-[0_18px_48px_-30px_rgba(15,42,69,0.30)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-30px_rgba(15,42,69,0.45)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-50 to-sky-50">
        {/* Placeholder is the base layer — visible until image loads, or forever if image missing */}
        <div
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-300 ${
            imgLoaded && !imgFailed ? "opacity-0" : "opacity-100"
          }`}
        >
          <Placeholder
            variant={placeholder}
            accent={accent}
            title={title[lang]}
            label={label[lang]}
          />
        </div>

        {/* Real PNG renders on top once loaded */}
        {!imgFailed && (
          <img
            src={imgSrc}
            alt={title[lang]}
            loading="lazy"
            decoding="async"
            width={1920}
            height={1080}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            } group-hover:scale-[1.015]`}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5 px-5 py-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/55">
          <Icon className="h-3.5 w-3.5" />
          {label[lang]}
        </span>
        <h3 className="text-base md:text-lg font-bold leading-snug text-foreground">
          {title[lang]}
        </h3>
        <p className="text-sm text-foreground/60 leading-snug">
          {desc[lang]}
        </p>
      </div>
    </article>
  );
}

export function BentoOutputs() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");

  const handleCta = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Landing Bento Outputs CTA"
    );
    navigate("/pricing");
  };

  return (
    <section className="relative z-10 px-4 pt-6 pb-10 md:pt-10 md:pb-16">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 md:mb-12 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground/70">
            {isFr ? "Cas d'usage" : "Use cases"}
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold tracking-tight text-balance">
            {isFr
              ? "Tous les decks que vous livrez déjà, en quelques minutes."
              : "Every deck you already deliver, in minutes."}
          </h2>
          <p className="mt-3 text-base md:text-lg text-foreground/60">
            {isFr
              ? "Audit, plan d'action, recommandations, reporting, comité, synthèse : un seul outil, votre charte."
              : "Audit, action plan, recommendations, reporting, exec review, synthesis: one tool, your brand."}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {USE_CASES.map((uc) => (
            <DeckCard key={uc.id} useCase={uc} isFr={isFr} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button onClick={handleCta} size="lg" className="h-14 rounded-xl px-7 text-base font-bold bg-gradient-primary hover:shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.6)]">
            {isFr ? "Générer mon premier deck" : "Generate my first deck"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
