// apps/api/src/subscription/subscription.module.ts
import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller.js';
import { SubscriptionService } from './subscription.service.js';
import { StripeService } from './stripe.service.js';
import { PrismaService } from '../prisma.service.js';
import { LifecycleEmailService } from './lifecycle-email.service.js';

@Module({
    controllers: [SubscriptionController],
    providers: [SubscriptionService, StripeService, PrismaService, LifecycleEmailService],
    exports: [SubscriptionService, StripeService],
})
export class SubscriptionModule { }
