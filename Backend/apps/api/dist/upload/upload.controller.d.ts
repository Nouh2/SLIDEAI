import { FastifyRequest } from 'fastify';
export declare class UploadController {
    private supabase;
    private bucket;
    constructor();
    uploadFile(req: FastifyRequest): Promise<{
        url: string;
    }>;
}
