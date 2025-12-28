// apps/api/src/generate/generate.module.ts
import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';

@Module({
  imports: [SubscriptionModule],
  controllers: [GenerateController],
})
export class GenerateModule { }
