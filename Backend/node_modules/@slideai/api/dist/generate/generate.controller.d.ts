import { QueueService } from '../queues/queue.service.js';
export declare class GenerateController {
    private queues;
    private redis;
    constructor(queues: QueueService);
    generate(req: any, body: any): Promise<{
        traceId: string;
        status: "accepted";
    }>;
    jobStatus(traceId: string): Promise<any>;
}
