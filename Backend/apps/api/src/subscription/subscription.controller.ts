// apps/api/src/subscription/subscription.controller.ts
import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { SupabaseGuard } from '../auth/supabase.guard.js';

@Controller('subscription')
@UseGuards(SupabaseGuard)
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    /**
     * GET /subscription
     * Retourne l'abonnement de l'utilisateur connecté.
     */
    @Get()
    async getMySubscription(@Req() req: any) {
        const userId = req.user.sub;
        const subscription = await this.subscriptionService.getOrCreateSubscription(userId);
        return subscription;
    }
}
