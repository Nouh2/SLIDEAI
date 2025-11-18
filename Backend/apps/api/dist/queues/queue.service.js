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
    addGenerate(payload, opts = {}) {
        return this.generateQueue.add('generate', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
    }
    addExport(payload, opts = {}) {
        return this.exportQueue.add('export', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
    }
};
QueueService = __decorate([
    Injectable()
], QueueService);
export { QueueService };
