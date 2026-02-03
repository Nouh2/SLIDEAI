import ReactGA from "react-ga4";

export const Analytics = {
    /**
     * Track a custom event
     * @param category Event Category (e.g. 'Auth', 'Presentation', 'Ecommerce')
     * @param action Event Action (e.g. 'Sign Up', 'Generate Start', 'Select Plan')
     * @param label Optional Event Label (e.g. 'Pro Plan', 'Free')
     * @param value Optional Event Value (e.g. Revenue)
     */
    trackEvent: (category: string, action: string, label?: string, value?: number) => {
        try {
            ReactGA.event({
                category,
                action,
                label,
                value
            });
            console.debug(`[Analytics] Tracked: ${category} - ${action} ${label ? `(${label})` : ''}`);
        } catch (error) {
            console.error("[Analytics] Error tracking event", error);
        }
    },

    /**
     * Track a page view (handled automatically by GoogleAnalytics component mostly)
     * @param path Page path
     */
    trackPageView: (path: string) => {
        try {
            ReactGA.send({ hitType: "pageview", page: path });
        } catch (error) {
            console.error("[Analytics] Error tracking pageview", error);
        }
    }
};

// Event Constants for consistency
export const ANALYTICS_EVENTS = {
    AUTH: {
        CATEGORY: "Auth",
        SIGN_UP: "Sign Up",
        LOGIN: "Login",
        LOGOUT: "Logout"
    },
    PRESENTATION: {
        CATEGORY: "Presentation",
        GENERATE_START: "Generate Start",
        GENERATE_COMPLETE: "Generate Complete",
        EXPORT: "Export"
    },
    ECOMMERCE: {
        CATEGORY: "Ecommerce",
        VIEW_PRICING: "View Pricing",
        SELECT_PLAN: "Select Plan",
        PURCHASE_COMPLETE: "Purchase Complete"
    }
};
