import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

type DeckTemplate = {
  id: string;
  labelFr: string;
  labelEn: string;
  /** primary brand color of the deck cover (used as accent) */
  accent: string;
  /** background gradient stops for the cover */
  bg: [string, string];
  /** ink color for text on the cover */
  ink: string;
  /** small chart variant rendered in the body of the slide */
  chart: "bars" | "line" | "donut" | "stack" | "kpi" | "matrix";
};

const TEMPLATES: DeckTemplate[] = [
  {
    id: "consulting",
    labelFr: "Conseil stratégique",
    labelEn: "Strategy consulting",
    accent: "#1FB6FF",
    bg: ["#0B2545", "#1A4A8A"],
    ink: "#FFFFFF",
    chart: "matrix",
  },
  {
    id: "pitch",
    labelFr: "Pitch investisseur",
    labelEn: "Investor pitch",
    accent: "#22C55E",
    bg: ["#0F1F1A", "#16382E"],
    ink: "#FFFFFF",
    chart: "line",
  },
  {
    id: "comex",
    labelFr: "Comité de direction",
    labelEn: "Executive review",
    accent: "#F59E0B",
    bg: ["#FFF7ED", "#FED7AA"],
    ink: "#1A1A1A",
    chart: "kpi",
  },
  {
    id: "marketing",
    labelFr: "Revue marketing",
    labelEn: "Marketing review",
    accent: "#EC4899",
    bg: ["#FDF2F8", "#FBCFE8"],
    ink: "#1A1A1A",
    chart: "donut",
  },
  {
    id: "sales",
    labelFr: "Sales play",
    labelEn: "Sales play",
    accent: "#8B5CF6",
    bg: ["#1F1B3A", "#3B2E63"],
    ink: "#FFFFFF",
    chart: "bars",
  },
  {
    id: "synthese",
    labelFr: "Synthèse client",
    labelEn: "Client synthesis",
    accent: "#1FB6FF",
    bg: ["#F0F9FF", "#BAE6FD"],
    ink: "#0F2A45",
    chart: "stack",
  },
];

function DeckCoverSvg({ template, active }: { template: DeckTemplate; active: boolean }) {
  const { id, accent, bg, ink, chart } = template;
  const inkSoft = ink + "99";
  const bar = (x: number, h: number) => (
    <rect key={x} x={x} y={64 - h} width="6" height={h} rx="1.5" fill={accent} opacity={0.85} />
  );
  return (
    <svg
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      className="block w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={template.labelFr}
    >
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg[0]} />
          <stop offset="100%" stopColor={bg[1]} />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill={`url(#bg-${id})`} />
      {/* accent strip on the left edge */}
      <rect x="0" y="0" width="3" height="100" fill={accent} opacity={active ? 1 : 0.7} />
      {/* logo dot */}
      <circle cx="14" cy="12" r="3" fill={accent} />
      <rect x="20" y="10" width="14" height="3" rx="1" fill={ink} opacity={0.55} />

      {/* title */}
      <rect x="14" y="26" width="86" height="5" rx="1.4" fill={ink} />
      <rect x="14" y="34" width="58" height="3.5" rx="1.4" fill={ink} opacity={0.55} />

      {/* chart area */}
      {chart === "bars" && (
        <g transform="translate(14 50)">
          {bar(0, 18)}
          {bar(10, 26)}
          {bar(20, 14)}
          {bar(30, 32)}
          {bar(40, 22)}
          {bar(50, 28)}
        </g>
      )}
      {chart === "line" && (
        <g transform="translate(14 50)">
          <polyline
            points="0,30 12,22 24,26 36,14 48,18 60,8 72,12"
            fill="none"
            stroke={accent}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="60" cy="8" r="2.4" fill={accent} />
        </g>
      )}
      {chart === "donut" && (
        <g transform="translate(28 70)">
          <circle r="14" fill="none" stroke={ink} strokeOpacity={0.18} strokeWidth="6" />
          <circle
            r="14"
            fill="none"
            stroke={accent}
            strokeWidth="6"
            strokeDasharray="60 100"
            transform="rotate(-90)"
          />
        </g>
      )}
      {chart === "stack" && (
        <g transform="translate(14 50)">
          {[0, 12, 24, 36, 48].map((x, i) => (
            <g key={x}>
              <rect x={x} y={28 - i * 2} width="8" height={6 + i * 2} fill={accent} opacity={0.5} />
              <rect x={x} y={20 - i * 2} width="8" height={8} fill={accent} />
            </g>
          ))}
        </g>
      )}
      {chart === "kpi" && (
        <g transform="translate(14 48)">
          {[0, 38, 76].map((x, i) => (
            <g key={x} transform={`translate(${x} 0)`}>
              <rect width="32" height="28" rx="3" fill={ink} opacity={0.06} />
              <rect x="4" y="6" width="14" height="3" rx="1" fill={ink} opacity={0.45} />
              <rect x="4" y="13" width="20" height="6" rx="1.4" fill={accent} />
              <rect x="4" y="22" width="10" height="2" rx="1" fill={ink} opacity={0.35} />
            </g>
          ))}
        </g>
      )}
      {chart === "matrix" && (
        <g transform="translate(14 48)">
          <rect width="60" height="34" rx="2" fill="none" stroke={ink} strokeOpacity={0.25} />
          <line x1="30" y1="0" x2="30" y2="34" stroke={ink} strokeOpacity={0.2} />
          <line x1="0" y1="17" x2="60" y2="17" stroke={ink} strokeOpacity={0.2} />
          <circle cx="40" cy="10" r="3" fill={accent} />
          <circle cx="46" cy="6" r="2" fill={accent} opacity={0.7} />
          <circle cx="20" cy="22" r="2.5" fill={accent} opacity={0.5} />
        </g>
      )}

      {/* page number */}
      <rect x="142" y="90" width="6" height="2" rx="1" fill={inkSoft} />
    </svg>
  );
}

export function TemplatePicker() {
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const enableAuto = !reduceMotion;

  useEffect(() => {
    if (!enableAuto) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % TEMPLATES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [enableAuto]);

  const activeTpl = TEMPLATES[active];

  const titleLabel = useMemo(
    () => (isFr ? "Choisissez un modèle" : "Pick a template"),
    [isFr]
  );

  return (
    <div className="relative w-full">
      {/* Frame */}
      <div className="relative rounded-3xl border border-border/60 bg-white/70 backdrop-blur-sm shadow-[0_20px_60px_-30px_rgba(15,42,69,0.35)] overflow-hidden">
        {/* Browser-ish header */}
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-foreground/15" />
          <span className="h-2 w-2 rounded-full bg-foreground/10" />
          <span className="h-2 w-2 rounded-full bg-foreground/10" />
          <span className="ml-3 text-[11px] font-medium text-foreground/60 tracking-wide uppercase">
            {titleLabel}
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {isFr ? "Démo" : "Live"}
          </span>
        </div>

        {/* Big preview — SVG fills the entire area, no padding/inner frame */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <div key={activeTpl.id} className="absolute inset-0 tp-fade">
            <DeckCoverSvg template={activeTpl} active />
          </div>
          {/* fake cursor */}
          {!isMobile && !reduceMotion && (
            <div
              aria-hidden
              className="pointer-events-none absolute right-6 bottom-8 transition-transform duration-700"
              style={{
                transform: `translate(${(active % 3) * -22}px, ${active >= 3 ? -18 : 0}px)`,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M3 2L19 11L11 13L7 19L3 2Z"
                  fill="#0F2A45"
                  stroke="white"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Thumb strip */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3 border-t border-border/50 bg-white/60">
          {TEMPLATES.map((tpl, i) => {
            const isActive = i === active;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={`group flex flex-col items-stretch gap-1.5 rounded-lg p-1.5 transition-colors ${
                  isActive ? "bg-primary/10" : "hover:bg-foreground/5"
                }`}
                aria-pressed={isActive}
                aria-label={isFr ? tpl.labelFr : tpl.labelEn}
              >
                <span
                  className={`block aspect-[16/10] overflow-hidden rounded ring-1 transition ${
                    isActive ? "ring-primary/60 shadow-md" : "ring-black/5"
                  }`}
                >
                  <DeckCoverSvg template={tpl} active={isActive} />
                </span>
                <span
                  className={`text-[10.5px] md:text-[11px] leading-tight text-center font-medium truncate ${
                    isActive ? "text-primary" : "text-foreground/65"
                  }`}
                >
                  {isFr ? tpl.labelFr : tpl.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightweight floating accent — pure CSS, no blur > 30px */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -top-4 -bottom-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/15 via-transparent to-fuchsia-300/10 opacity-70"
        style={{ filter: "blur(28px)" }}
      />

      <style>{`
        @keyframes tp-fade-in {
          0% { opacity: 0; transform: translateY(6px) scale(0.985); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tp-fade { animation: tp-fade-in 380ms cubic-bezier(0.16, 1, 0.3, 1); }
        @media (prefers-reduced-motion: reduce) {
          .tp-fade { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
