var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// apps/api/src/queues/queue.service.ts
import 'dotenv/config'; // Load env vars FIRST
import { Injectable } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import * as path from 'path';
import * as dotenv from 'dotenv';
// Also try to load from apps/api/.env specifically
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
// Build Redis URL from separate env vars if REDIS_URL not provided
function getRedisUrl() {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';
    const password = process.env.REDIS_PASSWORD;
    if (password) {
        return `redis://:${password}@${host}:${port}`;
    }
    return `redis://${host}:${port}`;
}
const redisUrl = getRedisUrl();
console.log('[QueueService] Connecting to Redis:', redisUrl.replace(/:[^:@]+@/, ':***@')); // Hide password in logs
const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
});
// Log Redis connection status
connection.on('connect', () => {
    console.log('[QueueService] ✅ Redis connected successfully');
});
connection.on('error', (err) => {
    console.error('[QueueService] ❌ Redis connection error:', err.message);
});
let QueueService = class QueueService {
    generateQueue = new Queue('generate', { connection });
    exportQueue = new Queue('export', { connection });
    regenerateSlideQueue = new Queue('regenerate-slide', { connection });
    generateEvents = new QueueEvents('generate', { connection });
    exportEvents = new QueueEvents('export', { connection });
    regenerateSlideEvents = new QueueEvents('regenerate-slide', { connection });
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
    async addRegenerateSlide(payload, opts = {}) {
        console.log('[QueueService] Adding job to regenerate-slide queue...');
        try {
            const job = await this.regenerateSlideQueue.add('regenerate-slide', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
            console.log('[QueueService] Regenerate slide job added:', job.id);
            return job;
        }
        catch (error) {
            console.error('[QueueService] Error adding regenerate-slide job:', error.message);
            throw error;
        }
    }
    // === COLOR PALETTE MODIFICATION ===
    modifyColorPaletteQueue = new Queue('modify-color-palette', { connection });
    modifyColorPaletteEvents = new QueueEvents('modify-color-palette', { connection });
    async addModifyColorPalette(payload, opts = {}) {
        console.log('[QueueService] Adding job to modify-color-palette queue...');
        try {
            const job = await this.modifyColorPaletteQueue.add('modify-color-palette', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
            console.log('[QueueService] Modify color palette job added:', job.id);
            return job;
        }
        catch (error) {
            console.error('[QueueService] Error adding modify-color-palette job:', error.message);
            throw error;
        }
    }
    // === ADD SLIDE ===
    addSlideQueue = new Queue('add-slide', { connection });
    addSlideEvents = new QueueEvents('add-slide', { connection });
    async addAddSlide(payload, opts = {}) {
        console.log('[QueueService] Adding job to add-slide queue...');
        try {
            const job = await this.addSlideQueue.add('add-slide', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
            console.log('[QueueService] Add slide job added:', job.id);
            return job;
        }
        catch (error) {
            console.error('[QueueService] Error adding add-slide job:', error.message);
            throw error;
        }
    }
};
QueueService = __decorate([
    Injectable()
], QueueService);
export { QueueService };
