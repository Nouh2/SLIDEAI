import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { ProductEventsService } from './product-events.service.js';

@Controller('/v1/product-events')
export class ProductEventsController {
  constructor(private readonly productEventsService: ProductEventsService) {}

  @Post()
  @UseGuards(SupabaseGuard)
  recordEvent(@Req() req: any, @Body() body: any) {
    return this.productEventsService.recordEvent(req.user, body);
  }
}
