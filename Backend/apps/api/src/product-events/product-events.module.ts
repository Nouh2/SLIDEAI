import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { ProductEventsController } from './product-events.controller.js';
import { ProductEventsService } from './product-events.service.js';

@Module({
  controllers: [ProductEventsController],
  providers: [ProductEventsService, PrismaService],
})
export class ProductEventsModule {}
