import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
import { SupabaseMirrorService } from './supabase-mirror.service.js';

@Module({
  providers: [PrismaService, SupabaseMirrorService],
  exports: [SupabaseMirrorService],
})
export class SupabaseMirrorModule {}
