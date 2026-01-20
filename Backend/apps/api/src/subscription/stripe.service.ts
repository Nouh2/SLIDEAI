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
    async createCheckoutSession(userId: string, userEmail: string, priceId: string, plan: string) {
        if (!this.stripe) throw new Error('Stripe is not initialized');

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            customer_email: userEmail,
            client_reference_id: userId,
            success_url: `${this.configService.get('FRONTEND_URL')}/app?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.configService.get('FRONTEND_URL')}/pricing`,
            metadata: {
                userId,
                plan,
            },
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
    async createCreditPackCheckout(userId: string, userEmail: string, priceId: string, packType: string) {
        if (!this.stripe) throw new Error('Stripe is not initialized');

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
            success_url: `${this.configService.get('FRONTEND_URL')}/app?pack_success=true`,
            cancel_url: `${this.configService.get('FRONTEND_URL')}/pricing`,
            metadata: {
                userId,
                packType,
            },
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
}
