import { Module } from '@nestjs/common';
import { ExportController } from './export.controller.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  imports: [SubscriptionModule],
  controllers: [ExportController],
  providers: [PrismaService],
})
export class ExportModule { }
