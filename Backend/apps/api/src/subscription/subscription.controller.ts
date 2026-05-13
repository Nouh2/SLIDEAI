// apps/api/src/subscription/subscription.controller.ts
import { Controller, Get, Post, UseGuards, Req, Body, Headers, ForbiddenException, Param } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { StripeService } from './stripe.service.js';
import type { CheckoutAttribution } from './stripe.service.js';
import { LifecycleEmailService } from './lifecycle-email.service.js';
import { SupabaseGuard } from '../auth/supabase.guard.js';

@Controller('/v1/subscription')
export class SubscriptionController {
    constructor(
        private readonly subscriptionService: SubscriptionService,
        private readonly stripeService: StripeService,
        private readonly lifecycleEmailService: LifecycleEmailService,
    ) { }

    /**
     * GET /subscription
     * Retourne l'abonnement de l'utilisateur connecté.
     */
    @Get()
    @UseGuards(SupabaseGuard)
    async getMySubscription(@Req() req: any) {
        const userId = req.user.sub;
        const subscription = await this.subscriptionService.getOrCreateSubscription(userId, req.user.email);
        return subscription;
    }

    @Get('checkout-session/:sessionId')
    @UseGuards(SupabaseGuard)
    async getCheckoutSession(@Req() req: any, @Param('sessionId') sessionId: string) {
        const session = await this.stripeService.getCheckoutSession(sessionId);

        if (session.client_reference_id !== req.user.sub) {
            throw new ForbiddenException('Session Stripe inaccessible pour cet utilisateur.');
        }

        const lineItem = session.line_items?.data?.[0];
        const price = lineItem?.price;
        const product = price?.product && typeof price.product !== 'string' && !price.product.deleted
            ? price.product
            : null;

        return {
            id: session.id,
            mode: session.mode,
            status: session.status,
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total,
            currency: session.currency,
            clientReferenceId: session.client_reference_id,
            plan: session.metadata?.plan || null,
            packType: session.metadata?.packType || null,
            introOffer: session.metadata?.introOffer || null,
            attribution: {
                source: session.metadata?.utm_source || null,
                medium: session.metadata?.utm_medium || null,
                campaign: session.metadata?.utm_campaign || null,
                content: session.metadata?.utm_content || null,
                term: session.metadata?.utm_term || null,
                emailId: session.metadata?.email_id || null,
                emailType: session.metadata?.email_type || null,
            },
            priceId: price?.id || null,
            productName: product?.name || null,
        };
    }

    @Post('email-click')
    async recordEmailClick(
        @Body() body: {
            emailTrackingId?: string;
            emailType?: string;
            landingPath?: string;
            attribution?: Record<string, string | undefined>;
        },
    ) {
        const payload = body || {};
        return this.lifecycleEmailService.recordEmailClick({
            emailTrackingId: payload.emailTrackingId || '',
            emailType: payload.emailType,
            landingPath: payload.landingPath,
            attribution: payload.attribution,
        });
    }

    /**
     * POST /subscription/checkout
     * Crée une session de paiement Stripe.
     */
    @Post('checkout')
    @UseGuards(SupabaseGuard)
    async createCheckout(
        @Req() req: any,
        @Body() body: { priceId: string; plan: string; promotionCode?: string; introOffer?: boolean; attribution?: CheckoutAttribution },
        @Headers('origin') origin: string,
    ) {
        const userId = req.user.sub;
        const userEmail = req.user.email;

        if (!body.priceId) throw new ForbiddenException('priceId is required');
        if (!body.plan) throw new ForbiddenException('plan is required');

        const stripeCustomerId = await this.subscriptionService.getStripeCustomerIdForCheckout(userId, userEmail);
        const checkout = await this.stripeService.createCheckoutSession(
            userId,
            userEmail,
            body.priceId,
            body.plan,
            origin,
            stripeCustomerId,
            body.promotionCode,
            body.introOffer,
            body.attribution,
        );

        this.lifecycleEmailService.scheduleCheckoutAbandonEmail({
            userId,
            email: userEmail,
            checkoutStartedAt: new Date(),
            checkoutType: 'subscription',
            plan: body.plan,
        }).catch((error) => console.warn('[Subscription] Failed to schedule checkout abandon email:', error?.message || error));

        return checkout;
    }

    @Post('start-trial')
    @UseGuards(SupabaseGuard)
    async startTrial(@Req() req: any) {
        const userId = req.user.sub;
        const userEmail = req.user.email;
        return this.subscriptionService.startTrial(userId, userEmail);
    }

    /**
     * POST /subscription/checkout-pack
     * Crée une session de paiement Stripe pour un pack de crédits (paiement unique).
     */
    @Post('checkout-pack')
    @UseGuards(SupabaseGuard)
    async createPackCheckout(@Req() req: any, @Body() body: { priceId: string; packType: string; attribution?: CheckoutAttribution }, @Headers('origin') origin: string) {
        const userId = req.user.sub;
        const userEmail = req.user.email;

        if (!body.priceId) throw new ForbiddenException('priceId is required');
        if (!body.packType) throw new ForbiddenException('packType is required');

        const checkout = await this.stripeService.createCreditPackCheckout(userId, userEmail, body.priceId, body.packType, origin, body.attribution);

        this.lifecycleEmailService.scheduleCheckoutAbandonEmail({
            userId,
            email: userEmail,
            checkoutStartedAt: new Date(),
            checkoutType: 'pack',
            packType: body.packType,
        }).catch((error) => console.warn('[Subscription] Failed to schedule pack checkout abandon email:', error?.message || error));

        return checkout;
    }

    /**
     * POST /subscription/webhook
     * Reçoit les événements de Stripe (paiements réussis, annulations).
     * Note: Ce endpoint doit être public (pas de SupabaseGuard).
     */
    @Post('webhook')
    async handleWebhook(
        @Req() req: any,
        @Headers('stripe-signature') signature: string,
    ) {
        console.log('[Stripe Webhook] Received request');
        console.log('[Stripe Webhook] Headers:', req.headers);
        console.log('[Stripe Webhook] Signature present:', !!signature);
        console.log('[Stripe Webhook] RawBody present:', !!req.rawBody);

        if (!signature) {
            console.error('[Stripe Webhook] Error: Missing stripe-signature');
            throw new ForbiddenException('Missing stripe-signature');
        }

        if (!req.rawBody) {
            console.error('[Stripe Webhook] Error: Missing rawBody');
            throw new ForbiddenException('Missing rawBody');
        }

        try {
            const event = this.stripeService.constructEvent(req.rawBody, signature);
            console.log('[Stripe Webhook] Event verified:', event.type);
            await this.subscriptionService.handleStripeEvent(event);
            return { received: true };
        } catch (err: any) {
            console.error('[Stripe Webhook] Error processing webhook:', err.message);
            console.error(err.stack);
            throw new ForbiddenException(`Webhook Error: ${err.message}`);
        }
    }
    /**
     * POST /subscription/cancel
     * Résilie l'abonnement en cours (à la fin de la période).
     */
    @Post('hear-about-us')
    @UseGuards(SupabaseGuard)
    async saveHearAboutUs(@Req() req: any, @Body() body: { source: string }) {
        const userId = req.user.sub;
        return this.subscriptionService.saveHearAboutUs(userId, body.source);
    }

    @Post('cancel')
    @UseGuards(SupabaseGuard)
    async cancelSubscription(@Req() req: any) {
        const userId = req.user.sub;
        const userEmail = req.user.email;

        // 1. Get Subscription ID
        const stripeSubscriptionId = await this.subscriptionService.getSubscriptionIdForCancellation(userId);

        // 2. Call Stripe
        await this.stripeService.cancelSubscription(stripeSubscriptionId);
        await this.subscriptionService.scheduleCancellationEmails(userId, userEmail);

        return { success: true, message: "Abonnement résilié à la fin de la période." };
    }
}
