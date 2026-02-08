// src/lib/export/pptx/adapters/chartAdapter.ts
// Adapter for chart slides - Matches frontend ChartLayout component

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex } from '../types';
import { LAYOUT, SLIDE, addGradientBackground, addSlideFooter } from '../layoutTokens';

// Map our chart types to PptxGenJS chart types
const CHART_TYPE_MAP: Record<string, pptxgen.CHART_NAME> = {
    'bar': 'bar',
    'column': 'bar',
    'line': 'line',
    'pie': 'pie',
    'doughnut': 'doughnut',
    'donut': 'doughnut',
    'area': 'area',
    'radar': 'radar',
};

export const chartAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        const hasChart = (
            (slide.chart?.data?.length > 0) ||
            (slide.chart?.categories?.length > 0) ||
            (slide.chart?.series?.length > 0) ||
            (slide.content?.chart?.data?.length > 0) ||
            (slide.content?.labels?.length > 0 && slide.content?.datasets?.length > 0)
        );
        return (type.includes('chart') || type.includes('graph')) && hasChart;
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // Add gradient background
        addGradientBackground(pptxSlide, colors, toHex);

        // Title
        if (slide.title) {
            pptxSlide.addText(slide.title, {
                x: LAYOUT.chart.title.x,
                y: LAYOUT.chart.title.y,
                w: SLIDE.WIDTH - (LAYOUT.chart.title.x * 2),
                h: 0.8,
                fontSize: LAYOUT.chart.title.fontSize,
                bold: true,
                fontFace: 'Arial',
                color: toHex(colors.text),
            });
        }

        // Extract chart data
        const chartData = slide.chart || slide.content?.chart || slide.content;

        // Determine chart type
        const chartTypeRaw = (chartData?.type || chartData?.chartType || 'bar').toLowerCase();
        const pptxChartType = CHART_TYPE_MAP[chartTypeRaw] || 'bar';

        // Build chart data for PptxGenJS
        let chartDataForPptx: Array<{ name: string; labels: string[]; values: number[] }> = [];

        if (chartData?.datasets && chartData?.labels) {
            // Recharts/Chart.js format
            chartDataForPptx = chartData.datasets.map((dataset: any, idx: number) => ({
                name: dataset.label || `Series ${idx + 1}`,
                labels: chartData.labels,
                values: dataset.data || [],
            }));
        } else if (chartData?.series && chartData?.categories) {
            // Series format with categories
            chartDataForPptx = chartData.series.map((series: any, idx: number) => ({
                name: series.name || `Series ${idx + 1}`,
                labels: chartData.categories,
                values: series.data || [],
            }));
        } else if (chartData?.data && chartData?.categories) {
            // Simple format
            chartDataForPptx = [{
                name: 'Data',
                labels: chartData.categories,
                values: chartData.data.map((d: any) => (typeof d === 'number' ? d : d.value || d)),
            }];
        } else if (chartData?.data && Array.isArray(chartData.data)) {
            // Array of objects with name/value
            const labels = chartData.data.map((d: any) => d.name || d.label || '');
            const values = chartData.data.map((d: any) => d.value || d.count || 0);
            chartDataForPptx = [{
                name: 'Data',
                labels,
                values,
            }];
        }

        if (chartDataForPptx.length === 0) {
            // Fallback - add placeholder
            pptxSlide.addShape('roundRect', {
                x: LAYOUT.chart.area.x,
                y: LAYOUT.chart.area.y,
                w: LAYOUT.chart.area.w,
                h: LAYOUT.chart.area.h,
                fill: { color: toHex(colors.bg), transparency: 80 },
                line: { color: toHex(colors.primary), width: 1, dashType: 'dash' },
                rectRadius: LAYOUT.radius['2xl'],
            });
            pptxSlide.addText('Chart data not available', {
                x: LAYOUT.chart.area.x,
                y: SLIDE.HEIGHT * 0.45,
                w: LAYOUT.chart.area.w,
                h: 0.8,
                fontSize: 24,
                fontFace: 'Arial',
                color: toHex(colors.text),
                transparency: 50,
                align: 'center',
            });
            return;
        }

        // Chart colors (matches frontend chartColors array)
        const chartColors = [
            toHex(colors.primary),
            toHex(colors.secondary),
            toHex(colors.accent),
            '10B981', // Green
            'F59E0B', // Amber
            'EF4444', // Red
            '8B5CF6', // Purple
        ];

        // Add chart with proper positioning
        pptxSlide.addChart(pptxChartType as pptxgen.CHART_NAME, chartDataForPptx, {
            x: LAYOUT.chart.area.x,
            y: LAYOUT.chart.area.y,
            w: LAYOUT.chart.area.w,
            h: LAYOUT.chart.area.h,
            showLegend: true,
            legendPos: 'b',
            showTitle: false,
            chartColors: chartColors,
            valAxisTitle: '',
            catAxisTitle: '',
            dataLabelPosition: 'outEnd',
            showValue: pptxChartType === 'pie' || pptxChartType === 'doughnut',
            barGapWidthPct: 40,
            // Styling to match frontend
            valAxisLabelColor: toHex(colors.text),
            catAxisLabelColor: toHex(colors.text),
            legendColor: toHex(colors.text),
            valAxisLineShow: false,
            valGridLine: { color: toHex(colors.text), style: 'dash', size: 0.5 },
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
