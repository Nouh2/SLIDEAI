import { Injectable } from '@nestjs/common';
import { QueueService } from '../queues/queue.service.js';
import { AnalyzeImageDto } from './dto/analyze-image.dto.js';
import { ulid } from 'ulid';

@Injectable()
export class AiService {
    constructor(private queueService: QueueService) { }

    async analyzeImage(userId: string, data: AnalyzeImageDto) {
        const traceId = ulid();

        await this.queueService.addAnalyzeImage({
            traceId,
            userId,
            imageUrl: data.imageUrl,
            context: data.context,
        });

        return {
            traceId,
            status: 'accepted',
        };
    }
}
