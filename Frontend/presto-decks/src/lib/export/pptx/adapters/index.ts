// src/lib/export/pptx/adapters/index.ts
// Adapter registry - determines which adapter to use for each slide

import { LayoutAdapter, SlideData } from '../types';
import { coverAdapter } from './coverAdapter';
import { contentAdapter } from './contentAdapter';
import { statsAdapter } from './statsAdapter';
import { chartAdapter } from './chartAdapter';
import { tableAdapter } from './tableAdapter';
import { timelineAdapter } from './timelineAdapter';
import { comparisonAdapter } from './comparisonAdapter';
import { sectionAdapter } from './sectionAdapter';
import { infographicAdapter } from './infographicAdapter';

// Order matters: more specific adapters first, generic adapters last
const adapters: LayoutAdapter[] = [
    coverAdapter,
    sectionAdapter,
    statsAdapter,
    comparisonAdapter,
    timelineAdapter,
    infographicAdapter,
    chartAdapter,
    tableAdapter,
    contentAdapter, // Default fallback
];

/**
 * Get the appropriate adapter for a slide
 * Returns the first adapter that can handle the slide
 */
export const getAdapter = (slide: SlideData): LayoutAdapter => {
    for (const adapter of adapters) {
        if (adapter.canHandle(slide)) {
            return adapter;
        }
    }
    // Fallback to content adapter (should always match)
    return contentAdapter;
};

/**
 * Get all available adapters
 */
export const getAllAdapters = (): LayoutAdapter[] => adapters;

// Re-export individual adapters for direct use
export {
    coverAdapter,
    contentAdapter,
    statsAdapter,
    chartAdapter,
    tableAdapter,
    timelineAdapter,
    comparisonAdapter,
    sectionAdapter,
};
