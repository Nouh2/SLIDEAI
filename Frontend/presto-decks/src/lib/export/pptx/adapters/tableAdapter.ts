// src/lib/export/pptx/adapters/tableAdapter.ts
// Adapter for table slides - Matches frontend TableLayout

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex } from '../types';
import { LAYOUT, SLIDE, addGradientBackground, addSlideFooter, getFontSize } from '../layoutTokens';

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
        // Add gradient background
        addGradientBackground(pptxSlide, colors, toHex);

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: LAYOUT.margin.px16,
                y: LAYOUT.margin.py12,
                w: SLIDE.WIDTH - (LAYOUT.margin.px16 * 2),
                h: 0.8,
                fontSize: LAYOUT.table.title.fontSize,
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
            pptxSlide.addShape('roundRect', {
                x: SLIDE.WIDTH * 0.2,
                y: SLIDE.HEIGHT * 0.35,
                w: SLIDE.WIDTH * 0.6,
                h: SLIDE.HEIGHT * 0.3,
                fill: { color: toHex(colors.bg), transparency: 80 },
                line: { color: toHex(colors.primary), dashType: 'dash' },
                rectRadius: LAYOUT.radius.xl,
            });
            pptxSlide.addText('Table data not available', {
                x: SLIDE.WIDTH * 0.2,
                y: SLIDE.HEIGHT * 0.45,
                w: SLIDE.WIDTH * 0.6,
                h: 0.8,
                fontSize: 24,
                fontFace: 'Arial',
                color: toHex(colors.text),
                transparency: 50,
                align: 'center',
            });
            return;
        }

        // Build table rows for PptxGenJS
        const tableRows: pptxgen.TableRow[] = [];

        // Header row with primary background
        if (headers.length > 0) {
            tableRows.push(
                headers.map((h: string) => ({
                    text: h,
                    options: {
                        fill: { color: toHex(colors.primary) },
                        color: 'FFFFFF',
                        bold: true,
                        fontSize: LAYOUT.table.headerSize,
                        fontFace: 'Arial',
                        align: 'center' as const,
                        valign: 'middle' as const,
                    },
                }))
            );
        }

        // Data rows with alternating backgrounds
        rows.forEach((row: string[], rowIdx: number) => {
            tableRows.push(
                row.map((cell: string, cellIdx: number) => ({
                    text: cell,
                    options: {
                        fill: {
                            color: rowIdx % 2 === 0 ? toHex(colors.bg) : 'F5F5F5',
                            transparency: rowIdx % 2 === 0 ? 50 : 0,
                        },
                        color: toHex(colors.text),
                        fontSize: LAYOUT.table.cellSize,
                        fontFace: 'Arial',
                        align: cellIdx === 0 ? 'left' as const : 'center' as const,
                        valign: 'middle' as const,
                    },
                }))
            );
        });

        // Calculate column widths
        const numCols = Math.max(headers.length, rows[0]?.length || 1);
        const tableMargin = LAYOUT.margin.px16;
        const tableWidth = SLIDE.WIDTH - (tableMargin * 2);
        const colWidth = tableWidth / numCols;
        const tableStartY = 1.6;

        // Add table with rounded corners effect
        pptxSlide.addTable(tableRows, {
            x: tableMargin,
            y: tableStartY,
            w: tableWidth,
            colW: Array(numCols).fill(colWidth),
            border: {
                type: 'solid',
                pt: 0.75,
                color: toHex(colors.text),
            },
            fontFace: 'Arial',
            autoPage: false,
            margin: [LAYOUT.table.cellPadding, LAYOUT.table.cellPadding * 2, LAYOUT.table.cellPadding, LAYOUT.table.cellPadding * 2],
        });

        // Footer
        addSlideFooter(pptxSlide, {
            title: slide.title,
            colors,
            toHex,
            showPageNumber: true,
        });
    },
};
