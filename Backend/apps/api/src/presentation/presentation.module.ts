// apps/api/src/presentation/presentation.module.ts
import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller.js';
import { PresentationService } from './presentation.service.js';
import { PrismaService } from '../prisma.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { QueueService } from '../queues/queue.service.js';

@Module({
    controllers: [PresentationController],
    providers: [PresentationService, PrismaService, SubscriptionService, QueueService],
    exports: [PresentationService],
})
export class PresentationModule { }

