// apps/api/src/generate/generate.module.ts
import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { DocumentParserService } from './document-parser.service.js';

@Module({
  imports: [SubscriptionModule],
  controllers: [GenerateController],
  providers: [DocumentParserService],
  exports: [DocumentParserService],
})
export class GenerateModule { }
