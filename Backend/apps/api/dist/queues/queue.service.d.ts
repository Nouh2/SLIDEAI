import { Queue, QueueEvents, JobsOptions } from 'bullmq';
export declare class QueueService {
    readonly generateQueue: Queue<any, any, string, any, any, string>;
    readonly exportQueue: Queue<any, any, string, any, any, string>;
    readonly generateEvents: QueueEvents;
    readonly exportEvents: QueueEvents;
    addGenerate(payload: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    addExport(payload: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
}
