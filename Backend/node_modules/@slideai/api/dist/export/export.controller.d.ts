import { QueueService } from '../queues/queue.service.js';
export declare class ExportController {
    private queues;
    constructor(queues: QueueService);
    export(req: any, body: any): Promise<{
        traceId: string;
        status: "accepted";
    }>;
}
