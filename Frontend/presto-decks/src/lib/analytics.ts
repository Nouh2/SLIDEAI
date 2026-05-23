import ReactGA from "react-ga4";
import { supabase } from "@/contexts/AuthContext";

type CheckoutStartedParams = {
    checkoutType: "subscription" | "pack";
    plan?: string | null;
    packType?: string | null;
    billingCycle?: "monthly" | "yearly" | null;
    value?: number | null;
    currency?: string | null;
    attribution?: AcquisitionAttribution | null;
};

type PurchaseParams = {
    transactionId: string;
    value?: number | null;
    currency?: string | null;
    plan?: string | null;
    packType?: string | null;
    checkoutType?: "subscription" | "pack" | null;
    paymentStatus?: string | null;
    coupon?: string | null;
    items?: Array<Record<string, any>>;
    attribution?: AcquisitionAttribution | null;
};

type PaywallParams = {
    surface: string;
    reason?: string | null;
    feature?: string | null;
    plan?: string | null;
};

type ActivationParams = {
    step: string;
    surface?: string;
    useCase?: string | null;
    templateId?: string | null;
    presentationId?: string | null;
    traceId?: string | null;
    slideCount?: number | null;
    hasFile?: boolean | null;
    format?: string | null;
    extra?: Record<string, any> | null;
};

export type AcquisitionAttribution = {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
    term?: string | null;
    emailId?: string | null;
    emailType?: string | null;
};

const normalizeCurrency = (currency?: string | null) => (currency || "EUR").toUpperCase();
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/v1";

const PRODUCT_EVENT_NAMES = new Set([
    "trial_started",
    "activation_use_case_selected",
    "activation_onboarding_started",
    "trial_activation_banner_view",
    "trial_activation_cta_click",
    "trial_conversion_cta_click",
    "create_opened",
    "create_started",
    "deck_generated",
    "deck_opened",
    "export_clicked",
    "deck_exported",
    "share_clicked",
    "deck_shared",
    "activation_completed",
    "paywall_view",
    "paywall_cta_click",
    "paywall_dismiss",
    "blog_cta_click",
    "demo_requested",
    "begin_checkout",
    "purchase",
]);

export const getAcquisitionAttribution = (params: URLSearchParams): AcquisitionAttribution | null => {
    const attribution: AcquisitionAttribution = {
        source: params.get("utm_source"),
        medium: params.get("utm_medium"),
        campaign: params.get("utm_campaign"),
        content: params.get("utm_content"),
        term: params.get("utm_term"),
        emailId: params.get("email_id"),
        emailType: params.get("email_type"),
    };

    return Object.values(attribution).some(Boolean) ? attribution : null;
};

const attributionEventParams = (attribution?: AcquisitionAttribution | null) => {
    if (!attribution) return {};

    return {
        utm_source: attribution.source || undefined,
        utm_medium: attribution.medium || undefined,
        utm_campaign: attribution.campaign || undefined,
        utm_content: attribution.content || undefined,
        utm_term: attribution.term || undefined,
        email_id: attribution.emailId || undefined,
        email_type: attribution.emailType || undefined,
    };
};

const recordProductEvent = async (eventName: string, params: Record<string, any>) => {
    if (!PRODUCT_EVENT_NAMES.has(eventName)) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        await fetch(`${API_BASE_URL}/product-events`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                eventName,
                occurredAt: new Date().toISOString(),
                properties: {
                    ...params,
                    path: window.location.pathname,
                    search: window.location.search,
                    referrer: document.referrer || undefined,
                },
            }),
            keepalive: true,
        });
    } catch (error) {
        console.warn("[Analytics] Product event was not stored", error);
    }
};

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
    },

    trackGaEvent: (name: string, params: Record<string, any> = {}) => {
        try {
            ReactGA.event(name, params);
            void recordProductEvent(name, params);
            console.debug(`[Analytics] Tracked GA4 event: ${name}`, params);
        } catch (error) {
            console.error("[Analytics] Error tracking GA4 event", error);
        }
    },

    trackProductEvent: (name: string, params: Record<string, any> = {}) => {
        void recordProductEvent(name, params);
    },

    trackEmailClick: ({ attribution, landingPath }: { attribution: AcquisitionAttribution; landingPath: string }) => {
        Analytics.trackGaEvent("lifecycle_email_click", {
            ...attributionEventParams(attribution),
            landing_path: landingPath,
        });
    },

    trackActivationStep: ({
        step,
        surface,
        useCase,
        templateId,
        presentationId,
        traceId,
        slideCount,
        hasFile,
        format,
        extra,
    }: ActivationParams) => {
        Analytics.trackGaEvent(step, {
            surface: surface || undefined,
            use_case: useCase || undefined,
            template_id: templateId || undefined,
            presentation_id: presentationId || undefined,
            trace_id: traceId || undefined,
            slide_count: slideCount ?? undefined,
            has_file: typeof hasFile === "boolean" ? hasFile : undefined,
            format: format || undefined,
            ...(extra || {}),
        });
    },

    trackCheckoutStarted: ({
        checkoutType,
        plan,
        packType,
        billingCycle,
        value,
        currency = "EUR",
        attribution,
    }: CheckoutStartedParams) => {
        const itemId = plan || packType || checkoutType;
        Analytics.trackGaEvent("begin_checkout", {
            currency: normalizeCurrency(currency),
            value: value ?? undefined,
            checkout_type: checkoutType,
            plan: plan || undefined,
            pack_type: packType || undefined,
            billing_cycle: billingCycle || undefined,
            ...attributionEventParams(attribution),
            items: [
                {
                    item_id: itemId,
                    item_name: itemId,
                    item_category: checkoutType,
                    price: value ?? undefined,
                    quantity: 1,
                },
            ],
        });
    },

    trackTrialStarted: ({ plan }: { plan: string }) => {
        Analytics.trackGaEvent("trial_started", {
            plan,
        });
    },

    trackPaywallViewed: ({ surface, reason, feature, plan }: PaywallParams) => {
        Analytics.trackGaEvent("paywall_view", {
            surface,
            reason: reason || undefined,
            feature: feature || undefined,
            plan: plan || undefined,
        });
    },

    trackPaywallCtaClicked: ({ surface, reason, feature, plan }: PaywallParams) => {
        Analytics.trackGaEvent("paywall_cta_click", {
            surface,
            reason: reason || undefined,
            feature: feature || undefined,
            plan: plan || undefined,
        });
    },

    trackPaywallDismissed: ({ surface, reason, feature, plan }: PaywallParams) => {
        Analytics.trackGaEvent("paywall_dismiss", {
            surface,
            reason: reason || undefined,
            feature: feature || undefined,
            plan: plan || undefined,
        });
    },

    trackPurchase: ({
        transactionId,
        value,
        currency = "EUR",
        plan,
        packType,
        checkoutType,
        paymentStatus,
        coupon,
        items,
        attribution,
    }: PurchaseParams) => {
        const fallbackItemId = plan || packType || checkoutType || "checkout";
        Analytics.trackGaEvent("purchase", {
            transaction_id: transactionId,
            value: value ?? undefined,
            currency: normalizeCurrency(currency),
            affiliation: "SlideAI",
            coupon: coupon || undefined,
            plan: plan || undefined,
            pack_type: packType || undefined,
            checkout_type: checkoutType || undefined,
            payment_status: paymentStatus || undefined,
            ...attributionEventParams(attribution),
            items: items?.length
                ? items
                : [
                    {
                        item_id: fallbackItemId,
                        item_name: fallbackItemId,
                        item_category: checkoutType || "checkout",
                        price: value ?? undefined,
                        quantity: 1,
                    },
                ],
        });
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
