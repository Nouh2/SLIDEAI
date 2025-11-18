// src/ai/deck-schema.ts
import { z } from "zod";

export const SlideSchema = z.object({
  title: z.string(),
  bullets: z.array(z.string()),
  layout: z.enum([
    "title-left-bullets-right-illustration",
    "title-top-bullets-bottom",
    "title-top-columns",
    "title-left-metrics-right"
  ]),
  illustration: z.object({
    type: z.enum(["icon", "image"]),
    name: z.string().optional(),
    url: z.string().optional(),
  }),
});

export const DeckSchema = z.object({
  title: z.string(),
  theme: z.enum(["Modern-01", "Minimal-Grid", "Bold-Contrast"]).default("Modern-01"),
  prompt: z.string().optional(),
  slides: z.array(SlideSchema),
});

export type Deck = z.infer<typeof DeckSchema>;
