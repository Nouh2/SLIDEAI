import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";

const MEASUREMENT_ID = "G-8MWF5ER84Y";

export const GoogleAnalytics = () => {
    const location = useLocation();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
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
                ReactGA.initialize(MEASUREMENT_ID);
                setInitialized(true);
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
