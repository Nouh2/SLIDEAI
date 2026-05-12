import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
export type CheckoutAttribution = {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
    term?: string | null;
    emailId?: string | null;
    emailType?: string | null;
};
export declare class StripeService implements OnModuleInit {
    private configService;
    private stripe;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    /**
     * Creates a checkout session for a customer to subscribe to a plan.
     */
    createCheckoutSession(userId: string, userEmail: string, priceId: string, plan: string, origin?: string, stripeCustomerId?: string | null, promotionCode?: string, introOffer?: boolean, attribution?: CheckoutAttribution): Promise<{
        url: string | null;
    }>;
    /**
     * Validates a Stripe webhook signature.
     */
    constructEvent(payload: string | Buffer, signature: string): Stripe.Event;
    /**
     * Creates a checkout session for a one-time credit pack purchase.
     */
    createCreditPackCheckout(userId: string, userEmail: string, priceId: string, packType: string, origin?: string, attribution?: CheckoutAttribution): Promise<{
        url: string | null;
    }>;
    getCheckoutSession(sessionId: string): Promise<Stripe.Response<Stripe.Checkout.Session>>;
    /**
     * Cancels a subscription at the end of the current period.
     */
    cancelSubscription(subscriptionId: string): Promise<Stripe.Response<Stripe.Subscription>>;
    getRevenueSnapshot(subscriptionIds: string[]): Promise<{
        mrrCents: number;
        currency: string;
        subscriptionCount: number;
    }>;
    isReady(): boolean;
    private buildAttributionMetadata;
    findActiveSubscriptionByEmail(email: string): Promise<{
        customerId: string;
        subscriptionId: string;
        plan: 'starter' | 'pro' | 'business' | null;
        status: string;
        currentPeriodEnd: Date | null;
    } | null>;
    private getSubscriptionRank;
    private resolvePlanFromSubscription;
    private resolvePromotionCodeId;
    private getOrCreateIntroOfferCoupon;
}
