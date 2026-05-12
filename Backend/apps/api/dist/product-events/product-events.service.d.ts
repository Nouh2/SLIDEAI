import { PrismaService } from '../prisma.service.js';
type RecordEventInput = {
    eventName?: string;
    properties?: Record<string, any>;
    occurredAt?: string;
};
export declare class ProductEventsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    recordEvent(user: {
        sub: string;
        email?: string | null;
    }, input: RecordEventInput): Promise<{
        stored: boolean;
        reason: string;
    } | {
        stored: boolean;
        reason?: undefined;
    }>;
    private ensureUser;
    private sanitizeProperties;
    private isSensitiveKey;
}
export {};
