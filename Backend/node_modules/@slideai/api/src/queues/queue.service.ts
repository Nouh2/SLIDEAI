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

  addGenerate(payload: any, opts: JobsOptions = {}) {
    return this.generateQueue.add('generate', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
  }

  addExport(payload: any, opts: JobsOptions = {}) {
    return this.exportQueue.add('export', payload, { attempts: 3, removeOnComplete: 1000, ...opts });
  }
}
