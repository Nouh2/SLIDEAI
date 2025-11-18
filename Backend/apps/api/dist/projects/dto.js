// apps/api/src/projects/dto.ts
import { z } from 'zod';
export const createProjectSchema = z.object({
    title: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
});
export const updateProjectSchema = z.object({
    title: z.string().min(1).max(120).optional(),
    description: z.string().max(500).optional(),
});
