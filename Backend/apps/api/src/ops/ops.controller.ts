import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { OpsAdminGuard } from './ops-admin.guard.js';
import { OpsService } from './ops.service.js';

@Controller('/v1/ops')
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Get('/unsubscribe/:token')
  @Header('Content-Type', 'text/html; charset=utf-8')
  async unsubscribe(@Param('token') token: string) {
    const result = await this.opsService.unsubscribeByToken(token);
    return result.html;
  }

  @Get('/me')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  getMe(@Req() req: any) {
    return this.opsService.getOpsSession(req.user.email);
  }

  @Get('/overview')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  getOverview() {
    return this.opsService.getOverview();
  }

  @Get('/email-templates')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  listTemplates() {
    return this.opsService.listTemplates();
  }

  @Get('/email-templates/:slug')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  getTemplate(@Param('slug') slug: string) {
    return this.opsService.getTemplate(slug);
  }

  @Put('/email-templates/:slug')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  updateTemplate(@Param('slug') slug: string, @Body() body: any, @Req() req: any) {
    return this.opsService.updateTemplate(slug, body, req.user.email);
  }

  @Post('/email-templates/:slug/publish')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  publishTemplate(@Param('slug') slug: string, @Req() req: any) {
    return this.opsService.publishTemplate(slug, req.user.email);
  }

  @Post('/email-templates/:slug/preview')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  previewTemplate(
    @Param('slug') slug: string,
    @Body() body: { mode?: 'draft' | 'live'; fixtureOverrides?: Record<string, any> },
  ) {
    return this.opsService.previewTemplate(slug, body?.mode || 'draft', body?.fixtureOverrides);
  }

  @Post('/email-templates/:slug/test-send')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  sendTemplateTest(
    @Param('slug') slug: string,
    @Body() body: { mode?: 'draft' | 'live'; to: string; fixtureOverrides?: Record<string, any> },
  ) {
    return this.opsService.sendTemplateTest(slug, body?.mode || 'draft', body.to, body?.fixtureOverrides);
  }

  @Get('/email-flows')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  listFlows() {
    return this.opsService.listFlows();
  }

  @Put('/email-flows/:slug')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  updateFlow(@Param('slug') slug: string, @Body() body: any, @Req() req: any) {
    return this.opsService.updateFlow(slug, body, req.user.email);
  }

  @Post('/email-flows/:slug/publish')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  publishFlow(@Param('slug') slug: string, @Req() req: any) {
    return this.opsService.publishFlow(slug, req.user.email);
  }

  @Get('/email-logs')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  listLogs(@Query('limit') limit?: string) {
    return this.opsService.listLogs(limit ? Number(limit) : 120);
  }

  @Get('/broadcast/users')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  broadcastGetUsers(@Query('segment') segment: string) {
    const validSegments = ['all', 'trialing', 'trial_expired', 'legacy_free', 'paid'];
    const seg = validSegments.includes(segment) ? segment : 'all';
    return this.opsService.broadcastGetUsers(seg as any);
  }

  @Post('/broadcast/preview')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  broadcastPreview(@Body() body: any) {
    return this.opsService.broadcastPreview(body);
  }

  @Post('/broadcast/send')
  @UseGuards(SupabaseGuard, OpsAdminGuard)
  broadcastSend(@Body() body: any, @Req() req: any) {
    return this.opsService.broadcastSend(body, req.user.email);
  }
}
