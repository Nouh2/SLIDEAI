import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
    private stripe!: Stripe;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!secretKey) {
            console.warn('STRIPE_SECRET_KEY is not defined. Stripe integration will not work.');
            return;
        }

        this.stripe = new Stripe(secretKey, {
            apiVersion: '2024-12-18.acacia' as any, // Using latest stable version
        });
    }

    /**
     * Creates a checkout session for a customer to subscribe to a plan.
     */
    async createCheckoutSession(
        userId: string,
        userEmail: string,
        priceId: string,
        plan: string,
        origin?: string,
        stripeCustomerId?: string | null,
        promotionCode?: string,
    ) {
        if (!this.stripe) throw new Error('Stripe is not initialized');

        // Use the request origin if permitted (handled by CORS in main.ts), otherwise fallback to env
        const frontendUrl = origin || this.configService.get('FRONTEND_URL');
        const appliedPromotionCodeId = promotionCode
            ? await this.resolvePromotionCodeId(promotionCode)
            : null;

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: userEmail }),
            client_reference_id: userId,
            success_url: `${frontendUrl}/app?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/pricing`,
            metadata: {
                plan,
            },
            allow_promotion_codes: !appliedPromotionCodeId,
            ...(appliedPromotionCodeId ? { discounts: [{ promotion_code: appliedPromotionCodeId }] } : {}),
        });

        return { url: session.url };
    }

    /**
     * Validates a Stripe webhook signature.
     */
    constructEvent(payload: string | Buffer, signature: string) {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not defined');

        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }

    /**
     * Creates a checkout session for a one-time credit pack purchase.
     */
    async createCreditPackCheckout(userId: string, userEmail: string, priceId: string, packType: string, origin?: string) {
        if (!this.stripe) throw new Error('Stripe is not initialized');

        // Use the request origin if permitted (handled by CORS in main.ts), otherwise fallback to env
        const frontendUrl = origin || this.configService.get('FRONTEND_URL');

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'payment', // One-time payment, not subscription
            customer_email: userEmail,
            client_reference_id: userId,
            success_url: `${frontendUrl}/app?pack_success=true`,
            cancel_url: `${frontendUrl}/pricing`,
            metadata: {
                packType,
            },
            allow_promotion_codes: true,
        });

        return { url: session.url };
    }

    /**
     * Cancels a subscription at the end of the current period.
     */
    async cancelSubscription(subscriptionId: string) {
        if (!this.stripe) throw new Error('Stripe is not initialized');

        return await this.stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
    }

    async getRevenueSnapshot(subscriptionIds: string[]) {
        const uniqueIds = Array.from(new Set(subscriptionIds.filter(Boolean)));

        if (!this.stripe || uniqueIds.length === 0) {
            return {
                mrrCents: 0,
                currency: 'eur',
                subscriptionCount: 0,
            };
        }

        const subscriptions = await Promise.all(
            uniqueIds.map((subscriptionId) => this.stripe.subscriptions.retrieve(subscriptionId)),
        );

        let mrrCents = 0;
        let currency = 'eur';
        let subscriptionCount = 0;

        for (const subscription of subscriptions) {
            if (!['active', 'trialing', 'past_due'].includes(subscription.status)) {
                continue;
            }

            subscriptionCount += 1;

            for (const item of subscription.items.data) {
                const unitAmount = item.price.unit_amount || 0;
                currency = item.price.currency || currency;
                const quantity = item.quantity || 1;
                const recurring = item.price.recurring;

                if (!recurring) {
                    mrrCents += unitAmount * quantity;
                    continue;
                }

                if (recurring.interval === 'month') {
                    mrrCents += Math.round((unitAmount * quantity) / Math.max(recurring.interval_count || 1, 1));
                    continue;
                }

                if (recurring.interval === 'year') {
                    mrrCents += Math.round((unitAmount * quantity) / 12 / Math.max(recurring.interval_count || 1, 1));
                    continue;
                }

                mrrCents += unitAmount * quantity;
            }
        }

        return {
            mrrCents,
            currency,
            subscriptionCount,
        };
    }

    private async resolvePromotionCodeId(code: string): Promise<string | null> {
        const normalizedCode = code.trim();
        if (!normalizedCode) {
            return null;
        }

        const promotionCodes = await this.stripe.promotionCodes.list({
            code: normalizedCode,
            active: true,
            limit: 1,
        });

        const promotionCode = promotionCodes.data[0];

        if (!promotionCode) {
            throw new Error('Code promo invalide ou expiré.');
        }

        return promotionCode.id;
    }
}
