// apps/api/src/generate/generate.controller.ts
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { z } from 'zod';
import { QueueService } from '../queues/queue.service.js';
import { ulid } from 'ulid';
import IORedis from 'ioredis';

const generateSchema = z.object({
  prompt: z.string().min(3),
  language: z.enum(['fr', 'en', 'es']).default('en'),
  tone: z.enum(['pro', 'casual']).default('pro'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  slideCount: z.number().int().min(3).max(20).default(8),
  theme: z.enum([
    'startup-pitch',
    'product-launch',
    'corporate-report',
    'creative-portfolio',
    'educational',
    'marketing-campaign',
    'minimal-elegant',
    'tech-modern',
    'consulting',
    'health-medical',
    'sustainability'
  ]).default('startup-pitch'),
});


@Controller('/v1')
@UseGuards(SupabaseGuard)
export class GenerateController {
  private redis: IORedis;

  constructor(private queues: QueueService) {
    this.redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }

  @Post('/generate')
  async generate(@Req() req: any, @Body() body: any) {
    console.log('[DEBUG] Received /v1/generate request:', { body, user: req.user });
    const data = generateSchema.parse(body);
    const traceId = ulid();

    // Optionnel: état initial "accepted"
    await this.redis.set(
      `job:${traceId}`,
      JSON.stringify({ status: 'accepted', type: 'generate', createdAt: Date.now() }),
      'EX',
      3600,
    );

    console.log('[DEBUG] Adding job to queue:', traceId);
    await this.queues.addGenerate({ traceId, user: { sub: req.user.sub, org: req.user.org_id }, data });
    console.log('[DEBUG] Job added successfully:', traceId);
    return { traceId, status: 'accepted' as const };
  }

  // Suivi de job (lecture Redis)
  @Get('/jobs/:traceId')
  async jobStatus(@Param('traceId') traceId: string) {
    const raw = await this.redis.get(`job:${traceId}`);
    if (!raw) {
      return { traceId, status: 'unknown' as const };
    }
    const parsed = JSON.parse(raw);
    return { traceId, ...parsed };
  }
}
