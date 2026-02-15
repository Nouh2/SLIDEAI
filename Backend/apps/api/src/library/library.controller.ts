import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { LibraryService } from './library.service.js';
import { z } from 'zod';

const saveSlideSchema = z.object({
    name: z.string().min(1),
    content: z.any(),
    category: z.string().optional(),
    type: z.string().optional(),
});

@Controller('/v1/library')
@UseGuards(SupabaseGuard)
export class LibraryController {
    constructor(private readonly libraryService: LibraryService) { }

    @Post('slides')
    async saveSlide(
        @Body() body: unknown,
        @Req() req: FastifyRequest & { user: any },
    ) {
        const userId = req.user.sub;
        const { name, content, category, type } = saveSlideSchema.parse(body);
        return this.libraryService.saveSlide(userId, name, content, category, type);
    }

    @Get('slides')
    async listSlides(@Req() req: FastifyRequest & { user: any }) {
        const userId = req.user.sub;
        return this.libraryService.listSlides(userId);
    }

    @Delete('slides/:id')
    async deleteSlide(
        @Param('id') id: string,
        @Req() req: FastifyRequest & { user: any },
    ) {
        const userId = req.user.sub;
        return this.libraryService.deleteSlide(id, userId);
    }
}
