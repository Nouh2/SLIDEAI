// apps/api/src/presentation/presentation.module.ts
import { Module } from '@nestjs/common';
import { PresentationController } from './presentation.controller.js';
import { PublicViewController } from './public-view.controller.js';
import { PresentationService } from './presentation.service.js';
import { PrismaService } from '../prisma.service.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { QueueModule } from '../queues/queue.module.js';
import { SupabaseMirrorModule } from '../supabase-mirror/supabase-mirror.module.js';

@Module({
    imports: [SubscriptionModule, QueueModule, SupabaseMirrorModule],
    controllers: [PresentationController, PublicViewController],
    providers: [PresentationService, PrismaService],
    exports: [PresentationService],
})
export class PresentationModule { }

