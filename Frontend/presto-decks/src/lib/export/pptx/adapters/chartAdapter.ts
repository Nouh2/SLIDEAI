// src/lib/export/pptx/adapters/chartAdapter.ts
// Adapter for chart slides using native PptxGenJS charts

import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, toHex, SLIDE_WIDTH, SLIDE_HEIGHT } from '../types';

// Map our chart types to PptxGenJS chart types
const CHART_TYPE_MAP: Record<string, pptxgen.CHART_NAME> = {
    'bar': 'bar',
    'column': 'bar',
    'line': 'line',
    'pie': 'pie',
    'doughnut': 'doughnut',
    'area': 'area',
    'radar': 'radar',
};

export const chartAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        const hasChart = (
            (slide.chart?.data?.length > 0) ||
            (slide.chart?.categories?.length > 0) ||
            (slide.content?.chart?.data?.length > 0) ||
            (slide.content?.labels?.length > 0 && slide.content?.datasets?.length > 0)
        );
        return (type.includes('chart') || type.includes('graph')) && hasChart;
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
        } else if (chartData?.data && chartData?.categories) {
            // Simple format
            chartDataForPptx = [{
                name: 'Data',
                labels: chartData.categories,
                values: chartData.data.map((d: any) => d.value || d),
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
            // Fallback - add placeholder text
            pptxSlide.addText('Chart data not available', {
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

        // Chart colors
        const chartColors = [
            toHex(colors.primary),
            toHex(colors.secondary),
            toHex(colors.accent),
            '3B82F6', // Blue
            '10B981', // Green
            'F59E0B', // Amber
            'EF4444', // Red
        ];

        // Add chart
        pptxSlide.addChart(pptxChartType as pptxgen.CHART_NAME, chartDataForPptx, {
            x: 1,
            y: 1.3,
            w: SLIDE_WIDTH - 2,
            h: SLIDE_HEIGHT - 2,
            showLegend: true,
            legendPos: 'b',
            showTitle: false,
            chartColors: chartColors,
            valAxisTitle: '',
            catAxisTitle: '',
            dataLabelPosition: 'outEnd',
            showValue: pptxChartType === 'pie' || pptxChartType === 'doughnut',
            barGapWidthPct: 50,
        });
    },
};
