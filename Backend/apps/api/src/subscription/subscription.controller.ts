// apps/api/src/subscription/subscription.controller.ts
import { Controller, Get, Post, UseGuards, Req, Body, RawBodyRequest, Headers, ForbiddenException } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { StripeService } from './stripe.service.js';
import { SupabaseGuard } from '../auth/supabase.guard.js';

@Controller('/v1/subscription')
export class SubscriptionController {
    constructor(
        private readonly subscriptionService: SubscriptionService,
        private readonly stripeService: StripeService,
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

    /**
     * POST /subscription/checkout
     * Crée une session de paiement Stripe.
     */
    @Post('checkout')
    @UseGuards(SupabaseGuard)
    async createCheckout(@Req() req: any, @Body() body: { priceId: string; plan: string; promotionCode?: string }, @Headers('origin') origin: string) {
        const userId = req.user.sub;
        const userEmail = req.user.email;

        if (!body.priceId) throw new ForbiddenException('priceId is required');
        if (!body.plan) throw new ForbiddenException('plan is required');

        const stripeCustomerId = await this.subscriptionService.getStripeCustomerIdForCheckout(userId, userEmail);
        return this.stripeService.createCheckoutSession(
            userId,
            userEmail,
            body.priceId,
            body.plan,
            origin,
            stripeCustomerId,
            body.promotionCode,
        );
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
    async createPackCheckout(@Req() req: any, @Body() body: { priceId: string; packType: string }, @Headers('origin') origin: string) {
        const userId = req.user.sub;
        const userEmail = req.user.email;

        if (!body.priceId) throw new ForbiddenException('priceId is required');
        if (!body.packType) throw new ForbiddenException('packType is required');

        return this.stripeService.createCreditPackCheckout(userId, userEmail, body.priceId, body.packType, origin);
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
