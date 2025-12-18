import { FastifyRequest } from 'fastify';
import { QueueService } from '../queues/queue.service.js';
export declare class GenerateController {
    private queues;
    private redis;
    constructor(queues: QueueService);
    /**
     * Generate presentation from prompt + optional document upload
     * Accepts both JSON and multipart/form-data
     * PROTECTED: Requires valid Supabase JWT
     */
    generate(req: FastifyRequest & {
        user: any;
    }): Promise<{
        traceId: string;
        status: "accepted";
        documentExtracted: boolean;
    }>;
    /**
     * Job status tracking (Redis lookup)
     * PUBLIC: No auth required - just returns job status for polling
     */
    jobStatus(traceId: string): Promise<any>;
}
