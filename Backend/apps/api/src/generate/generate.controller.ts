// apps/api/src/generate/generate.controller.ts
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { z } from 'zod';
import { QueueService } from '../queues/queue.service.js';
import { ulid } from 'ulid';
import IORedis from 'ioredis';

const generateSchema = z.object({
  prompt: z.string().min(3),
  language: z.enum(['fr', 'en']).default('fr'),
  tone: z.enum(['pro', 'casual']).default('pro'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
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
    const data = generateSchema.parse(body);
    const traceId = ulid();

    // Optionnel: état initial "accepted"
    await this.redis.set(
      `job:${traceId}`,
      JSON.stringify({ status: 'accepted', type: 'generate', createdAt: Date.now() }),
      'EX',
      3600,
    );

    await this.queues.addGenerate({ traceId, user: { sub: req.user.sub, org: req.user.org_id }, data });
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
