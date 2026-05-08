/**
 * Lightweight isometric SVG illustrations — Gamma-style 3D-ish vibe,
 * vector-only, ~3kb each, infinitely scalable, no decoding cost.
 *
 * Three variants used across the landing:
 *   - "import"   : papers/PDF being imported into a slot
 *   - "generate" : a stack of slides with a magic spark
 *   - "deliver"  : a slide gliding off into a paper plane / send
 */

type IllustrationName = "import" | "generate" | "deliver";

export function IsoIllustration({
  name,
  className = "",
}: {
  name: IllustrationName;
  className?: string;
}) {
  switch (name) {
    case "import":
      return <ImportArt className={className} />;
    case "generate":
      return <GenerateArt className={className} />;
    case "deliver":
      return <DeliverArt className={className} />;
  }
}

const ISO_W = 200;
const ISO_H = 160;
const baseProps = {
  viewBox: `0 0 ${ISO_W} ${ISO_H}`,
  xmlns: "http://www.w3.org/2000/svg",
  className: "block w-full h-auto",
} as const;

/**
 * Soft drop shadow filter shared by all illustrations.
 * Scoped via id with random suffix in case of multiple instances.
 */
function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5FB" />
      </linearGradient>
      <linearGradient id={`${id}-paperShade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E2E9F3" />
        <stop offset="100%" stopColor="#CFDBEB" />
      </linearGradient>
      <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5BC0FF" />
        <stop offset="100%" stopColor="#1FB6FF" />
      </linearGradient>
      <linearGradient id={`${id}-blueDeep`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#0E4FB8" />
      </linearGradient>
      <linearGradient id={`${id}-purple`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#1FB6FF" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#1FB6FF" stopOpacity="0" />
      </radialGradient>
      <filter id={`${id}-soft`} x="-15%" y="-15%" width="130%" height="130%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>
  );
}

function ImportArt({ className = "" }: { className?: string }) {
  const id = "iso-import";
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`} aria-hidden>
      <Defs id={id} />
      {/* glow */}
      <ellipse cx="100" cy="138" rx="74" ry="10" fill="#0E4FB8" opacity="0.08" />
      {/* slot/tray (back) */}
      <g transform="translate(40 90)">
        <path
          d="M0 18 L60 -10 L120 18 L60 46 Z"
          fill={`url(#${id}-blueDeep)`}
        />
        <path
          d="M0 18 L60 46 L60 60 L0 32 Z"
          fill="#0B2E6E"
          opacity="0.85"
        />
        <path
          d="M120 18 L60 46 L60 60 L120 32 Z"
          fill="#0E4FB8"
        />
      </g>
      {/* PDF doc (back) */}
      <g transform="translate(64 18) rotate(-6)">
        <rect width="50" height="62" rx="3" fill={`url(#${id}-paper)`} stroke="#CBD5E1" strokeWidth="1" />
        <rect x="6" y="10" width="32" height="3" rx="1" fill="#94A3B8" />
        <rect x="6" y="18" width="38" height="2" rx="1" fill="#CBD5E1" />
        <rect x="6" y="24" width="34" height="2" rx="1" fill="#CBD5E1" />
        <rect x="6" y="30" width="38" height="2" rx="1" fill="#CBD5E1" />
        <rect x="6" y="42" width="20" height="12" rx="2" fill="#FFB4B4" />
        <rect x="30" y="42" width="14" height="12" rx="2" fill="#FED7AA" />
      </g>
      {/* PDF doc (front) — falling into the slot */}
      <g transform="translate(86 50) rotate(8)">
        <rect width="56" height="68" rx="3" fill={`url(#${id}-paper)`} stroke="#CBD5E1" strokeWidth="1" />
        <rect x="6" y="8" width="6" height="6" rx="1.5" fill="#EF4444" />
        <rect x="16" y="9" width="32" height="3" rx="1" fill="#475569" />
        <rect x="6" y="20" width="44" height="2" rx="1" fill="#CBD5E1" />
        <rect x="6" y="26" width="40" height="2" rx="1" fill="#CBD5E1" />
        <rect x="6" y="32" width="44" height="2" rx="1" fill="#CBD5E1" />
        <rect x="6" y="44" width="44" height="18" rx="2" fill="#DBEAFE" />
        <polyline
          points="10,58 18,52 26,55 34,48 42,50 50,46"
          stroke="#1FB6FF"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      {/* incoming arrow */}
      <g transform="translate(150 30)">
        <path d="M0 20 L18 20" stroke={`url(#${id}-blue)`} strokeWidth="3" strokeLinecap="round" />
        <path d="M14 14 L20 20 L14 26" stroke={`url(#${id}-blue)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}

function GenerateArt({ className = "" }: { className?: string }) {
  const id = "iso-generate";
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`} aria-hidden>
      <Defs id={id} />
      <ellipse cx="100" cy="138" rx="80" ry="10" fill="#0E4FB8" opacity="0.08" />
      {/* glow halo */}
      <circle cx="100" cy="76" r="62" fill={`url(#${id}-glow)`} />

      {/* stack of 3 slides — isometric */}
      {[0, 1, 2].map((i) => {
        const dy = -i * 14;
        const opacity = 0.95 - i * 0.05;
        return (
          <g key={i} transform={`translate(40 ${100 + dy})`} opacity={opacity}>
            {/* top face */}
            <path d="M0 14 L60 -16 L120 14 L60 44 Z" fill={`url(#${id}-paper)`} stroke="#CBD5E1" strokeWidth="1" />
            {/* shaded right */}
            <path d="M120 14 L60 44 L60 50 L120 20 Z" fill={`url(#${id}-paperShade)`} />
            {/* shaded left */}
            <path d="M0 14 L60 44 L60 50 L0 20 Z" fill="#E5ECF6" />
            {/* slide content */}
            <g transform="translate(20 -2)">
              <rect width="36" height="3.6" rx="1" fill="#1FB6FF" transform="skewX(-25) skewY(8)" />
              <rect y="8" width="60" height="2.4" rx="1" fill="#94A3B8" transform="skewX(-25) skewY(8)" />
              <rect y="14" width="48" height="2.4" rx="1" fill="#CBD5E1" transform="skewX(-25) skewY(8)" />
              <rect y="20" width="40" height="10" rx="1.4" fill="#DBEAFE" transform="skewX(-25) skewY(8)" />
            </g>
          </g>
        );
      })}

      {/* sparkles */}
      <g fill="#1FB6FF">
        <path d="M158 38 l4 -10 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 z" />
      </g>
      <g fill="#A78BFA">
        <path d="M30 50 l2.6 -6 l2.6 6 l6 2.6 l-6 2.6 l-2.6 6 l-2.6 -6 l-6 -2.6 z" />
      </g>
      <circle cx="170" cy="86" r="3" fill="#1FB6FF" />
      <circle cx="22" cy="98" r="2.5" fill="#A78BFA" />
    </svg>
  );
}

function DeliverArt({ className = "" }: { className?: string }) {
  const id = "iso-deliver";
  return (
    <svg {...baseProps} className={`${baseProps.className} ${className}`} aria-hidden>
      <Defs id={id} />
      <ellipse cx="100" cy="138" rx="74" ry="10" fill="#0E4FB8" opacity="0.08" />

      {/* slide ramp / trajectory */}
      <path
        d="M20 110 Q 100 70, 175 36"
        stroke="#1FB6FF"
        strokeOpacity="0.35"
        strokeWidth="2.4"
        strokeDasharray="3 5"
        strokeLinecap="round"
        fill="none"
      />

      {/* sliding deck */}
      <g transform="translate(34 80) rotate(-6)">
        <rect width="86" height="56" rx="4" fill={`url(#${id}-paper)`} stroke="#CBD5E1" strokeWidth="1" />
        <rect x="6" y="6" width="24" height="3" rx="1" fill="#1FB6FF" />
        <rect x="6" y="14" width="56" height="2.4" rx="1" fill="#94A3B8" />
        <rect x="6" y="20" width="50" height="2.4" rx="1" fill="#CBD5E1" />
        <rect x="6" y="30" width="74" height="20" rx="2" fill="#DBEAFE" />
        <polyline
          points="10 46, 22 38, 34 42, 46 32, 58 36, 70 26, 78 30"
          stroke="#1FB6FF"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* paper plane */}
      <g transform="translate(140 22)">
        <path d="M0 22 L40 0 L28 26 L18 18 Z" fill={`url(#${id}-blue)`} />
        <path d="M28 26 L18 18 L24 32 Z" fill="#0E4FB8" />
        <path d="M40 0 L18 18" stroke="#FFFFFF" strokeOpacity="0.6" strokeWidth="1" />
      </g>

      {/* checkmark badge */}
      <g transform="translate(150 96)">
        <circle r="14" fill="#22C55E" />
        <path d="M-6 0 L-2 4 L7 -5" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  );
}
