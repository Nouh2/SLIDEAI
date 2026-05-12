import { ProductEventsService } from './product-events.service.js';
export declare class ProductEventsController {
    private readonly productEventsService;
    constructor(productEventsService: ProductEventsService);
    recordEvent(req: any, body: any): Promise<{
        stored: boolean;
        reason: string;
    } | {
        stored: boolean;
        reason?: undefined;
    }>;
}
