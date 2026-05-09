import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

/**
 * Rolling weekly deadline: every Sunday at midnight (local time).
 * Once it passes, the next Sunday automatically becomes the new deadline.
 * Always feels real, never expires for the visitor.
 */
function getWeeklyDeadline(now: Date = new Date()): Date {
  const d = new Date(now);
  // 0 = Sunday in JS Date
  const day = d.getDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatRemaining(ms: number, isFr: boolean) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (days >= 1) {
    return isFr
      ? `${days}j ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`
      : `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function PromoBar() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isFr = i18n.language.startsWith("fr");
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    const dl = getWeeklyDeadline();
    return dl.getTime() - Date.now();
  });

  // Tick the countdown every second
  useEffect(() => {
    const id = window.setInterval(() => {
      const dl = getWeeklyDeadline();
      setRemainingMs(dl.getTime() - Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleCta = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Sticky Promo Bar"
    );
    navigate("/pricing");
  };

  const remaining = formatRemaining(remainingMs, isFr);

  return (
    <div
      className="relative z-40 w-full text-white"
      style={{
        // Brand-only gradient: primary cyan -> deep navy (both colors already
        // used elsewhere on the site — testimonial band, isometric illustrations).
        background:
          "linear-gradient(90deg, hsl(var(--primary)) 0%, #0B2545 100%)",
      }}
      role="region"
      aria-label={isFr ? "Offre de lancement" : "Launch offer"}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 py-2 text-xs sm:text-sm">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="truncate font-semibold">
            {/* Shorter copy on mobile so the message doesn't get truncated next to the countdown + button */}
            <span className="sm:hidden">
              {isFr ? "Pro à 9,90€ le 1er mois" : "Pro at 9.90€ first month"}
            </span>
            <span className="hidden sm:inline">
              {isFr
                ? "Offre lancement Pro à 9,90€ le 1er mois"
                : "Pro launch offer at 9.90€ first month"}
            </span>
          </span>
          <span className="hidden sm:inline opacity-80">|</span>
          <span className="hidden font-mono tabular-nums opacity-95 sm:inline">
            {isFr ? "fin dans" : "ends in"} {remaining}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="font-mono tabular-nums opacity-90 text-[11px] sm:hidden">{remaining}</span>
          <button
            type="button"
            onClick={handleCta}
            className="group inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm transition hover:bg-white sm:px-3 sm:text-xs"
          >
            {isFr ? "Voir l'offre" : "See offer"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
