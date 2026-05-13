var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Header, Param, Post, Put, Query, Req, UseGuards, } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { OpsAdminGuard } from './ops-admin.guard.js';
import { OpsService } from './ops.service.js';
let OpsController = class OpsController {
    opsService;
    constructor(opsService) {
        this.opsService = opsService;
    }
    async unsubscribe(token) {
        const result = await this.opsService.unsubscribeByToken(token);
        return result.html;
    }
    getMe(req) {
        return this.opsService.getOpsSession(req.user.email);
    }
    getOverview() {
        return this.opsService.getOverview();
    }
    getMoneyFunnel(days) {
        return this.opsService.getMoneyFunnel(days ? Number(days) : 30);
    }
    listTemplates() {
        return this.opsService.listTemplates();
    }
    getTemplate(slug) {
        return this.opsService.getTemplate(slug);
    }
    updateTemplate(slug, body, req) {
        return this.opsService.updateTemplate(slug, body, req.user.email);
    }
    publishTemplate(slug, req) {
        return this.opsService.publishTemplate(slug, req.user.email);
    }
    previewTemplate(slug, body) {
        return this.opsService.previewTemplate(slug, body?.mode || 'draft', body?.fixtureOverrides);
    }
    sendTemplateTest(slug, body) {
        return this.opsService.sendTemplateTest(slug, body?.mode || 'draft', body.to, body?.fixtureOverrides);
    }
    listFlows() {
        return this.opsService.listFlows();
    }
    updateFlow(slug, body, req) {
        return this.opsService.updateFlow(slug, body, req.user.email);
    }
    publishFlow(slug, req) {
        return this.opsService.publishFlow(slug, req.user.email);
    }
    listLogs(limit) {
        return this.opsService.listLogs(limit ? Number(limit) : 120);
    }
    getEmailFunnel(days) {
        return this.opsService.getEmailFunnel(days ? Number(days) : 30);
    }
    getActivationFunnel(days) {
        return this.opsService.getProductActivationFunnel(days ? Number(days) : 30);
    }
    broadcastGetUsers(segment) {
        const validSegments = ['all', 'trialing', 'trial_expired', 'legacy_free', 'paid'];
        const seg = validSegments.includes(segment) ? segment : 'all';
        return this.opsService.broadcastGetUsers(seg);
    }
    broadcastPreview(body) {
        return this.opsService.broadcastPreview(body);
    }
    broadcastSend(body, req) {
        return this.opsService.broadcastSend(body, req.user.email);
    }
};
__decorate([
    Get('/unsubscribe/:token'),
    Header('Content-Type', 'text/html; charset=utf-8'),
    __param(0, Param('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OpsController.prototype, "unsubscribe", null);
__decorate([
    Get('/me'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getMe", null);
__decorate([
    Get('/overview'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getOverview", null);
__decorate([
    Get('/money-funnel'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Query('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getMoneyFunnel", null);
__decorate([
    Get('/email-templates'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "listTemplates", null);
__decorate([
    Get('/email-templates/:slug'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Param('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getTemplate", null);
__decorate([
    Put('/email-templates/:slug'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Param('slug')),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "updateTemplate", null);
__decorate([
    Post('/email-templates/:slug/publish'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Param('slug')),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "publishTemplate", null);
__decorate([
    Post('/email-templates/:slug/preview'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Param('slug')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "previewTemplate", null);
__decorate([
    Post('/email-templates/:slug/test-send'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Param('slug')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "sendTemplateTest", null);
__decorate([
    Get('/email-flows'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "listFlows", null);
__decorate([
    Put('/email-flows/:slug'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Param('slug')),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "updateFlow", null);
__decorate([
    Post('/email-flows/:slug/publish'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Param('slug')),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "publishFlow", null);
__decorate([
    Get('/email-logs'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "listLogs", null);
__decorate([
    Get('/email-funnel'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Query('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getEmailFunnel", null);
__decorate([
    Get('/activation-funnel'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Query('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "getActivationFunnel", null);
__decorate([
    Get('/broadcast/users'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Query('segment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "broadcastGetUsers", null);
__decorate([
    Post('/broadcast/preview'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "broadcastPreview", null);
__decorate([
    Post('/broadcast/send'),
    UseGuards(SupabaseGuard, OpsAdminGuard),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], OpsController.prototype, "broadcastSend", null);
OpsController = __decorate([
    Controller('/v1/ops'),
    __metadata("design:paramtypes", [OpsService])
], OpsController);
export { OpsController };
