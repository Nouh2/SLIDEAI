// src/lib/export/pptx/adapters/tableAdapter.ts
// Adapter for table slides using native PptxGenJS tables

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex, SLIDE_WIDTH, SLIDE_HEIGHT } from '../types';

export const tableAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        const hasTable = (
            (slide.table?.rows?.length > 0) ||
            (slide.content?.table?.rows?.length > 0) ||
            (slide.content?.headers?.length > 0 && slide.content?.rows?.length > 0)
        );
        return type.includes('table') && hasTable;
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Background
        pptxSlide.background = { color: toHex(colors.bg) };

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: 0.8,
                y: 0.4,
                w: SLIDE_WIDTH - 1.6,
                h: 0.7,
                fontSize: 32,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
            });
        }

        // Extract table data
        const tableData = slide.table || slide.content?.table || slide.content;
        const headers = tableData?.headers || [];
        const rows = tableData?.rows || [];

        if (rows.length === 0) {
            pptxSlide.addText('Table data not available', {
                x: 2,
                y: 3,
                w: SLIDE_WIDTH - 4,
                h: 1,
                fontSize: 24,
                fontFace: 'Arial',
                color: toHex(colors.text),
                align: 'center',
            });
            return;
        }

        // Build table rows for PptxGenJS
        const tableRows: pptxgen.TableRow[] = [];

        // Header row
        if (headers.length > 0) {
            tableRows.push(
                headers.map((h: string) => ({
                    text: h,
                    options: {
                        fill: { color: toHex(colors.primary) },
                        color: 'FFFFFF',
                        bold: true,
                        fontSize: 14,
                        fontFace: 'Arial',
                        align: 'center' as const,
                        valign: 'middle' as const,
                    },
                }))
            );
        }

        // Data rows
        rows.forEach((row: string[], rowIdx: number) => {
            tableRows.push(
                row.map((cell: string) => ({
                    text: cell,
                    options: {
                        fill: { color: rowIdx % 2 === 0 ? toHex(colors.bg) : 'F5F5F5' },
                        color: toHex(colors.text),
                        fontSize: 12,
                        fontFace: 'Arial',
                        align: 'left' as const,
                        valign: 'middle' as const,
                    },
                }))
            );
        });

        // Calculate column widths
        const numCols = Math.max(headers.length, rows[0]?.length || 1);
        const tableWidth = SLIDE_WIDTH - 2;
        const colWidth = tableWidth / numCols;

        // Add table
        pptxSlide.addTable(tableRows, {
            x: 1,
            y: 1.4,
            w: tableWidth,
            colW: Array(numCols).fill(colWidth),
            border: { type: 'solid', pt: 0.5, color: toHex(colors.text) },
            fontFace: 'Arial',
            autoPage: false,
        });
    },
};
