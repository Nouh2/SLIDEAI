// GoogleAnalytics.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

export const GoogleAnalytics = () => {
    const location = useLocation();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

        if (!measurementId) {
            console.warn("[Analytics] Measurement ID not found in environment variables (VITE_GA_MEASUREMENT_ID). Analytics disabled.");
            return;
        }

        const checkConsentAndInit = () => {
            const consent = localStorage.getItem("cookie-consent");
            let allowed = false;

            if (consent === "all") {
                allowed = true;
            } else if (consent) {
                try {
                    const parsed = JSON.parse(consent);
                    if (parsed.analytics) allowed = true;
                } catch (e) {
                    console.error("Error parsing cookie consent", e);
                }
            }

            if (allowed && !initialized) {
                ReactGA.initialize(measurementId);
                setInitialized(true);
                console.log("[Analytics] Initialized with ID:", measurementId);
            }
        };

        checkConsentAndInit();

        const handleConsentUpdate = () => checkConsentAndInit();
        window.addEventListener("cookie-consent-updated", handleConsentUpdate);

        return () => window.removeEventListener("cookie-consent-updated", handleConsentUpdate);
    }, [initialized]);

    useEffect(() => {
        if (initialized) {
            ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
        }
    }, [initialized, location]);

    return null;
};
