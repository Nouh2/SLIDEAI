import { QueueService } from '../queues/queue.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
export declare class ExportController {
    private queues;
    private subscriptionService;
    constructor(queues: QueueService, subscriptionService: SubscriptionService);
    export(req: any, body: any): Promise<{
        traceId: string;
        status: "accepted";
    }>;
    translate(req: any, body: any): Promise<{
        traceId: string;
        status: "accepted";
    }>;
}
