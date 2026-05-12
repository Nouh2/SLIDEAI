var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
// apps/api/src/subscription/subscription.controller.ts
import { Controller, Get, Post, UseGuards, Req, Body, Headers, ForbiddenException, Param } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { StripeService } from './stripe.service.js';
import { LifecycleEmailService } from './lifecycle-email.service.js';
import { SupabaseGuard } from '../auth/supabase.guard.js';
let SubscriptionController = class SubscriptionController {
    subscriptionService;
    stripeService;
    lifecycleEmailService;
    constructor(subscriptionService, stripeService, lifecycleEmailService) {
        this.subscriptionService = subscriptionService;
        this.stripeService = stripeService;
        this.lifecycleEmailService = lifecycleEmailService;
    }
    /**
     * GET /subscription
     * Retourne l'abonnement de l'utilisateur connecté.
     */
    async getMySubscription(req) {
        const userId = req.user.sub;
        const subscription = await this.subscriptionService.getOrCreateSubscription(userId, req.user.email);
        return subscription;
    }
    async getCheckoutSession(req, sessionId) {
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
    async recordEmailClick(body) {
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
    async createCheckout(req, body, origin) {
        const userId = req.user.sub;
        const userEmail = req.user.email;
        if (!body.priceId)
            throw new ForbiddenException('priceId is required');
        if (!body.plan)
            throw new ForbiddenException('plan is required');
        const stripeCustomerId = await this.subscriptionService.getStripeCustomerIdForCheckout(userId, userEmail);
        return this.stripeService.createCheckoutSession(userId, userEmail, body.priceId, body.plan, origin, stripeCustomerId, body.promotionCode, body.introOffer, body.attribution);
    }
    async startTrial(req) {
        const userId = req.user.sub;
        const userEmail = req.user.email;
        return this.subscriptionService.startTrial(userId, userEmail);
    }
    /**
     * POST /subscription/checkout-pack
     * Crée une session de paiement Stripe pour un pack de crédits (paiement unique).
     */
    async createPackCheckout(req, body, origin) {
        const userId = req.user.sub;
        const userEmail = req.user.email;
        if (!body.priceId)
            throw new ForbiddenException('priceId is required');
        if (!body.packType)
            throw new ForbiddenException('packType is required');
        return this.stripeService.createCreditPackCheckout(userId, userEmail, body.priceId, body.packType, origin, body.attribution);
    }
    /**
     * POST /subscription/webhook
     * Reçoit les événements de Stripe (paiements réussis, annulations).
     * Note: Ce endpoint doit être public (pas de SupabaseGuard).
     */
    async handleWebhook(req, signature) {
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
        }
        catch (err) {
            console.error('[Stripe Webhook] Error processing webhook:', err.message);
            console.error(err.stack);
            throw new ForbiddenException(`Webhook Error: ${err.message}`);
        }
    }
    /**
     * POST /subscription/cancel
     * Résilie l'abonnement en cours (à la fin de la période).
     */
    async saveHearAboutUs(req, body) {
        const userId = req.user.sub;
        return this.subscriptionService.saveHearAboutUs(userId, body.source);
    }
    async cancelSubscription(req) {
        const userId = req.user.sub;
        const userEmail = req.user.email;
        // 1. Get Subscription ID
        const stripeSubscriptionId = await this.subscriptionService.getSubscriptionIdForCancellation(userId);
        // 2. Call Stripe
        await this.stripeService.cancelSubscription(stripeSubscriptionId);
        await this.subscriptionService.scheduleCancellationEmails(userId, userEmail);
        return { success: true, message: "Abonnement résilié à la fin de la période." };
    }
};
__decorate([
    Get(),
    UseGuards(SupabaseGuard),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getMySubscription", null);
__decorate([
    Get('checkout-session/:sessionId'),
    UseGuards(SupabaseGuard),
    __param(0, Req()),
    __param(1, Param('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "getCheckoutSession", null);
__decorate([
    Post('email-click'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "recordEmailClick", null);
__decorate([
    Post('checkout'),
    UseGuards(SupabaseGuard),
    __param(0, Req()),
    __param(1, Body()),
    __param(2, Headers('origin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "createCheckout", null);
__decorate([
    Post('start-trial'),
    UseGuards(SupabaseGuard),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "startTrial", null);
__decorate([
    Post('checkout-pack'),
    UseGuards(SupabaseGuard),
    __param(0, Req()),
    __param(1, Body()),
    __param(2, Headers('origin')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "createPackCheckout", null);
__decorate([
    Post('webhook'),
    __param(0, Req()),
    __param(1, Headers('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "handleWebhook", null);
__decorate([
    Post('hear-about-us'),
    UseGuards(SupabaseGuard),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "saveHearAboutUs", null);
__decorate([
    Post('cancel'),
    UseGuards(SupabaseGuard),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubscriptionController.prototype, "cancelSubscription", null);
SubscriptionController = __decorate([
    Controller('/v1/subscription'),
    __metadata("design:paramtypes", [SubscriptionService,
        StripeService,
        LifecycleEmailService])
], SubscriptionController);
export { SubscriptionController };
