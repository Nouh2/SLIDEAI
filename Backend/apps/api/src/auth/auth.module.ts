import { Module } from '@nestjs/common';
import { SupabaseGuard } from './supabase.guard.js';
import { PrismaService } from '../prisma.service.js';

@Module({
  providers: [SupabaseGuard, PrismaService],
  exports: [SupabaseGuard],
})
export class AuthModule { }
