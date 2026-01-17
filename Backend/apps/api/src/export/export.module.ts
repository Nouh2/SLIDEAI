// apps/api/src/export/export.module.ts
import { Module } from '@nestjs/common';
import { ExportController } from './export.controller.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';

@Module({
  imports: [SubscriptionModule],
  controllers: [ExportController],
})
export class ExportModule { }
