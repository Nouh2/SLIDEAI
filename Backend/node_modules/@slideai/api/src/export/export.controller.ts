// apps/api/src/export/export.controller.ts
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { z } from 'zod';
import { QueueService } from '../queues/queue.service.js';
import { ulid } from 'ulid';

const exportSchema = z.object({
  projectId: z.string().min(1).optional(),
  format: z.enum(['pptx', 'pdf']).default('pptx'),
  deck: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    theme: z.string().optional(),
    colorScheme: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
    }).optional(),
    slides: z.array(z.any()),
  }),
});

@Controller('/v1')
@UseGuards(SupabaseGuard)
export class ExportController {
  constructor(private queues: QueueService) { }

  @Post('/export')
  async export(@Req() req: any, @Body() body: any) {
    const data = exportSchema.parse(body);
    const traceId = ulid();
    await this.queues.addExport({ traceId, user: { sub: req.user.sub, org: req.user.org_id }, data });
    // Le worker produira une URL signée (Cloudflare R2) et pourra la logguer / insérer en DB.
    return { traceId, status: 'accepted' as const };
  }
}
