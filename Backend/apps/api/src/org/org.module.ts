import { Module } from '@nestjs/common';
import { OrgService } from './org.service.js';
import { OrgController } from './org.controller.js';
import { PrismaService } from '../prisma.service.js';

@Module({
    controllers: [OrgController],
    providers: [OrgService, PrismaService],
    exports: [OrgService],
})
export class OrgModule { }
