// src/lib/export/pdfExporter.ts
// PDF export utility using html2canvas and jsPDF

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExportProgressCallback } from './types';

// Slide dimensions (16:9 aspect ratio)
const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

// Export settings
/**
 * Waits for all images in an element to load
 */
const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
        });
    });
    await Promise.all(promises);
};



/**
 * Captures a single slide element as a base64 image
 */
export const captureSlide = async (slide: HTMLElement, scale: number = 2.0): Promise<string> => {
    // Wait for images
    await waitForImages(slide);

    // Small delay for CSS to settle
    await new Promise(resolve => setTimeout(resolve, 200));

    // Capture with html2canvas
    const canvas = await html2canvas(slide, {
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 30000,
        windowWidth: SLIDE_WIDTH,
        windowHeight: SLIDE_HEIGHT,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
            // Ensure fonts are available in cloned document
            const clonedSlide = clonedDoc.querySelector(`[data-slide-index="${slide.getAttribute('data-slide-index')}"]`);
            if (clonedSlide) {
                // Cast to any to access non-standard properties
                const style = (clonedSlide as HTMLElement).style as any;
                style.fontSmooth = 'always';
                style.webkitFontSmoothing = 'antialiased';
            }
        }
    });

    return canvas.toDataURL('image/jpeg', 0.90);
};

/**
 * Exports presentation slides to PDF
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
        // Create PDF immediately
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [SLIDE_WIDTH, SLIDE_HEIGHT],
            hotfixes: ['px_scaling'],
            compress: true,
        });

        // Use higher scale for better quality (2.0 = 2x resolution)
        const scale = 2.0;

        // Ensure fonts are loaded before starting
        await document.fonts.ready;

        for (let i = 0; i < slideElements.length; i++) {
            const slide = slideElements[i];

            onProgress?.({
                current: i,
                total: slideElements.length,
                status: 'rendering',
                message: `Export de la slide ${i + 1}/${slideElements.length}...`
            });

            try {
                const imageData = await captureSlide(slide, scale);

                if (i > 0) {
                    pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], 'landscape');
                }

                pdf.addImage(
                    imageData,
                    'JPEG',
                    0, 0,
                    SLIDE_WIDTH, SLIDE_HEIGHT,
                    undefined,
                    'FAST'
                );

            } catch (error) {
                console.error(`Error capturing slide ${i + 1}:`, error);

                // Add fallback error slide
                if (i > 0) pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], 'landscape');

                pdf.setFillColor(255, 255, 255);
                pdf.rect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT, 'F');
                pdf.setTextColor(255, 0, 0);
                pdf.setFontSize(24);
                pdf.text(`Erreur lors de l'export de la slide ${i + 1}`, 50, 50);
            }

            // Small delay between slides to prevent UI freeze
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        onProgress?.({
            current: slideElements.length,
            total: slideElements.length,
            status: 'generating',
            message: 'Finalisation du PDF...'
        });

        const sanitizedTitle = title.replace(/[^a-zA-Z0-9-_\s]/g, '').trim() || 'presentation';
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

export const getSlideElements = (containerSelector: string = '[data-slide-content]'): HTMLElement[] => {
    return Array.from(document.querySelectorAll(containerSelector)) as HTMLElement[];
};
