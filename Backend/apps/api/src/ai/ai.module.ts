import { Module } from '@nestjs/common';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';
import { QueueModule } from '../queues/queue.module.js';
import { PrismaService } from '../prisma.service.js';

@Module({
    imports: [QueueModule],
    controllers: [AiController],
    providers: [AiService, PrismaService],
    exports: [AiService],
})
export class AiModule { }
