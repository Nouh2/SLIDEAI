import { FastifyRequest } from 'fastify';
import { QueueService } from '../queues/queue.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { DocumentParserService } from './document-parser.service.js';
import { PPTXParserService } from './pptx-parser.service.js';
export declare class GenerateController {
    private queues;
    private subscriptionService;
    private documentParser;
    private pptxParser;
    private redis;
    constructor(queues: QueueService, subscriptionService: SubscriptionService, documentParser: DocumentParserService, pptxParser: PPTXParserService);
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
    /**
     * Parse document structure (Smart Report Parsing)
     * Returns detected sections/chapters for user selection before generation
     * PROTECTED: Requires valid Supabase JWT
     */
    parseDocument(req: FastifyRequest & {
        user: any;
    }): Promise<{
        error: string;
        success: boolean;
        document?: undefined;
        parseToken?: undefined;
    } | {
        success: boolean;
        document: {
            title: string;
            totalPages: number;
            totalChars: number;
            sections: {
                id: string;
                title: string;
                level: number;
                pageStart: number;
                pageEnd: number;
                charCount: number;
                estimatedSlides: number;
            }[];
        };
        parseToken: string;
        error?: undefined;
    }>;
    /**
     * Store parsed document in Redis for subsequent generation
     */
    private storeParsedDocument;
}
