// apps/api/src/generate/generate.module.ts
import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { DocumentParserService } from './document-parser.service.js';
import { PPTXParserService } from './pptx-parser.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  imports: [SubscriptionModule],
  controllers: [GenerateController],
  providers: [DocumentParserService, PPTXParserService, PrismaService],
  exports: [DocumentParserService, PPTXParserService],
})
export class GenerateModule { }
