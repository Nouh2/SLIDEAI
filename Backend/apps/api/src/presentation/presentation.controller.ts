// apps/api/src/presentation/presentation.controller.ts
import {
    Controller,
    Get,
    Put,
    Post,
    Param,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { PresentationService } from './presentation.service.js';
import { z } from 'zod';

// === ZOD SCHEMAS ===
const updatePresentationSchema = z.object({
    slides: z.any().optional(),
    title: z.string().optional(),
});

const joinSchema = z.object({
    token: z.string().min(1),
});

@Controller('/v1/presentations')
@UseGuards(SupabaseGuard)
export class PresentationController {
    constructor(private readonly presentationService: PresentationService) { }

    /**
     * GET /v1/presentations
     * List all presentations (owned + shared) for the current user
     */
    @Get()
    async listPresentations(@Req() req: FastifyRequest & { user: any }) {
        const userId = req.user.sub;
        return this.presentationService.findAllForUser(userId);
    }

    /**
     * GET /v1/presentations/:id
     * Get a single presentation (if user has access)
     */
    @Get(':id')
    async getPresentation(
        @Param('id') id: string,
        @Req() req: FastifyRequest & { user: any },
    ) {
        const userId = req.user.sub;
        return this.presentationService.findOne(id, userId);
    }

    /**
     * PUT /v1/presentations/:id
     * Update a presentation (if user has access)
     */
    @Put(':id')
    async updatePresentation(
        @Param('id') id: string,
        @Body() body: unknown,
        @Req() req: FastifyRequest & { user: any },
    ) {
        const userId = req.user.sub;
        const data = updatePresentationSchema.parse(body);
        return this.presentationService.update(id, userId, data);
    }

    /**
     * POST /v1/presentations/:id/share
     * Generate a share link (owner only, requires subscription feature)
     */
    @Post(':id/share')
    async sharePresentation(
        @Param('id') id: string,
        @Req() req: FastifyRequest & { user: any },
    ) {
        const userId = req.user.sub;
        const userEmail = req.user.email;
        const { token } = await this.presentationService.generateShareLink(id, userId, userEmail);

        // Build a full share URL (frontend will handle this route)
        // FRONTEND_URL should be set in .env for production (e.g., https://slideai.com)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const shareUrl = `${frontendUrl}/share/${token}`;

        return { shareUrl, token };
    }

    /**
     * POST /v1/presentations/join
     * Join a presentation using a share token
     */
    @Post('join')
    async joinPresentation(
        @Body() body: unknown,
        @Req() req: FastifyRequest & { user: any },
    ) {
        const userId = req.user.sub;
        const { token } = joinSchema.parse(body);
        const presentation = await this.presentationService.joinByToken(token, userId);
        return { presentationId: presentation.id };
    }
}
