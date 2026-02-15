import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller.js';
import { LibraryService } from './library.service.js';
import { PrismaService } from '../prisma.service.js';

@Module({
    controllers: [LibraryController],
    providers: [LibraryService, PrismaService],
    exports: [LibraryService],
})
export class LibraryModule { }
