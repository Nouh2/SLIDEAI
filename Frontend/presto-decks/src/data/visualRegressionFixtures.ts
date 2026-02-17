import { buildLayoutRegistryDeck } from '@/data/layoutRegistry';

export const getVisualRegressionDeck = (maxSlides?: number, offset: number = 0) =>
    buildLayoutRegistryDeck(maxSlides, offset, true);
export const visualRegressionDeck = getVisualRegressionDeck();
