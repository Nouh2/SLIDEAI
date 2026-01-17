// src/lib/export/pdfExporter.ts
// PDF export utility using html2canvas and jsPDF
// Optimized for speed and file size

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExportProgressCallback } from './types';

// Slide dimensions (16:9 aspect ratio)
const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

// Export settings - optimized for small file size
const EXPORT_SETTINGS = {
    scale: 1.2,           // Lower scale for smaller files (still decent quality)
    imageFormat: 'JPEG',  // JPEG is ~10x smaller than PNG
    imageQuality: 0.65,   // Lower quality = smaller size (still looks good)
    batchSize: 4,         // Capture 4 slides in parallel
};

/**
 * Creates a hidden container to render slides for export
 */
const createRenderContainer = (id: string): HTMLDivElement => {
    const container = document.createElement('div');
    container.id = `render-container-${id}`;
    container.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        width: ${SLIDE_WIDTH}px;
        height: ${SLIDE_HEIGHT}px;
        overflow: hidden;
        background: white;
        z-index: -9999;
    `;
    document.body.appendChild(container);
    return container;
};

/**
 * Clones a slide element for rendering
 */
const cloneSlideForRender = (slideElement: HTMLElement, container: HTMLDivElement): void => {
    // Clone the slide
    const clone = slideElement.cloneNode(true) as HTMLElement;

    // Set to exact slide dimensions
    clone.style.cssText = `
        width: ${SLIDE_WIDTH}px !important;
        height: ${SLIDE_HEIGHT}px !important;
        transform: none !important;
        position: relative !important;
        overflow: hidden !important;
    `;

    // Clear and append
    container.innerHTML = '';
    container.appendChild(clone);
};

/**
 * Captures a single slide element as image data
 */
const captureSlideAsImageData = async (
    slideElement: HTMLElement,
    containerId: string
): Promise<string> => {
    // Create dedicated container for this capture
    const container = createRenderContainer(containerId);

    try {
        // Clone slide into render container
        cloneSlideForRender(slideElement, container);

        // Small delay to ensure styles are applied
        await new Promise(resolve => setTimeout(resolve, 50));

        // Capture with html2canvas
        const canvas = await html2canvas(container, {
            width: SLIDE_WIDTH,
            height: SLIDE_HEIGHT,
            scale: EXPORT_SETTINGS.scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#FFFFFF',
            logging: false,
            imageTimeout: 10000,
        });

        // Convert to JPEG for much smaller file size
        return canvas.toDataURL(`image/jpeg`, EXPORT_SETTINGS.imageQuality);

    } finally {
        // Cleanup container
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }
};

/**
 * Process slides in batches for faster export
 */
const captureSlidesInBatches = async (
    slideElements: HTMLElement[],
    onProgress?: ExportProgressCallback
): Promise<string[]> => {
    const results: string[] = [];
    const batchSize = EXPORT_SETTINGS.batchSize;

    for (let i = 0; i < slideElements.length; i += batchSize) {
        const batch = slideElements.slice(i, i + batchSize);

        onProgress?.({
            current: i,
            total: slideElements.length,
            status: 'rendering',
            message: `Capture des slides ${i + 1}-${Math.min(i + batchSize, slideElements.length)}/${slideElements.length}...`
        });

        // Capture batch in parallel
        const batchPromises = batch.map((slide, idx) =>
            captureSlideAsImageData(slide, `batch-${i}-${idx}`)
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }

    return results;
};

/**
 * Exports presentation slides to PDF
 * 
 * @param slideElements - Array of slide DOM elements to capture
 * @param title - Presentation title (used for filename)
 * @param onProgress - Optional callback for progress updates
 */
export const exportToPDF = async (
    slideElements: HTMLElement[],
    title: string,
    onProgress?: ExportProgressCallback
): Promise<void> => {
    if (slideElements.length === 0) {
        throw new Error('No slides to export');
    }

    onProgress?.({
        current: 0,
        total: slideElements.length,
        status: 'preparing',
        message: 'Préparation de l\'export...'
    });

    try {
        // Capture all slides (in batches for speed)
        const imageDataArray = await captureSlidesInBatches(slideElements, onProgress);

        onProgress?.({
            current: slideElements.length,
            total: slideElements.length,
            status: 'generating',
            message: 'Génération du PDF...'
        });

        // Create PDF with landscape orientation
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [SLIDE_WIDTH, SLIDE_HEIGHT],
            hotfixes: ['px_scaling'],
            compress: true, // Enable compression
        });

        // Add all captured slides to PDF
        for (let i = 0; i < imageDataArray.length; i++) {
            if (i > 0) {
                pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], 'landscape');
            }
            pdf.addImage(
                imageDataArray[i],
                'JPEG',
                0,
                0,
                SLIDE_WIDTH,
                SLIDE_HEIGHT,
                undefined,
                'FAST' // Fast compression
            );
        }

        // Sanitize filename
        const sanitizedTitle = title.replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'presentation';

        // Save PDF
        pdf.save(`${sanitizedTitle}.pdf`);

        onProgress?.({
            current: slideElements.length,
            total: slideElements.length,
            status: 'complete',
            message: 'Export terminé !'
        });

    } catch (error) {
        console.error('PDF export error:', error);
        throw error;
    }
};

/**
 * Gets all slide elements from the presentation
 * This function should be called from the Editor component
 */
export const getSlideElements = (containerSelector: string = '[data-slide-content]'): HTMLElement[] => {
    return Array.from(document.querySelectorAll(containerSelector)) as HTMLElement[];
};
