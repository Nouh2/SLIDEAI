import { SubscriptionService } from './subscription.service.js';
import { StripeService } from './stripe.service.js';
import type { CheckoutAttribution } from './stripe.service.js';
import { LifecycleEmailService } from './lifecycle-email.service.js';
export declare class SubscriptionController {
    private readonly subscriptionService;
    private readonly stripeService;
    private readonly lifecycleEmailService;
    constructor(subscriptionService: SubscriptionService, stripeService: StripeService, lifecycleEmailService: LifecycleEmailService);
    /**
     * GET /subscription
     * Retourne l'abonnement de l'utilisateur connecté.
     */
    getMySubscription(req: any): Promise<{
        accessState: "trialing" | "trial_expired" | "legacy_free" | "pack_active" | "active_paid";
        effectivePlan: string;
        features: string[];
        creditsTotal: number;
        limits: {
            creditsPerMonth: number;
            features: string[];
            limits: {
                pdfPages: number;
                maxProjects: number;
                aiAddPerPresentation: number;
                aiWandPerPresentation: number;
            };
        };
        trialDaysLeft: number;
        canStartTrial: boolean;
        requiresPayment: boolean;
        legacyFree: boolean;
        isLegacyAccess: boolean;
        packActive: boolean;
        packCreditsRemaining: number;
        hearAboutAnswered: boolean;
        packFeaturesMode: string | null;
        id: string;
        status: string;
        userId: string;
        plan: string;
        creditsRemaining: number;
        creditsResetAt: Date | null;
        trialStartedAt: Date | null;
        trialEndsAt: Date | null;
        trialConsumedAt: Date | null;
        stripeCustomerId: string | null;
        stripeSubscriptionId: string | null;
        currentPeriodEnd: Date | null;
        hearAboutUs: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCheckoutSession(req: any, sessionId: string): Promise<{
        id: string;
        mode: import("stripe").Stripe.Checkout.Session.Mode;
        status: import("stripe").Stripe.Checkout.Session.Status | null;
        paymentStatus: import("stripe").Stripe.Checkout.Session.PaymentStatus;
        amountTotal: number | null;
        currency: string | null;
        clientReferenceId: string | null;
        plan: string | null;
        packType: string | null;
        introOffer: string | null;
        attribution: {
            source: string | null;
            medium: string | null;
            campaign: string | null;
            content: string | null;
            term: string | null;
            emailId: string | null;
            emailType: string | null;
        };
        priceId: string | null;
        productName: string | null;
    }>;
    recordEmailClick(body: {
        emailTrackingId?: string;
        emailType?: string;
        landingPath?: string;
        attribution?: Record<string, string | undefined>;
    }): Promise<{
        tracked: boolean;
    }>;
    /**
     * POST /subscription/checkout
     * Crée une session de paiement Stripe.
     */
    createCheckout(req: any, body: {
        priceId: string;
        plan: string;
        promotionCode?: string;
        introOffer?: boolean;
        attribution?: CheckoutAttribution;
    }, origin: string): Promise<{
        url: string | null;
    }>;
    startTrial(req: any): Promise<{
        accessState: "trialing" | "trial_expired" | "legacy_free" | "pack_active" | "active_paid";
        effectivePlan: string;
        features: string[];
        creditsTotal: number;
        limits: {
            creditsPerMonth: number;
            features: string[];
            limits: {
                pdfPages: number;
                maxProjects: number;
                aiAddPerPresentation: number;
                aiWandPerPresentation: number;
            };
        };
        trialDaysLeft: number;
        canStartTrial: boolean;
        requiresPayment: boolean;
        legacyFree: boolean;
        isLegacyAccess: boolean;
        packActive: boolean;
        packCreditsRemaining: number;
        hearAboutAnswered: boolean;
        packFeaturesMode: string | null;
        id: string;
        status: string;
        userId: string;
        plan: string;
        creditsRemaining: number;
        creditsResetAt: Date | null;
        trialStartedAt: Date | null;
        trialEndsAt: Date | null;
        trialConsumedAt: Date | null;
        stripeCustomerId: string | null;
        stripeSubscriptionId: string | null;
        currentPeriodEnd: Date | null;
        hearAboutUs: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * POST /subscription/checkout-pack
     * Crée une session de paiement Stripe pour un pack de crédits (paiement unique).
     */
    createPackCheckout(req: any, body: {
        priceId: string;
        packType: string;
        attribution?: CheckoutAttribution;
    }, origin: string): Promise<{
        url: string | null;
    }>;
    /**
     * POST /subscription/webhook
     * Reçoit les événements de Stripe (paiements réussis, annulations).
     * Note: Ce endpoint doit être public (pas de SupabaseGuard).
     */
    handleWebhook(req: any, signature: string): Promise<{
        received: boolean;
    }>;
    /**
     * POST /subscription/cancel
     * Résilie l'abonnement en cours (à la fin de la période).
     */
    saveHearAboutUs(req: any, body: {
        source: string;
    }): Promise<{
        ok: boolean;
    }>;
    cancelSubscription(req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
