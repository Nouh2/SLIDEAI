import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { AiService } from './ai.service.js';
import { analyzeImageSchema } from './dto/analyze-image.dto.js';

@Controller('v1/ai')
export class AiController {
    constructor(private aiService: AiService) { }

    @Post('/analyze-image')
    @UseGuards(SupabaseGuard)
    async analyzeImage(@Req() req: FastifyRequest & { user: any }, @Body() body: any) {
        const data = analyzeImageSchema.parse(body);
        return this.aiService.analyzeImage(req.user.sub, data);
    }
}
