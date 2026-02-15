
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { SupabaseGuard } from '../auth/supabase.guard.js';

@Controller('/v1/comments')
@UseGuards(SupabaseGuard)
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    create(@Body() createCommentDto: { presentationId: string; slideId: string; content: string }, @Req() req: any) {
        return this.commentsService.createComment({
            ...createCommentDto,
            userId: req.user.sub,
        });
    }

    @Get(':presentationId')
    findAll(@Param('presentationId') presentationId: string) {
        return this.commentsService.getCommentsByPresentation(presentationId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateCommentDto: { resolved: boolean }) {
        return this.commentsService.resolveComment(id, updateCommentDto.resolved);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        return this.commentsService.deleteComment(id, req.user.sub);
    }
}
