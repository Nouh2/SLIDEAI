var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// apps/api/src/queues/queue.service.ts
import { Injectable } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});
let QueueService = class QueueService {
    generateQueue = new Queue('generate', { connection });
    exportQueue = new Queue('export', { connection });
    generateEvents = new QueueEvents('generate', { connection });
    exportEvents = new QueueEvents('export', { connection });
    async addGenerate(payload, opts = {}) {
        console.log('[QueueService] Adding job to generate queue...');
        console.log('[QueueService] Redis URL:', process.env.REDIS_URL ?? 'redis://localhost:6379');
        try {
            const job = await this.generateQueue.add('generate', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
            console.log('[QueueService] Job added successfully:', job.id, 'Queue:', this.generateQueue.name);
            // Check queue status
            const waiting = await this.generateQueue.getWaitingCount();
            const active = await this.generateQueue.getActiveCount();
            const completed = await this.generateQueue.getCompletedCount();
            console.log(`[QueueService] Queue stats - Waiting: ${waiting}, Active: ${active}, Completed: ${completed}`);
            return job;
        }
        catch (error) {
            console.error('[QueueService] Error adding job:', error.message);
            throw error;
        }
    }
    addExport(payload, opts = {}) {
        return this.exportQueue.add('export', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
    }
};
QueueService = __decorate([
    Injectable()
], QueueService);
export { QueueService };
