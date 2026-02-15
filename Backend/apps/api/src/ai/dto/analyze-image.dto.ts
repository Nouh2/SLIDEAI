import { z } from 'zod';

export const analyzeImageSchema = z.object({
    imageUrl: z.string().url(),
    context: z.string().optional(),
});

export type AnalyzeImageDto = z.infer<typeof analyzeImageSchema>;
