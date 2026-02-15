import 'dotenv/config';
import { Queue, QueueEvents, JobsOptions } from 'bullmq';
export declare class QueueService {
    readonly generateQueue: Queue<any, any, string, any, any, string>;
    readonly exportQueue: Queue<any, any, string, any, any, string>;
    readonly regenerateSlideQueue: Queue<any, any, string, any, any, string>;
    readonly generateEvents: QueueEvents;
    readonly exportEvents: QueueEvents;
    readonly regenerateSlideEvents: QueueEvents;
    addGenerate(payload: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    addExport(payload: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    addRegenerateSlide(payload: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    readonly modifyColorPaletteQueue: Queue<any, any, string, any, any, string>;
    readonly modifyColorPaletteEvents: QueueEvents;
    addModifyColorPalette(payload: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    readonly addSlideQueue: Queue<any, any, string, any, any, string>;
    readonly addSlideEvents: QueueEvents;
    addAddSlide(payload: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    readonly translateDeckQueue: Queue<any, any, string, any, any, string>;
    readonly translateDeckEvents: QueueEvents;
    addTranslateDeck(payload: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
    readonly analyzeImageQueue: Queue<any, any, string, any, any, string>;
    readonly analyzeImageEvents: QueueEvents;
    addAnalyzeImage(payload: any, opts?: JobsOptions): Promise<import("bullmq").Job<any, any, string>>;
}
