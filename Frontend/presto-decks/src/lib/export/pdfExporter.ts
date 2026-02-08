// src/lib/export/pdfExporter.ts
// PDF export utility using html2canvas and jsPDF

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExportProgressCallback } from './types';

// Slide dimensions (16:9 aspect ratio)
const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;

// Export settings
const EXPORT_SETTINGS = {
    scale: 1.5,
    imageQuality: 0.85,
    captureDelay: 100,
};

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
 * Captures a single slide element
 */
const captureSlide = async (slideElement: HTMLElement): Promise<string> => {
    // Wait for images
    await waitForImages(slideElement);

    // Small delay for CSS
    await new Promise(resolve => setTimeout(resolve, EXPORT_SETTINGS.captureDelay));

    // Capture with html2canvas
    const canvas = await html2canvas(slideElement, {
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        scale: EXPORT_SETTINGS.scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 15000,
        windowWidth: SLIDE_WIDTH,
        windowHeight: SLIDE_HEIGHT,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
    });

    return canvas.toDataURL('image/jpeg', EXPORT_SETTINGS.imageQuality);
};

/**
 * Captures all slides sequentially
 */
const captureAllSlides = async (
    slideElements: HTMLElement[],
    onProgress?: ExportProgressCallback
): Promise<string[]> => {
    const results: string[] = [];

    for (let i = 0; i < slideElements.length; i++) {
        onProgress?.({
            current: i,
            total: slideElements.length,
            status: 'rendering',
            message: `Capture de la slide ${i + 1}/${slideElements.length}...`
        });

        try {
            const imageData = await captureSlide(slideElements[i]);
            results.push(imageData);
        } catch (error) {
            console.error(`Error capturing slide ${i + 1}:`, error);
            // Create fallback
            const canvas = document.createElement('canvas');
            canvas.width = SLIDE_WIDTH;
            canvas.height = SLIDE_HEIGHT;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
                ctx.fillStyle = '#333';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`Slide ${i + 1}`, SLIDE_WIDTH / 2, SLIDE_HEIGHT / 2);
            }
            results.push(canvas.toDataURL('image/jpeg', 0.8));
        }

        await new Promise(resolve => setTimeout(resolve, 30));
    }

    return results;
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
        const imageDataArray = await captureAllSlides(slideElements, onProgress);

        onProgress?.({
            current: slideElements.length,
            total: slideElements.length,
            status: 'generating',
            message: 'Génération du PDF...'
        });

        // Create PDF
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [SLIDE_WIDTH, SLIDE_HEIGHT],
            hotfixes: ['px_scaling'],
            compress: true,
        });

        for (let i = 0; i < imageDataArray.length; i++) {
            if (i > 0) {
                pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], 'landscape');
            }
            pdf.addImage(
                imageDataArray[i],
                'JPEG',
                0, 0,
                SLIDE_WIDTH, SLIDE_HEIGHT,
                undefined,
                'MEDIUM'
            );
        }

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
