// apps/worker/src/renderers/index.ts
// Modular PPTX Slide Rendering Engine
// Each layout type maps to a dedicated render function

import PptxGenJS from 'pptxgenjs';
import type { ThemeConfig } from '../config/themes.js';
import type { Slide, SlideContent } from '../utils/sanitize.js';
import { cleanText } from '../utils/sanitize.js';

// Type alias for PptxGenJS slide
type PptxSlide = ReturnType<InstanceType<typeof PptxGenJS>['addSlide']>;
type Pptx = InstanceType<typeof PptxGenJS>;

/**
 * Render context passed to each renderer
 */
interface RenderContext {
    pptx: Pptx;
    pptxSlide: PptxSlide;
    slide: Slide;
    theme: ThemeConfig;
    slideIndex: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Strip # from hex color for PptxGenJS
 */
function hex(color: string): string {
    return color.replace('#', '');
}

/**
 * Add slide title with consistent styling
 */
function addTitle(
    ctx: RenderContext,
    x: number = 0.5,
    y: number = 0.5,
    w: number = 12.5,
    fontSize: number = 36,
    align: 'left' | 'center' | 'right' = 'left'
) {
    ctx.pptxSlide.addText(cleanText(ctx.slide.title), {
        x,
        y,
        w,
        h: 1,
        fontSize,
        bold: true,
        color: hex(ctx.theme.colors.text),
        fontFace: ctx.theme.fonts.heading,
        align,
    });
}

/**
 * Add bullets with consistent styling
 */
function addBullets(
    ctx: RenderContext,
    bullets: string[],
    x: number,
    y: number,
    w: number,
    h: number
) {
    if (!bullets || bullets.length === 0) return;

    const bulletItems = bullets.map((b) => ({
        text: cleanText(b),
        options: {
            fontSize: 18,
            color: hex(ctx.theme.colors.text),
            bullet: { type: 'bullet' as const },
            fontFace: ctx.theme.fonts.body,
            paraSpaceAfter: 8,
        },
    }));

    ctx.pptxSlide.addText(bulletItems, { x, y, w, h });
}

/**
 * Add accent bar decoration
 * Note: All dimensions must be numbers for this helper
 */
function addAccentBar(ctx: RenderContext, x: number, y: number, w: number, h: number) {
    ctx.pptxSlide.addShape('rect', {
        x,
        y,
        w,
        h,
        fill: { color: hex(ctx.theme.colors.accent) },
    });
}

/**
 * Add full-height accent bar (left edge)
 */
function addFullHeightAccentBar(ctx: RenderContext, x: number, w: number) {
    ctx.pptxSlide.addShape('rect', {
        x,
        y: 0,
        w,
        h: '100%',
        fill: { color: hex(ctx.theme.colors.accent) },
    });
}

// ============================================
// LAYOUT RENDERERS
// ============================================

/**
 * Cover/Hero slide - Opening slide with title, subtitle, key messages
 */
function renderCover(ctx: RenderContext) {
    const content = ctx.slide.content;

    // Background image with overlay if available
    if (ctx.slide.backgroundImage && !ctx.slide.backgroundImage.includes('placehold')) {
        ctx.pptxSlide.background = { path: ctx.slide.backgroundImage };
        ctx.pptxSlide.addShape('rect', {
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            fill: {
                color: ctx.theme.mode === 'dark' ? '000000' : 'FFFFFF',
                transparency: 40,
            },
        });
    }

    // Accent bar on left edge (full height)
    addFullHeightAccentBar(ctx, 0, 0.15);

    // Main title - large and bold
    ctx.pptxSlide.addText(cleanText(ctx.slide.title), {
        x: 1,
        y: 2,
        w: 11,
        h: 2,
        fontSize: 56,
        bold: true,
        color: hex(ctx.theme.colors.text),
        fontFace: ctx.theme.fonts.heading,
        align: 'left',
    });

    // Subtitle
    if (content.subtitle) {
        ctx.pptxSlide.addText(cleanText(content.subtitle), {
            x: 1,
            y: 4,
            w: 10,
            h: 0.8,
            fontSize: 24,
            color: hex(ctx.theme.colors.textSecondary),
            fontFace: ctx.theme.fonts.body,
        });
    }

    // Key messages as bullets
    if (content.bullets && content.bullets.length > 0) {
        addBullets(ctx, content.bullets.slice(0, 4), 1, 5, 10, 2);
    }
}

/**
 * Section divider slide - Bold title for section transitions
 */
function renderSection(ctx: RenderContext) {
    // Centered large title
    ctx.pptxSlide.addText(cleanText(ctx.slide.title), {
        x: 0,
        y: 2.5,
        w: '100%',
        h: 2,
        fontSize: 60,
        bold: true,
        color: hex(ctx.theme.colors.accent),
        fontFace: ctx.theme.fonts.heading,
        align: 'center',
    });

    // Decorative line below
    addAccentBar(ctx, 5.5, 4.8, 2.5, 0.1);
}

/**
 * Bullets slide - Standard content with bullet points
 */
function renderBullets(ctx: RenderContext) {
    const content = ctx.slide.content;

    addTitle(ctx);

    // Subtitle if present
    if (content.subtitle) {
        ctx.pptxSlide.addText(cleanText(content.subtitle), {
            x: 0.5,
            y: 1.5,
            w: 8,
            h: 0.6,
            fontSize: 18,
            color: hex(ctx.theme.colors.textSecondary),
            fontFace: ctx.theme.fonts.body,
        });
    }

    // Two-column layout: image left, bullets right
    if (ctx.slide.backgroundImage && !ctx.slide.backgroundImage.includes('placehold')) {
        ctx.pptxSlide.addImage({
            path: ctx.slide.backgroundImage,
            x: 0.5,
            y: 2,
            w: 5,
            h: 4,
            sizing: { type: 'cover', w: 5, h: 4 },
        });
        addBullets(ctx, content.bullets || [], 6, 2, 6.5, 4);
    } else {
        // Full-width bullets
        addBullets(ctx, content.bullets || [], 0.5, 2, 12.5, 4.5);
    }
}

/**
 * Stats/KPI slide - Large numbers with labels
 */
function renderStats(ctx: RenderContext) {
    const content = ctx.slide.content;
    const stats = content.stats || [];

    addTitle(ctx, 0.5, 0.5, 12.5, 36, 'center');

    // Calculate grid layout
    const count = Math.min(stats.length, 4);
    const cols = count <= 2 ? count : Math.ceil(count / 2);
    const rows = count <= 2 ? 1 : 2;
    const colWidth = 12 / cols;

    stats.slice(0, 4).forEach((stat, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = 0.5 + col * colWidth;
        const y = 2 + row * 2.5;

        // Large value
        ctx.pptxSlide.addText(cleanText(stat.value), {
            x,
            y,
            w: colWidth - 0.5,
            h: 1.5,
            fontSize: 54,
            bold: true,
            color: hex(ctx.theme.colors.accent),
            fontFace: ctx.theme.fonts.heading,
            align: 'center',
        });

        // Label below
        ctx.pptxSlide.addText(cleanText(stat.label), {
            x,
            y: y + 1.3,
            w: colWidth - 0.5,
            h: 0.6,
            fontSize: 18,
            color: hex(ctx.theme.colors.textSecondary),
            fontFace: ctx.theme.fonts.body,
            align: 'center',
        });
    });
}

/**
 * Chart slide - Bar, line, pie, donut, or area chart
 */
function renderChart(ctx: RenderContext) {
    const content = ctx.slide.content;
    const chart = content.chart;

    addTitle(ctx);

    if (!chart) return;

    // Map chart types to PptxGenJS chart types
    const chartTypeMap: Record<string, any> = {
        bar: 'bar',
        line: 'line',
        pie: 'pie',
        donut: 'doughnut',
        area: 'area',
    };

    const pptxChartType = chartTypeMap[chart.type] || 'bar';
    const chartColors = ctx.theme.colors.chartColors;

    // Prepare chart data
    const chartData = chart.series.map((series, idx) => ({
        name: series.name,
        labels: chart.categories,
        values: series.data,
    }));

    // Add chart
    if (pptxChartType === 'pie' || pptxChartType === 'doughnut') {
        // Pie/Donut charts need single series
        ctx.pptxSlide.addChart(pptxChartType, chartData.slice(0, 1), {
            x: 2,
            y: 1.8,
            w: 9.5,
            h: 4.8,
            chartColors: chartColors.map((c) => hex(c)),
            showLegend: true,
            legendPos: 'r',
            showTitle: !!chart.title,
            title: chart.title,
            titleColor: hex(ctx.theme.colors.text),
            titleFontSize: 14,
        });
    } else {
        // Bar, Line, Area charts
        ctx.pptxSlide.addChart(pptxChartType, chartData, {
            x: 0.5,
            y: 1.8,
            w: 12.5,
            h: 4.8,
            chartColors: chartColors.map((c) => hex(c)),
            showLegend: chartData.length > 1,
            legendPos: 'b',
            showTitle: !!chart.title,
            title: chart.title,
            titleColor: hex(ctx.theme.colors.text),
            titleFontSize: 14,
            catAxisTitle: '',
            valAxisTitle: '',
            catAxisLabelColor: hex(ctx.theme.colors.textSecondary),
            valAxisLabelColor: hex(ctx.theme.colors.textSecondary),
            catGridLine: { style: 'none' },
            valGridLine: { color: hex(ctx.theme.colors.surface), style: 'solid' },
        });
    }
}

/**
 * Table slide - Structured data in rows and columns
 */
function renderTable(ctx: RenderContext) {
    const content = ctx.slide.content;
    const table = content.table;

    addTitle(ctx);

    if (!table) return;

    // Prepare table data - header row + data rows
    const tableData: any[][] = [];

    // Header row
    tableData.push(
        table.columns.map((col) => ({
            text: cleanText(col),
            options: {
                bold: true,
                fill: { color: hex(ctx.theme.colors.accent) },
                color: ctx.theme.mode === 'dark' ? 'FFFFFF' : 'FFFFFF',
                fontSize: 14,
                fontFace: ctx.theme.fonts.heading,
                align: 'center',
                valign: 'middle',
            },
        }))
    );

    // Data rows
    table.rows.forEach((row, rowIdx) => {
        tableData.push(
            row.map((cell) => ({
                text: cleanText(cell),
                options: {
                    fill: {
                        color: hex(
                            rowIdx % 2 === 0 ? ctx.theme.colors.surface : ctx.theme.colors.background
                        ),
                    },
                    color: hex(ctx.theme.colors.text),
                    fontSize: 12,
                    fontFace: ctx.theme.fonts.body,
                    align: 'center',
                    valign: 'middle',
                },
            }))
        );
    });

    // Add table
    ctx.pptxSlide.addTable(tableData, {
        x: 0.5,
        y: 1.8,
        w: 12.5,
        colW: 12.5 / table.columns.length,
        rowH: 0.6,
        border: { type: 'solid', color: hex(ctx.theme.colors.surface), pt: 1 },
    });
}

/**
 * Timeline slide - Chronological steps or milestones
 */
function renderTimeline(ctx: RenderContext) {
    const content = ctx.slide.content;
    const timeline = content.timeline;

    addTitle(ctx);

    if (!timeline) return;

    const items = timeline.items.slice(0, 5);
    const itemWidth = 12 / items.length;

    // Horizontal line
    ctx.pptxSlide.addShape('line', {
        x: 0.5,
        y: 3.5,
        w: 12.5,
        h: 0,
        line: { color: hex(ctx.theme.colors.accent), width: 2 },
    });

    items.forEach((item, idx) => {
        const x = 0.5 + idx * itemWidth;

        // Circle node
        ctx.pptxSlide.addShape('ellipse', {
            x: x + itemWidth / 2 - 0.2,
            y: 3.3,
            w: 0.4,
            h: 0.4,
            fill: { color: hex(ctx.theme.colors.accent) },
        });

        // Date/Phase label above
        ctx.pptxSlide.addText(cleanText(item.date), {
            x,
            y: 2.3,
            w: itemWidth,
            h: 0.5,
            fontSize: 14,
            bold: true,
            color: hex(ctx.theme.colors.accent),
            fontFace: ctx.theme.fonts.heading,
            align: 'center',
        });

        // Title below
        ctx.pptxSlide.addText(cleanText(item.title), {
            x,
            y: 4,
            w: itemWidth,
            h: 0.5,
            fontSize: 16,
            bold: true,
            color: hex(ctx.theme.colors.text),
            fontFace: ctx.theme.fonts.heading,
            align: 'center',
        });

        // Description
        if (item.description) {
            ctx.pptxSlide.addText(cleanText(item.description), {
                x,
                y: 4.5,
                w: itemWidth,
                h: 0.8,
                fontSize: 12,
                color: hex(ctx.theme.colors.textSecondary),
                fontFace: ctx.theme.fonts.body,
                align: 'center',
            });
        }
    });
}

/**
 * Comparison slide - Side by side comparison (Before/After, Option A/B)
 */
function renderComparison(ctx: RenderContext) {
    const content = ctx.slide.content;
    const comparison = content.comparison;

    addTitle(ctx, 0.5, 0.5, 12.5, 36, 'center');

    if (!comparison) return;

    const renderSide = (
        side: { title: string; subtitle?: string; items: string[] },
        x: number,
        accent: boolean
    ) => {
        // Side header
        ctx.pptxSlide.addShape('roundRect', {
            x,
            y: 1.6,
            w: 5.8,
            h: 5,
            rectRadius: ctx.theme.shapes.borderRadius,
            fill: {
                color: hex(accent ? ctx.theme.colors.accent : ctx.theme.colors.surface),
                transparency: accent ? 10 : 0,
            },
            line: { color: hex(ctx.theme.colors.accent), width: accent ? 2 : 0.5 },
        });

        // Title
        ctx.pptxSlide.addText(cleanText(side.title), {
            x,
            y: 1.8,
            w: 5.8,
            h: 0.6,
            fontSize: 24,
            bold: true,
            color: hex(accent ? ctx.theme.colors.accent : ctx.theme.colors.text),
            fontFace: ctx.theme.fonts.heading,
            align: 'center',
        });

        // Subtitle
        if (side.subtitle) {
            ctx.pptxSlide.addText(cleanText(side.subtitle), {
                x,
                y: 2.4,
                w: 5.8,
                h: 0.4,
                fontSize: 14,
                color: hex(ctx.theme.colors.textSecondary),
                fontFace: ctx.theme.fonts.body,
                align: 'center',
            });
        }

        // Items
        const bulletY = side.subtitle ? 3 : 2.6;
        addBullets(ctx, side.items || [], x + 0.3, bulletY, 5.2, 3);
    };

    renderSide(comparison.left, 0.5, false);
    renderSide(comparison.right, 7.2, true);
}

/**
 * Infographic slide - Funnel, pyramid, or process visualization
 */
function renderInfographic(ctx: RenderContext) {
    const content = ctx.slide.content;
    const infographic = content.infographic;

    addTitle(ctx);

    if (!infographic) return;

    const steps = infographic.steps.slice(0, 5);

    if (infographic.type === 'funnel') {
        // Funnel visualization - trapezoids getting narrower
        steps.forEach((step, idx) => {
            const widthRatio = 1 - idx * 0.15;
            const w = 8 * widthRatio;
            const x = (13.5 - w) / 2;
            const y = 1.8 + idx * 1.1;

            ctx.pptxSlide.addShape('rect', {
                x,
                y,
                w,
                h: 0.9,
                fill: { color: hex(ctx.theme.colors.chartColors[idx % 5]) },
                line: { color: hex(ctx.theme.colors.background), width: 2 },
            });

            ctx.pptxSlide.addText(`${step.label}: ${step.value}`, {
                x,
                y,
                w,
                h: 0.9,
                fontSize: 16,
                bold: true,
                color: 'FFFFFF',
                fontFace: ctx.theme.fonts.body,
                align: 'center',
                valign: 'middle',
            });
        });
    } else if (infographic.type === 'pyramid') {
        // Pyramid - triangular layers
        steps.forEach((step, idx) => {
            const widthRatio = (idx + 1) / steps.length;
            const w = 10 * widthRatio;
            const x = (13.5 - w) / 2;
            const y = 1.8 + (steps.length - 1 - idx) * 1.1;

            ctx.pptxSlide.addShape('rect', {
                x,
                y,
                w,
                h: 0.9,
                fill: { color: hex(ctx.theme.colors.chartColors[idx % 5]) },
            });

            ctx.pptxSlide.addText(`${step.label}`, {
                x,
                y,
                w,
                h: 0.9,
                fontSize: 14,
                bold: true,
                color: 'FFFFFF',
                fontFace: ctx.theme.fonts.body,
                align: 'center',
                valign: 'middle',
            });
        });
    } else {
        // Process - horizontal steps with arrows
        const stepWidth = 11 / steps.length;
        steps.forEach((step, idx) => {
            const x = 1 + idx * stepWidth;

            // Step box
            ctx.pptxSlide.addShape('roundRect', {
                x,
                y: 2.5,
                w: stepWidth - 0.5,
                h: 2.5,
                rectRadius: 0.15,
                fill: { color: hex(ctx.theme.colors.chartColors[idx % 5]) },
            });

            // Step number
            ctx.pptxSlide.addText(`${idx + 1}`, {
                x,
                y: 2.6,
                w: stepWidth - 0.5,
                h: 0.6,
                fontSize: 24,
                bold: true,
                color: 'FFFFFF',
                fontFace: ctx.theme.fonts.heading,
                align: 'center',
            });

            // Step label
            ctx.pptxSlide.addText(cleanText(step.label), {
                x,
                y: 3.4,
                w: stepWidth - 0.5,
                h: 1.2,
                fontSize: 14,
                color: 'FFFFFF',
                fontFace: ctx.theme.fonts.body,
                align: 'center',
                valign: 'middle',
            });
        });
    }
}

/**
 * SWOT Analysis slide - Professional 2×2 matrix
 */
function renderSWOT(ctx: RenderContext) {
    const content = ctx.slide.content;
    const swot = content.swot;

    addTitle(ctx);

    if (!swot) return;

    const quadrants = [
        { title: 'Strengths', items: swot.strengths, color: '27AE60' },
        { title: 'Weaknesses', items: swot.weaknesses, color: 'E74C3C' },
        { title: 'Opportunities', items: swot.opportunities, color: '3498DB' },
        { title: 'Threats', items: swot.threats, color: 'F39C12' },
    ];

    quadrants.forEach((q, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = 0.8 + col * 5.8;
        const y = 1.8 + row * 2.7;
        const w = 5.3;
        const h = 2.4;

        // Quadrant background
        ctx.pptxSlide.addShape('roundRect', {
            x, y, w, h,
            rectRadius: 0.1,
            fill: { color: q.color, transparency: 85 },
            line: { color: q.color, width: 2 },
        });

        // Quadrant header
        ctx.pptxSlide.addText(q.title.toUpperCase(), {
            x: x + 0.2, y: y + 0.1, w: w - 0.4, h: 0.5,
            fontSize: 14,
            bold: true,
            color: q.color,
            fontFace: ctx.theme.fonts.heading,
        });

        // Quadrant items
        const items = (q.items || []).slice(0, 4);
        items.forEach((item, itemIdx) => {
            ctx.pptxSlide.addText(`• ${cleanText(item)}`, {
                x: x + 0.3, y: y + 0.55 + itemIdx * 0.42, w: w - 0.6, h: 0.4,
                fontSize: 11,
                color: hex(ctx.theme.colors.text),
                fontFace: ctx.theme.fonts.body,
            });
        });
    });
}

/**
 * Executive Summary slide - KPIs + key findings + next steps
 */
function renderExecutiveSummary(ctx: RenderContext) {
    const content = ctx.slide.content;

    addTitle(ctx);

    // KPIs row at top
    const stats = (content.stats || []).slice(0, 4);
    if (stats.length > 0) {
        const statWidth = 10 / stats.length;
        stats.forEach((stat: { value: string; label: string }, idx: number) => {
            const x = 1.5 + idx * statWidth;

            ctx.pptxSlide.addShape('roundRect', {
                x, y: 1.8, w: statWidth - 0.4, h: 1.2,
                rectRadius: 0.08,
                fill: { color: hex(ctx.theme.colors.chartColors[idx % 5]), transparency: 90 },
                line: { color: hex(ctx.theme.colors.chartColors[idx % 5]), width: 1.5 },
            });

            ctx.pptxSlide.addText(cleanText(stat.value), {
                x, y: 1.85, w: statWidth - 0.4, h: 0.6,
                fontSize: 22,
                bold: true,
                color: hex(ctx.theme.colors.chartColors[idx % 5]),
                fontFace: ctx.theme.fonts.heading,
                align: 'center',
            });

            ctx.pptxSlide.addText(cleanText(stat.label), {
                x, y: 2.5, w: statWidth - 0.4, h: 0.4,
                fontSize: 10,
                color: hex(ctx.theme.colors.textSecondary),
                fontFace: ctx.theme.fonts.body,
                align: 'center',
            });
        });
    }

    // Left column: Key Findings
    const bullets = (content.bullets || []).slice(0, 5);
    if (bullets.length > 0) {
        ctx.pptxSlide.addText('KEY FINDINGS', {
            x: 0.8, y: 3.3, w: 5.5, h: 0.4,
            fontSize: 12,
            bold: true,
            color: hex(ctx.theme.colors.accent),
            fontFace: ctx.theme.fonts.heading,
        });

        bullets.forEach((bullet: string, idx: number) => {
            ctx.pptxSlide.addText(`• ${cleanText(bullet)}`, {
                x: 1.0, y: 3.7 + idx * 0.45, w: 5.3, h: 0.4,
                fontSize: 11,
                color: hex(ctx.theme.colors.text),
                fontFace: ctx.theme.fonts.body,
            });
        });
    }

    // Right column: Next Steps
    const nextSteps = (content.nextSteps || []).slice(0, 5);
    if (nextSteps.length > 0) {
        ctx.pptxSlide.addText('NEXT STEPS', {
            x: 6.8, y: 3.3, w: 5.5, h: 0.4,
            fontSize: 12,
            bold: true,
            color: hex(ctx.theme.colors.accentSecondary),
            fontFace: ctx.theme.fonts.heading,
        });

        nextSteps.forEach((step: string, idx: number) => {
            ctx.pptxSlide.addText(`${idx + 1}. ${cleanText(step)}`, {
                x: 7.0, y: 3.7 + idx * 0.45, w: 5.3, h: 0.4,
                fontSize: 11,
                color: hex(ctx.theme.colors.text),
                fontFace: ctx.theme.fonts.body,
            });
        });
    }
}

/**
 * Quote slide - Large quote with attribution
 */
function renderQuote(ctx: RenderContext) {
    const content = ctx.slide.content;
    const quote = content.quote;

    if (!quote) {
        // Fallback to title as quote
        ctx.pptxSlide.addText(`"${cleanText(ctx.slide.title)}"`, {
            x: 1,
            y: 2.5,
            w: 11.5,
            h: 2,
            fontSize: 36,
            italic: true,
            color: hex(ctx.theme.colors.text),
            fontFace: ctx.theme.fonts.heading,
            align: 'center',
        });
        return;
    }

    // Large opening quote mark
    ctx.pptxSlide.addText('"', {
        x: 0.5,
        y: 1,
        w: 2,
        h: 2,
        fontSize: 120,
        color: hex(ctx.theme.colors.accent),
        fontFace: ctx.theme.fonts.heading,
        transparency: 50,
    });

    // Quote text
    ctx.pptxSlide.addText(cleanText(quote.text), {
        x: 1,
        y: 2.2,
        w: 11.5,
        h: 2.5,
        fontSize: 32,
        italic: true,
        color: hex(ctx.theme.colors.text),
        fontFace: ctx.theme.fonts.heading,
        align: 'center',
    });

    // Attribution
    if (quote.author) {
        ctx.pptxSlide.addText(`— ${cleanText(quote.author)}${quote.role ? `, ${quote.role}` : ''}`, {
            x: 1,
            y: 5,
            w: 11.5,
            h: 0.6,
            fontSize: 18,
            color: hex(ctx.theme.colors.textSecondary),
            fontFace: ctx.theme.fonts.body,
            align: 'center',
        });
    }
}

/**
 * Bento grid slide - Feature cards in a grid layout
 */
function renderBento(ctx: RenderContext) {
    const content = ctx.slide.content;
    const items = content.items || [];

    addTitle(ctx);

    const count = Math.min(items.length, 6);
    const cols = count <= 2 ? count : count <= 4 ? 2 : 3;
    const rows = Math.ceil(count / cols);
    const cardWidth = (12.5 - (cols - 1) * 0.3) / cols;
    const cardHeight = (4.5 - (rows - 1) * 0.3) / rows;

    items.slice(0, 6).forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = 0.5 + col * (cardWidth + 0.3);
        const y = 1.8 + row * (cardHeight + 0.3);

        // Card background
        ctx.pptxSlide.addShape('roundRect', {
            x,
            y,
            w: cardWidth,
            h: cardHeight,
            rectRadius: ctx.theme.shapes.borderRadius,
            fill: { color: hex(ctx.theme.colors.surface) },
            line: { color: hex(ctx.theme.colors.accent), width: 0.5 },
            shadow: ctx.theme.shapes.shadow
                ? { type: 'outer', blur: 4, offset: 2, angle: 45, opacity: 0.2 }
                : undefined,
        });

        // Item value (large)
        ctx.pptxSlide.addText(cleanText(item.value), {
            x: x + 0.2,
            y: y + 0.3,
            w: cardWidth - 0.4,
            h: cardHeight * 0.4,
            fontSize: 20,
            bold: true,
            color: hex(ctx.theme.colors.accent),
            fontFace: ctx.theme.fonts.heading,
            valign: 'middle',
        });

        // Item title
        ctx.pptxSlide.addText(cleanText(item.title), {
            x: x + 0.2,
            y: y + cardHeight * 0.5,
            w: cardWidth - 0.4,
            h: cardHeight * 0.4,
            fontSize: 14,
            color: hex(ctx.theme.colors.textSecondary),
            fontFace: ctx.theme.fonts.body,
        });
    });
}

/**
 * Image focus slide - Hero image with text overlay
 */
function renderImageFocus(ctx: RenderContext) {
    const content = ctx.slide.content;

    // Full-bleed background image
    if (ctx.slide.backgroundImage && !ctx.slide.backgroundImage.includes('placehold')) {
        ctx.pptxSlide.background = { path: ctx.slide.backgroundImage };
    }

    // Dark overlay for readability
    ctx.pptxSlide.addShape('rect', {
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
        fill: { color: '000000', transparency: 50 },
    });

    // Title
    ctx.pptxSlide.addText(cleanText(ctx.slide.title), {
        x: 1,
        y: 2.5,
        w: 11.5,
        h: 1.5,
        fontSize: 48,
        bold: true,
        color: 'FFFFFF',
        fontFace: ctx.theme.fonts.heading,
        align: 'center',
    });

    // Subtitle or text
    if (content.subtitle || content.text) {
        ctx.pptxSlide.addText(cleanText(content.subtitle || content.text || ''), {
            x: 1,
            y: 4.2,
            w: 11.5,
            h: 1,
            fontSize: 24,
            color: 'FFFFFF',
            fontFace: ctx.theme.fonts.body,
            align: 'center',
        });
    }
}

// ============================================
// RENDERER REGISTRY
// ============================================

/**
 * Map layout names to render functions
 */
const LAYOUT_RENDERERS: Record<string, (ctx: RenderContext) => void> = {
    cover: renderCover,
    'cover-hero': renderCover,
    hero: renderCover,
    section: renderSection,
    'section-divider': renderSection,
    divider: renderSection,
    bullets: renderBullets,
    content: renderBullets,
    'section-left': renderBullets,
    text: renderBullets,
    stats: renderStats,
    'stat-focus': renderStats,
    metrics: renderStats,
    kpi: renderStats,
    chart: renderChart,
    graph: renderChart,
    table: renderTable,
    data: renderTable,
    timeline: renderTimeline,
    process: renderTimeline,
    roadmap: renderTimeline,
    comparison: renderComparison,
    'before-after': renderComparison,
    versus: renderComparison,
    infographic: renderInfographic,
    funnel: renderInfographic,
    pyramid: renderInfographic,
    swot: renderSWOT,
    'swot-analysis': renderSWOT,
    'executive-summary': renderExecutiveSummary,
    'exec-summary': renderExecutiveSummary,
    summary: renderExecutiveSummary,
    quote: renderQuote,
    testimonial: renderQuote,
    bento: renderBento,
    'bento-grid': renderBento,
    grid: renderBento,
    features: renderBento,
    'image-focus': renderImageFocus,
    'full-image': renderImageFocus,
    splash: renderImageFocus,
};

/**
 * Get the appropriate renderer for a layout
 */
export function getRenderer(layout: string): (ctx: RenderContext) => void {
    const normalizedLayout = layout.toLowerCase().trim();
    return LAYOUT_RENDERERS[normalizedLayout] || renderBullets;
}

/**
 * Render a single slide using the appropriate layout renderer
 */
export function renderSlide(
    pptx: Pptx,
    slide: Slide,
    theme: ThemeConfig,
    slideIndex: number,
    masterName: string
): void {
    const pptxSlide = pptx.addSlide({ masterName });

    const ctx: RenderContext = {
        pptx,
        pptxSlide,
        slide,
        theme,
        slideIndex,
    };

    const renderer = getRenderer(slide.layout);
    renderer(ctx);

    // Add speaker notes if available
    // Add speaker notes if available
    const notes = slide.notes || slide.content?.notes;
    if (notes) {
        pptxSlide.addNotes(notes);
    }
}

/**
 * Define slide masters for a theme
 */
export function defineThemeMasters(pptx: Pptx, theme: ThemeConfig): void {
    const bg = hex(theme.colors.background);
    const acc = hex(theme.colors.accent);

    // Cover master - with decorative elements
    pptx.defineSlideMaster({
        title: 'MASTER_COVER',
        background: { color: bg },
        objects:
            theme.mode === 'dark'
                ? [
                    { rect: { x: 0, y: 0, w: '100%', h: '100%', fill: { color: bg } } },
                    {
                        rect: {
                            x: -2,
                            y: -2,
                            w: 5,
                            h: 5,
                            fill: { color: acc, transparency: 90 },
                            rotate: 45,
                        },
                    },
                    { rect: { x: 12, y: 6.5, w: 4, h: 0.15, fill: { color: acc } } },
                ]
                : [
                    // Light mode: decorative rounded rectangles (ellipse not supported in masters)
                    {
                        rect: {
                            x: 10,
                            y: -1,
                            w: 5,
                            h: 5,
                            fill: { color: acc, transparency: 92 },
                        },
                    },
                    {
                        rect: {
                            x: -1,
                            y: 5,
                            w: 3,
                            h: 3,
                            fill: { color: acc, transparency: 95 },
                        },
                    },
                ],
    });

    // Content master - clean with subtle accent
    pptx.defineSlideMaster({
        title: 'MASTER_CONTENT',
        background: { color: bg },
        objects:
            theme.mode === 'dark'
                ? [
                    { rect: { x: 0.5, y: 0.5, w: 1, h: 0.08, fill: { color: acc } } },
                    {
                        line: {
                            x: 12.8,
                            y: 0,
                            w: 0,
                            h: 7.5,
                            line: { color: acc, width: 2 },
                        },
                    },
                ]
                : [{ rect: { x: 0, y: 0, w: 0.15, h: '100%', fill: { color: acc } } }],
    });
}
