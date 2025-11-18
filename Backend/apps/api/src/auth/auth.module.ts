// apps/api/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { SupabaseGuard } from './supabase.guard.js';

@Module({
  providers: [SupabaseGuard],
  exports: [SupabaseGuard],
})
export class AuthModule {}
