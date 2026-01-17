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
import { Body, Controller, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { z } from 'zod';
import { QueueService } from '../queues/queue.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { ulid } from 'ulid';
const exportSchema = z.object({
    projectId: z.string().min(1).optional(),
    format: z.enum(['pptx', 'pdf']).default('pptx'),
    deck: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        theme: z.string().optional(),
        colorScheme: z.object({
            primary: z.string().optional(),
            secondary: z.string().optional(),
            accent: z.string().optional(),
        }).optional(),
        slides: z.array(z.any()),
    }),
});
let ExportController = class ExportController {
    queues;
    subscriptionService;
    constructor(queues, subscriptionService) {
        this.queues = queues;
        this.subscriptionService = subscriptionService;
    }
    async export(req, body) {
        const data = exportSchema.parse(body);
        const userId = req.user.sub;
        if (data.format === 'pdf') {
            const canExportPdf = await this.subscriptionService.hasFeature(userId, 'export_pdf');
            if (!canExportPdf) {
                throw new ForbiddenException('L\'export PDF n\'est pas disponible dans votre plan. Veuillez passer à un plan supérieur.');
            }
        }
        const traceId = ulid();
        await this.queues.addExport({ traceId, user: { sub: req.user.sub, org: req.user.org_id }, data });
        // Le worker produira une URL signée (Cloudflare R2) et pourra la logguer / insérer en DB.
        return { traceId, status: 'accepted' };
    }
};
__decorate([
    Post('/export'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "export", null);
ExportController = __decorate([
    Controller('/v1'),
    UseGuards(SupabaseGuard),
    __metadata("design:paramtypes", [QueueService,
        SubscriptionService])
], ExportController);
export { ExportController };
