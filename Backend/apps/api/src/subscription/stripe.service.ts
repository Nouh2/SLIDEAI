import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

const STRIPE_PRICE_PLAN_BY_ID: Record<string, 'starter' | 'pro' | 'business'> = {
    price_1Sn5Iw5KgGKgF82ebXEDerSL: 'starter',
    price_1Sn5Jx5KgGKgF82e7TVoKqcJ: 'starter',
    price_1Sn5IN5KgGKgF82elQlvSUIf: 'pro',
    price_1Sn5Jd5KgGKgF82erWwaHW8G: 'pro',
    price_1Sn5JB5KgGKgF82egl8duDWF: 'business',
    price_1Sn5KK5KgGKgF82eSgoyWSnS: 'business',
};

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
        introOffer?: boolean,
    ) {
        if (!this.stripe) throw new Error('Stripe is not initialized');

        // Use the request origin if permitted (handled by CORS in main.ts), otherwise fallback to env
        const frontendUrl = origin || this.configService.get('FRONTEND_URL');
        const appliedPromotionCodeId = promotionCode
            ? await this.resolvePromotionCodeId(promotionCode)
            : null;
        const introCouponId = !appliedPromotionCodeId && introOffer && plan === 'pro'
            ? await this.getOrCreateIntroOfferCoupon(priceId)
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
                ...(introCouponId ? { introOffer: 'first_month_990' } : {}),
            },
            allow_promotion_codes: !appliedPromotionCodeId && !introCouponId,
            ...(appliedPromotionCodeId ? { discounts: [{ promotion_code: appliedPromotionCodeId }] } : {}),
            ...(introCouponId ? { discounts: [{ coupon: introCouponId }] } : {}),
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

    isReady() {
        return Boolean(this.stripe);
    }

    async findActiveSubscriptionByEmail(email: string): Promise<{
        customerId: string;
        subscriptionId: string;
        plan: 'starter' | 'pro' | 'business' | null;
        status: string;
        currentPeriodEnd: Date | null;
    } | null> {
        if (!this.stripe || !email) {
            return null;
        }

        const customers = await this.stripe.customers.list({
            email,
            limit: 10,
        });

        const candidates: Array<{
            customerId: string;
            subscriptionId: string;
            plan: 'starter' | 'pro' | 'business' | null;
            status: string;
            currentPeriodEnd: Date | null;
            rank: number;
        }> = [];

        for (const customer of customers.data) {
            if (!customer.id) {
                continue;
            }

            const subscriptions = await this.stripe.subscriptions.list({
                customer: customer.id,
                status: 'all',
                limit: 10,
            });

            for (const subscription of subscriptions.data) {
                const rank = this.getSubscriptionRank(subscription.status);
                if (rank === 0) {
                    continue;
                }

                const currentPeriodEndUnix = (subscription as any).current_period_end as number | null | undefined;

                candidates.push({
                    customerId: customer.id,
                    subscriptionId: subscription.id,
                    plan: this.resolvePlanFromSubscription(subscription),
                    status: subscription.status,
                    currentPeriodEnd: currentPeriodEndUnix
                        ? new Date(currentPeriodEndUnix * 1000)
                        : null,
                    rank,
                });
            }
        }

        candidates.sort((a, b) => b.rank - a.rank);
        const best = candidates[0];

        if (!best) {
            return null;
        }

        return {
            customerId: best.customerId,
            subscriptionId: best.subscriptionId,
            plan: best.plan,
            status: best.status,
            currentPeriodEnd: best.currentPeriodEnd,
        };
    }

    private getSubscriptionRank(status: string) {
        switch (status) {
            case 'active':
                return 3;
            case 'trialing':
                return 2;
            case 'past_due':
                return 1;
            default:
                return 0;
        }
    }

    private resolvePlanFromSubscription(subscription: Stripe.Subscription): 'starter' | 'pro' | 'business' | null {
        const metadataPlan = subscription.metadata?.plan;
        if (metadataPlan === 'starter' || metadataPlan === 'pro' || metadataPlan === 'business') {
            return metadataPlan;
        }

        for (const item of subscription.items.data) {
            const itemPlan = item.price?.metadata?.plan;
            if (itemPlan === 'starter' || itemPlan === 'pro' || itemPlan === 'business') {
                return itemPlan;
            }

            const pricePlan = STRIPE_PRICE_PLAN_BY_ID[item.price?.id || ''];
            if (pricePlan) {
                return pricePlan;
            }
        }

        return null;
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

    private async getOrCreateIntroOfferCoupon(priceId: string): Promise<string | null> {
        const configuredCouponId = this.configService.get<string>('STRIPE_INTRO_990_COUPON_ID');
        if (configuredCouponId) {
            return configuredCouponId;
        }

        const price = await this.stripe.prices.retrieve(priceId);
        const unitAmount = price.unit_amount || 0;
        const currency = price.currency || 'eur';
        const targetAmount = Number(this.configService.get<string>('INTRO_990_TARGET_AMOUNT_CENTS') || 990);
        const months = Number(this.configService.get<string>('INTRO_990_MONTHS') || 1);
        const amountOff = unitAmount - targetAmount;

        if (!price.recurring || price.recurring.interval !== 'month' || amountOff <= 0) {
            return null;
        }

        const couponId = months <= 1
            ? `slideai_intro_${targetAmount}_once_${unitAmount}_${currency}`
            : `slideai_intro_${targetAmount}_${months}m_${unitAmount}_${currency}`;

        try {
            const existing = await this.stripe.coupons.retrieve(couponId);
            return existing.id;
        } catch (error: any) {
            if (error?.code !== 'resource_missing') {
                throw error;
            }
        }

        try {
            const coupon = await this.stripe.coupons.create({
                id: couponId,
                name: `SlideAI ${targetAmount / 100}€ pendant ${months} mois`,
                amount_off: amountOff,
                currency,
                duration: months <= 1 ? 'once' : 'repeating',
                ...(months > 1 ? { duration_in_months: months } : {}),
                metadata: {
                    offerType: months <= 1 ? 'intro_990_first_month' : `intro_${targetAmount}_${months}_months`,
                    targetAmountCents: String(targetAmount),
                    regularAmountCents: String(unitAmount),
                    months: String(months),
                    priceId,
                },
            } as any);

            return coupon.id;
        } catch (error: any) {
            if (error?.code === 'resource_already_exists') {
                const existing = await this.stripe.coupons.retrieve(couponId);
                return existing.id;
            }

            throw error;
        }
    }
}
