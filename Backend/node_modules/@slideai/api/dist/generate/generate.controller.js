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
// apps/api/src/generate/generate.controller.ts
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseGuard } from '../auth/supabase.guard.js';
import { z } from 'zod';
import { QueueService } from '../queues/queue.service.js';
import { ulid } from 'ulid';
import IORedis from 'ioredis';
const generateSchema = z.object({
    prompt: z.string().min(3),
    language: z.enum(['fr', 'en', 'es']).default('en'),
    tone: z.enum(['pro', 'casual']).default('pro'),
    length: z.enum(['short', 'medium', 'long']).default('medium'),
    slideCount: z.number().int().min(3).max(20).default(8),
    theme: z.enum([
        'startup-pitch',
        'product-launch',
        'corporate-report',
        'creative-portfolio',
        'educational',
        'marketing-campaign',
        'minimal-elegant',
        'tech-modern',
        'consulting',
        'health-medical',
        'sustainability'
    ]).default('startup-pitch'),
});
let GenerateController = class GenerateController {
    queues;
    redis;
    constructor(queues) {
        this.queues = queues;
        this.redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
        });
    }
    async generate(req, body) {
        console.log('[DEBUG] Received /v1/generate request:', { body, user: req.user });
        const data = generateSchema.parse(body);
        const traceId = ulid();
        // Optionnel: état initial "accepted"
        await this.redis.set(`job:${traceId}`, JSON.stringify({ status: 'accepted', type: 'generate', createdAt: Date.now() }), 'EX', 3600);
        console.log('[DEBUG] Adding job to queue:', traceId);
        await this.queues.addGenerate({ traceId, user: { sub: req.user.sub, org: req.user.org_id }, data });
        console.log('[DEBUG] Job added successfully:', traceId);
        return { traceId, status: 'accepted' };
    }
    // Suivi de job (lecture Redis)
    async jobStatus(traceId) {
        const raw = await this.redis.get(`job:${traceId}`);
        if (!raw) {
            return { traceId, status: 'unknown' };
        }
        const parsed = JSON.parse(raw);
        return { traceId, ...parsed };
    }
};
__decorate([
    Post('/generate'),
    __param(0, Req()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GenerateController.prototype, "generate", null);
__decorate([
    Get('/jobs/:traceId'),
    __param(0, Param('traceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GenerateController.prototype, "jobStatus", null);
GenerateController = __decorate([
    Controller('/v1'),
    UseGuards(SupabaseGuard),
    __metadata("design:paramtypes", [QueueService])
], GenerateController);
export { GenerateController };
