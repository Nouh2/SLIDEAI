// apps/api/src/queues/queue.service.ts
import { Injectable } from '@nestjs/common';
import { Queue, QueueEvents, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

@Injectable()
export class QueueService {
  readonly generateQueue = new Queue('generate', { connection });
  readonly exportQueue = new Queue('export', { connection });
  readonly generateEvents = new QueueEvents('generate', { connection });
  readonly exportEvents = new QueueEvents('export', { connection });

  async addGenerate(payload: any, opts: JobsOptions = {}) {
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
    } catch (error: any) {
      console.error('[QueueService] Error adding job:', error.message);
      throw error;
    }
  }

  addExport(payload: any, opts: JobsOptions = {}) {
    return this.exportQueue.add('export', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
  }
}
