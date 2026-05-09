import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

export function StickyTrialCta() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");
  const ctaPath = "/pricing";

  const handleCta = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Landing Sticky Mobile CTA"
    );
    navigate(ctaPath);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/70 bg-background/95 backdrop-blur px-3 py-2">
      <Button onClick={handleCta} className="w-full h-12 text-base font-bold" size="sm">
        {isFr ? "Pro à 9,90€ le 1er mois" : "Pro at 9.90€ first month"}
      </Button>
    </div>
  );
}
