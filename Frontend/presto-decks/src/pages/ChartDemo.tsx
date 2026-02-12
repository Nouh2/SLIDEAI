import React from 'react';
import { ModernSlideRenderer } from "@/components/slides/ModernSlideRenderer";

const ChartDemoPage = () => {
    // Mock Data for New Chart Types
    const waterfallChart = {
        title: "EBITDA Bridge (Waterfall)",
        type: "waterfall",
        categories: ["Revenue", "COGS", "Gross Profit", "Opex", "EBITDA"],
        series: [{
            name: "Value",
            // Start (Total), Negative, Subtotal, Negative, End (Total)
            data: [100, -40, 60, -20, 40]
        }]
    };

    const stackedBarChart = {
        title: "Revenue Composition by Region (Stacked)",
        type: "stacked-bar",
        categories: ["Q1", "Q2", "Q3", "Q4"],
        series: [
            { name: "NA", data: [30, 40, 45, 50] },
            { name: "EMEA", data: [20, 25, 30, 35] },
            { name: "APAC", data: [10, 15, 20, 25] }
        ]
    };

    const horizontalBarChart = {
        title: "Top Performing Products (Horizontal)",
        type: "horizontal-bar",
        categories: ["Product A", "Product B", "Product C", "Product D", "Product E"],
        series: [{
            name: "Sales",
            data: [120, 95, 80, 60, 40]
        }]
    };

    const comboChart = {
        title: "Revenue vs Growth (Combo)",
        type: "combo",
        categories: ["2020", "2021", "2022", "2023", "2024"],
        // First series = Bar, Last series = Line (by default implementation logic)
        series: [
            { name: "Revenue ($M)", type: 'bar', data: [50, 60, 80, 110, 150] },
            { name: "Growth (%)", type: 'line', data: [10, 20, 33, 37, 36] }
        ]
    };

    const areaChart = {
        title: "User Growth Trend (Area)",
        type: "area",
        categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        series: [{
            name: "Users",
            data: [1000, 1500, 2200, 3500, 4800, 6000]
        }]
    };

    // Helper to wrap in slide object
    const createSlide = (chart: any, variation: string = 'default-container') => ({
        id: `demo-${chart.type}`,
        title: chart.title,
        type: 'chart',
        layout: 'chart',
        variation: variation,
        chart: chart,
        content: { chart: chart }, // Fallback
        theme: 'modern'
    });

    const colors = {
        primary: "#0F172A", // Slate 900
        secondary: "#3B82F6", // Blue 500
        accent: "#F59E0B", // Amber 500
        bg: "#F8FAFC", // Slate 50
        text: "#1E293B" // Slate 800
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 overflow-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">New "McKinsey Style" Chart Types Demo</h1>

            <div className="flex flex-col gap-16 max-w-[1200px] mx-auto pb-20">
                {/* Waterfall */}
                <div className="aspect-video bg-white shadow-xl rounded-xl overflow-hidden border">
                    <ModernSlideRenderer
                        slide={createSlide(waterfallChart, 'split-detail')}
                        theme="modern"
                        colorPalette={colors}
                    />
                </div>

                {/* Stacked Bar */}
                <div className="aspect-video bg-white shadow-xl rounded-xl overflow-hidden border">
                    <ModernSlideRenderer
                        slide={createSlide(stackedBarChart, 'default-container')}
                        theme="modern"
                        colorPalette={colors}
                    />
                </div>

                {/* Horizontal Bar */}
                <div className="aspect-video bg-white shadow-xl rounded-xl overflow-hidden border">
                    <ModernSlideRenderer
                        slide={createSlide(horizontalBarChart, 'minimal-stat')}
                        theme="modern"
                        colorPalette={colors}
                    />
                </div>

                {/* Combo */}
                <div className="aspect-video bg-white shadow-xl rounded-xl overflow-hidden border">
                    <ModernSlideRenderer
                        slide={createSlide(comboChart, 'floating-card')}
                        theme="modern"
                        colorPalette={colors}
                    />
                </div>

                {/* Area */}
                <div className="aspect-video bg-white shadow-xl rounded-xl overflow-hidden border">
                    <ModernSlideRenderer
                        slide={createSlide(areaChart, 'full-bleed-hero')}
                        theme="modern"
                        colorPalette={{ ...colors, bg: '#0F172A', text: '#F8FAFC' }} // Dark mode for full bleed
                    />
                </div>
            </div>
        </div>
    );
};

export default ChartDemoPage;
