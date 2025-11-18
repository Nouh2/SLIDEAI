// apps/api/src/account/account.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';

@Controller('/account')
@UseGuards(SupabaseGuard)
export class AccountController {
  @Get('/me')
  me(@Req() req: any) {
    return { user: req.user };
  }
}
