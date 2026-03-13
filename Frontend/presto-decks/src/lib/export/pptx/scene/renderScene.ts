import pptxgen from 'pptxgenjs';
import type { SlideScene, SceneNode } from './types';

const toHex = (color?: string) => (color || '#000000').replace('#', '');
const POINTS_PER_INCH = 72;
const MIN_FIT_FONT_SIZE = 8;

const estimateWrappedLineCount = (text: string, maxCharsPerLine: number) => {
    const paragraphs = text.split(/\r?\n/);
    let lineCount = 0;

    paragraphs.forEach((paragraph) => {
        const words = paragraph.trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) {
            lineCount += 1;
            return;
        }

        let currentLineLength = 0;
        words.forEach((word) => {
            const nextLength = currentLineLength === 0
                ? word.length
                : currentLineLength + 1 + word.length;

            if (nextLength > maxCharsPerLine && currentLineLength > 0) {
                lineCount += 1;
                currentLineLength = word.length;
            } else {
                currentLineLength = nextLength;
            }
        });

        lineCount += 1;
    });

    return Math.max(1, lineCount);
};

const getRenderedFontSize = (node: Extract<SceneNode, { kind: 'text' }>) => {
    if (node.fit !== 'shrink') {
        return node.fontSize;
    }

    const text = (node.uppercase ? node.text.toUpperCase() : node.text).trim();
    if (!text) {
        return node.fontSize;
    }

    const marginInches = node.margin ?? 0;
    const usableWidthPts = Math.max(1, (node.w - (marginInches * 2)) * POINTS_PER_INCH);
    const usableHeightPts = Math.max(1, (node.h - (marginInches * 2)) * POINTS_PER_INCH);
    const widthSafetyFactor = node.align === 'center' ? 0.9 : 0.94;

    let fontSize = node.fontSize * 0.92;

    while (fontSize > MIN_FIT_FONT_SIZE) {
        const charWidth = fontSize * (node.bold ? 0.6 : 0.55) * (node.uppercase ? 1.04 : 1);
        const maxCharsPerLine = Math.max(4, Math.floor((usableWidthPts * widthSafetyFactor) / Math.max(1, charWidth)));
        const lineCount = estimateWrappedLineCount(text, maxCharsPerLine);
        const lineHeight = fontSize * (text.length > 120 ? 1.24 : 1.18);
        const estimatedHeight = lineCount * lineHeight;

        if (estimatedHeight <= usableHeightPts) {
            break;
        }

        fontSize -= 0.5;
    }

    return Math.max(MIN_FIT_FONT_SIZE, Math.round(fontSize * 10) / 10);
};

const renderShapeNode = (slide: pptxgen.Slide, node: Extract<SceneNode, { kind: 'shape' }>) => {
    slide.addShape(node.shape, {
        x: node.x,
        y: node.y,
        w: node.w,
        h: node.h,
        rotate: node.rotation,
        flipH: node.flipH,
        flipV: node.flipV,
        fill: node.fillColor
            ? { color: toHex(node.fillColor), transparency: node.fillTransparency ?? 0 }
            : undefined,
        line: node.lineColor || node.shape === 'line'
            ? {
                color: toHex(node.lineColor || node.fillColor || '#000000'),
                transparency: node.lineTransparency ?? 0,
                width: node.lineWidth ?? (node.shape === 'line' ? 0.75 : 0),
            }
            : { color: 'FFFFFF', transparency: 100, width: 0 },
    });
};

const renderTextNode = (slide: pptxgen.Slide, node: Extract<SceneNode, { kind: 'text' }>) => {
    // PowerPoint can show a buggy duplicate edit overlay for normAutofit text boxes.
    // Prefer fixed boxes over shrink autofit in editable export.
    const fit = node.fit === 'shrink' ? undefined : node.fit;
    const fontSize = getRenderedFontSize(node);

    slide.addText(node.uppercase ? node.text.toUpperCase() : node.text, {
        x: node.x,
        y: node.y,
        w: node.w,
        h: node.h,
        rotate: node.rotation,
        fontFace: node.fontFace,
        fontSize,
        bold: node.bold,
        italic: node.italic,
        color: toHex(node.color),
        align: node.align,
        valign: node.valign,
        fit,
        margin: node.margin ?? 0,
        transparency: node.transparency ?? 0,
        breakLine: node.breakLine,
    });
};

const renderImageNode = (slide: pptxgen.Slide, node: Extract<SceneNode, { kind: 'image' }>) => {
    const sizing = node.sizing
        ? {
            type: node.sizing,
            w: node.w,
            h: node.h,
            ...(node.sizing === 'crop'
                ? { x: node.cropX ?? 0, y: node.cropY ?? 0 }
                : {}),
        }
        : undefined;

    slide.addImage({
        x: node.x,
        y: node.y,
        w: node.w,
        h: node.h,
        rotate: node.rotation,
        transparency: node.transparency ?? 0,
        rounding: node.rounding,
        shadow: node.shadow,
        sizing,
        ...(node.data ? { data: node.data } : { path: node.path || '' }),
    });
};

const renderChartNode = (slide: pptxgen.Slide, node: Extract<SceneNode, { kind: 'chart' }>) => {
    slide.addChart(node.chartType as any, node.series, {
        x: node.x,
        y: node.y,
        w: node.w,
        h: node.h,
        chartColors: node.chartColors?.map(toHex),
        showLegend: node.options?.showLegend ?? true,
        legendPos: node.options?.legendPos,
        showTitle: node.options?.showTitle ?? false,
        showValue: node.options?.showValue ?? false,
        dataLabelPosition: node.options?.dataLabelPosition,
        barGrouping: node.options?.barGrouping,
        barDir: node.options?.barDir,
        valAxisLabelColor: node.options?.valAxisLabelColor ? toHex(node.options.valAxisLabelColor) : undefined,
        catAxisLabelColor: node.options?.catAxisLabelColor ? toHex(node.options.catAxisLabelColor) : undefined,
        legendColor: node.options?.legendColor ? toHex(node.options.legendColor) : undefined,
        valAxisLineShow: node.options?.valAxisLineShow,
        valGridLine: node.options?.valGridLineColor
            ? { color: toHex(node.options.valGridLineColor), style: 'dash', size: 0.5 }
            : undefined,
    } as any);
};

const renderTableNode = (slide: pptxgen.Slide, node: Extract<SceneNode, { kind: 'table' }>) => {
    const borderColor = toHex(node.borderColor || '#E5E7EB');
    const tableRows = [
        ...(node.columns?.length
            ? [node.columns.map((column, index) => ({
                text: column,
                options: {
                    bold: true,
                    color: toHex(node.headerColor || node.color),
                    fill: { color: toHex(node.headerFillColor || '#F3F4F6') },
                    border: { color: borderColor, pt: 0.5 },
                    align: node.alignments?.[index] || 'left',
                    margin: node.margin ?? 0.06,
                },
            }))]
            : []),
        ...node.rows.map((row, rowIndex) =>
            row.map((cell, cellIndex) => ({
                text: cell,
                options: {
                    color: toHex(node.color),
                    fill: rowIndex % 2 === 1 && node.rowStripeColor
                        ? { color: toHex(node.rowStripeColor) }
                        : undefined,
                    border: { color: borderColor, pt: 0.5 },
                    align: node.alignments?.[cellIndex] || 'left',
                    margin: node.margin ?? 0.06,
                },
            }))
        ),
    ];

    slide.addTable(tableRows as any, {
        x: node.x,
        y: node.y,
        w: node.w,
        fontFace: node.fontFace,
        fontSize: node.fontSize,
        color: toHex(node.color),
        colW: node.colWidths,
        rowH: node.rowHeights,
        margin: node.margin ?? 0.06,
        border: { color: borderColor, pt: 0.5 },
        autoPage: false,
    });
};

export const renderSceneToPptx = (pptxSlide: pptxgen.Slide, scene: SlideScene) => {
    pptxSlide.background = { color: toHex(scene.backgroundColor) };

    scene.nodes.forEach((node) => {
        if (node.kind === 'shape') {
            renderShapeNode(pptxSlide, node);
            return;
        }
        if (node.kind === 'text') {
            renderTextNode(pptxSlide, node);
            return;
        }
        if (node.kind === 'chart') {
            renderChartNode(pptxSlide, node);
            return;
        }
        if (node.kind === 'table') {
            renderTableNode(pptxSlide, node);
            return;
        }
        renderImageNode(pptxSlide, node);
    });
};
