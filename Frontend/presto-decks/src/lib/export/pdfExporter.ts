// src/lib/export/pdfExporter.ts
// PDF export utility using html2canvas and jsPDF

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExportProgressCallback } from './types';

// Slide dimensions (16:9 aspect ratio)
const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

/**
 * Creates a hidden container to render slides for export
 */
const createRenderContainer = (): HTMLDivElement => {
    const container = document.createElement('div');
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
const cloneSlideForRender = (slideElement: HTMLElement, container: HTMLDivElement): HTMLElement => {
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

    return clone;
};

/**
 * Captures a slide element as a canvas
 */
const captureSlideAsCanvas = async (
    slideElement: HTMLElement,
    container: HTMLDivElement
): Promise<HTMLCanvasElement> => {
    // Clone slide into render container
    cloneSlideForRender(slideElement, container);

    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture with html2canvas
    const canvas = await html2canvas(container, {
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        scale: 2, // Higher resolution for better quality
        useCORS: true, // Allow cross-origin images
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
            // Ensure fonts are loaded in cloned document
            const clonedContainer = clonedDoc.body.querySelector('div');
            if (clonedContainer) {
                clonedContainer.style.fontFamily = 'Inter, system-ui, sans-serif';
            }
        }
    });

    return canvas;
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

    // Create PDF with landscape orientation
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [SLIDE_WIDTH, SLIDE_HEIGHT],
        hotfixes: ['px_scaling']
    });

    // Create hidden render container
    const renderContainer = createRenderContainer();

    try {
        onProgress?.({
            current: 0,
            total: slideElements.length,
            status: 'preparing',
            message: 'Préparation de l\'export...'
        });

        for (let i = 0; i < slideElements.length; i++) {
            onProgress?.({
                current: i,
                total: slideElements.length,
                status: 'rendering',
                message: `Capture de la slide ${i + 1}/${slideElements.length}...`
            });

            // Capture slide as canvas
            const canvas = await captureSlideAsCanvas(slideElements[i], renderContainer);

            // Convert to image data
            const imgData = canvas.toDataURL('image/png', 1.0);

            // Add new page for slides after the first
            if (i > 0) {
                pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], 'landscape');
            }

            // Add image to PDF
            pdf.addImage(imgData, 'PNG', 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
        }

        onProgress?.({
            current: slideElements.length,
            total: slideElements.length,
            status: 'generating',
            message: 'Génération du PDF...'
        });

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

    } finally {
        // Cleanup render container
        if (renderContainer.parentNode) {
            renderContainer.parentNode.removeChild(renderContainer);
        }
    }
};

/**
 * Gets all slide elements from the presentation
 * This function should be called from the Editor component
 */
export const getSlideElements = (containerSelector: string = '[data-slide-content]'): HTMLElement[] => {
    return Array.from(document.querySelectorAll(containerSelector)) as HTMLElement[];
};
