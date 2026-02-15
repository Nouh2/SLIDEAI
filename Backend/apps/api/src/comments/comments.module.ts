
import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { CommentsController } from './comments.controller.js';
import { PrismaService } from '../prisma.service.js';

@Module({
    controllers: [CommentsController],
    providers: [CommentsService, PrismaService],
    exports: [CommentsService],
})
export class CommentsModule { }
