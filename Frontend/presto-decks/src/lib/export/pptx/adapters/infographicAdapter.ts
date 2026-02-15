import pptxgen from 'pptxgenjs';
import { LayoutAdapter, SlideData, ColorPalette, SLIDE_WIDTH, SLIDE_HEIGHT, TEXT_STYLES, toHex, getContrastColor } from '../types';

export const infographicAdapter: LayoutAdapter = {
    canHandle: (slide: SlideData) => {
        const type = (slide.type || slide.layout || '').toLowerCase();
        const hasInfographic = !!(
            slide.infographic?.steps ||
            slide.content?.infographic?.steps ||
            (slide.content?.steps && (type.includes('infographic') || type.includes('funnel') || type.includes('process') || type.includes('pyramid') || type.includes('cycle') || type.includes('hub')))
        );
        return (type.includes('infographic') || hasInfographic);
    },

    render: async (slide, pptxSlide, colors, pptx) => {
        // --- DATA RESOLUTION ---
        let infographic = slide.infographic || slide.content?.infographic;

        // Support AI format: type and steps directly in content
        if (!infographic && slide.content?.steps) {
            infographic = {
                type: slide.content.type || 'funnel',
                steps: slide.content.steps.map((step: any) => {
                    // Handle string steps from AI
                    if (typeof step === 'string') {
                        return { label: step, value: '' };
                    }
                    // Handle AI object format {title, description} -> {label, description}
                    if (step.title && !step.label) {
                        return { ...step, label: step.title };
                    }
                    if (step.title && !step.description && step.content) {
                        return { ...step, label: step.title, description: step.content };
                    }
                    return step;
                })
            };
        }

        const steps = infographic?.steps || [];
        const variation = slide.variation || infographic?.type || 'funnel';

        // --- BACKGROUND ---
        pptxSlide.background = { color: toHex(colors.bg) };

        // Abstract Shapes (Simplified for PPTX)
        pptxSlide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: SLIDE_WIDTH, h: SLIDE_HEIGHT,
            fill: { color: toHex(colors.bg) }
        });

        // --- TITLE ---
        pptxSlide.addText(slide.title, {
            x: 0.5, y: 0.5, w: SLIDE_WIDTH - 1, h: 1,
            fontSize: TEXT_STYLES.title.fontSize,
            fontFace: TEXT_STYLES.title.fontFace,
            bold: TEXT_STYLES.title.bold,
            color: toHex(colors.text),
            align: 'center'
        });

        // --- COLORS ---
        const getStepColor = (index: number) => {
            // We don't have access to the full chartColors array from the passed 'colors' object based on the interface
            // So we'll generate variations
            const palette = [colors.primary, colors.secondary, colors.accent];
            return palette[index % palette.length];
        };

        // --- RENDER VARIATIONS ---
        const centerY = SLIDE_HEIGHT / 2;
        const centerX = SLIDE_WIDTH / 2;

        if (variation === 'funnel') {
            const startY = 2.0;
            const totalHeight = SLIDE_HEIGHT - startY - 1;
            const stepHeight = totalHeight / Math.min(steps.length, 5);
            const maxW = 8;

            steps.slice(0, 5).forEach((step: any, i: number) => {
                const width = maxW - (i * 1.0);
                const x = (SLIDE_WIDTH - width) / 2;
                const y = startY + (i * stepHeight);
                const bgColor = getStepColor(i);
                const textColor = getContrastColor(bgColor);

                pptxSlide.addShape(pptx.ShapeType.roundRect, {
                    x: x, y: y, w: width, h: stepHeight - 0.2,
                    fill: { color: toHex(bgColor) },
                    rectRadius: 0.2
                });

                pptxSlide.addText(step.label, {
                    x: x, y: y + 0.1, w: width, h: 0.4,
                    fontSize: 18,
                    bold: true,
                    color: toHex(textColor),
                    align: 'center'
                });

                if (step.description) {
                    pptxSlide.addText(step.description, {
                        x: x, y: y + 0.5, w: width, h: stepHeight - 0.7,
                        fontSize: 12,
                        color: toHex(textColor),
                        transparency: 10,
                        align: 'center',
                        valign: 'top'
                    });
                }
            });
        }
        else if (variation === 'process') {
            const marginX = 1;
            const availableWidth = SLIDE_WIDTH - (marginX * 2);
            const gap = 0.2;
            const count = Math.min(steps.length, 5);
            const stepWidth = (availableWidth - (gap * (count - 1))) / count;
            const y = centerY - 1;
            const height = 2.5;

            steps.slice(0, 5).forEach((step: any, i: number) => {
                const x = marginX + (i * (stepWidth + gap));
                const bgColor = getStepColor(i);
                const textColor = getContrastColor(bgColor);

                pptxSlide.addShape(pptx.ShapeType.roundRect, {
                    x: x, y: y, w: stepWidth, h: height,
                    fill: { color: toHex(bgColor) },
                    rectRadius: 0.1
                });

                // Number
                pptxSlide.addText((i + 1).toString(), {
                    x: x, y: y + 0.2, w: stepWidth, h: 0.5,
                    fontSize: 32,
                    bold: true,
                    color: toHex(textColor),
                    transparency: 70,
                    align: 'center'
                });

                pptxSlide.addText(step.label, {
                    x: x + 0.1, y: y + 0.8, w: stepWidth - 0.2, h: 0.6,
                    fontSize: 14,
                    bold: true,
                    color: toHex(textColor),
                    align: 'center',
                    valign: 'middle'
                });

                if (step.description) {
                    pptxSlide.addText(step.description, {
                        x: x + 0.1, y: y + 1.5, w: stepWidth - 0.2, h: 0.8,
                        fontSize: 10,
                        color: toHex(textColor),
                        transparency: 10,
                        align: 'center',
                        valign: 'top'
                    });
                }

                // Connector
                if (i < count - 1) {
                    // small connector line
                    pptxSlide.addShape(pptx.ShapeType.line, {
                        x: x + stepWidth, y: y + (height / 2), w: gap, h: 0,
                        line: { color: toHex(colors.text), width: 2, transparency: 80 }
                    });
                }
            });
        }
        else if (variation === 'pyramid') {
            const startY = 2.0;
            const totalHeight = SLIDE_HEIGHT - startY - 1;
            const count = Math.min(steps.length, 5);
            const stepHeight = totalHeight / count;
            const minW = 3;
            const maxW = 8;

            // Reverse for pyramid (top is small)
            const reversedSteps = [...steps].slice(0, 5).reverse();

            reversedSteps.forEach((step: any, i: number) => {
                // Determine real index for color matching
                const realIndex = count - 1 - i;

                // Calculate width: top (i=0) is small, bottom is large
                const progress = i / (count - 1 || 1);
                const width = minW + (progress * (maxW - minW));

                const x = (SLIDE_WIDTH - width) / 2;
                const y = startY + (i * stepHeight);
                const bgColor = getStepColor(realIndex);
                const textColor = getContrastColor(bgColor);

                pptxSlide.addShape(pptx.ShapeType.roundRect, {
                    x: x, y: y, w: width, h: stepHeight - 0.1,
                    fill: { color: toHex(bgColor) },
                    rectRadius: 0.2
                });

                pptxSlide.addText(step.label, {
                    x: x, y: y + 0.1, w: width, h: 0.4,
                    fontSize: 16,
                    bold: true,
                    color: toHex(textColor),
                    align: 'center'
                });

                if (step.description) {
                    pptxSlide.addText(step.description, {
                        x: x, y: y + 0.5, w: width, h: stepHeight - 0.6,
                        fontSize: 11,
                        color: toHex(textColor),
                        transparency: 10,
                        align: 'center',
                        valign: 'top'
                    });
                }
            });
        }
        else if (variation === 'cycle-flow') {
            const radius = 2.5; // inches
            const count = Math.min(steps.length, 6);

            // Center label
            pptxSlide.addShape(pptx.ShapeType.ellipse, {
                x: centerX - 0.8, y: centerY - 0.8, w: 1.6, h: 1.6,
                fill: { color: toHex(colors.bg) },
                line: { color: toHex(colors.primary), width: 1, transparency: 60 }
            });
            pptxSlide.addText("CYCLE", {
                x: centerX - 0.8, y: centerY - 0.8, w: 1.6, h: 1.6,
                fontSize: 10, color: toHex(colors.text), align: 'center', valign: 'middle'
            });

            steps.slice(0, 6).forEach((step: any, i: number) => {
                const angle = (i * (360 / count)) - 90;
                const rad = (angle * Math.PI) / 180;
                const xUser = centerX + (radius * Math.cos(rad));
                const yUser = centerY + (radius * Math.sin(rad));

                const nodeW = 1.8;
                const nodeH = 1.2;
                const nodeX = xUser - (nodeW / 2);
                const nodeY = yUser - (nodeH / 2);

                const bgColor = getStepColor(i);
                const textColor = getContrastColor(bgColor);

                pptxSlide.addShape(pptx.ShapeType.roundRect, {
                    x: nodeX, y: nodeY, w: nodeW, h: nodeH,
                    fill: { color: toHex(bgColor) },
                    rectRadius: 0.1
                });

                // Number circle
                pptxSlide.addShape(pptx.ShapeType.ellipse, {
                    x: nodeX + (nodeW / 2) - 0.25, y: nodeY - 0.25, w: 0.5, h: 0.5,
                    fill: { color: toHex(colors.bg) },
                    line: { color: toHex(colors.text), width: 1 }
                });
                pptxSlide.addText((i + 1).toString(), {
                    x: nodeX + (nodeW / 2) - 0.25, y: nodeY - 0.25, w: 0.5, h: 0.5,
                    fontSize: 10, bold: true, color: toHex(colors.text), align: 'center', valign: 'middle'
                });

                pptxSlide.addText(step.label, {
                    x: nodeX + 0.1, y: nodeY + 0.3, w: nodeW - 0.2, h: 0.4,
                    fontSize: 11, bold: true, color: toHex(textColor), align: 'center'
                });
                if (step.description) {
                    pptxSlide.addText(step.description, {
                        x: nodeX + 0.1, y: nodeY + 0.6, w: nodeW - 0.2, h: 0.5,
                        fontSize: 9, color: toHex(textColor), align: 'center', valign: 'top'
                    });
                }
            });
        }
        else {
            // Default: Hub & Spoke (or Generic Fallback)
            // Use Hub & Spoke layout as it's versatile

            // Center Core
            const coreSize = 2.0;
            pptxSlide.addShape(pptx.ShapeType.ellipse, {
                x: centerX - (coreSize / 2), y: centerY - (coreSize / 2), w: coreSize, h: coreSize,
                fill: { color: toHex(colors.bg), transparency: 10 },
                line: { color: toHex(colors.primary), width: 2, transparency: 80 }
            });

            pptxSlide.addText(slide.title, {
                x: centerX - (coreSize / 2) + 0.2, y: centerY - (coreSize / 2) + 0.2, w: coreSize - 0.4, h: coreSize - 0.4,
                fontSize: 14, bold: true, color: toHex(colors.text), align: 'center', valign: 'middle'
            });

            const count = Math.min(steps.length, 6);
            const radius = 3.2;

            steps.slice(0, 6).forEach((step: any, i: number) => {
                const angle = (i * (360 / count)) - 90;
                const rad = (angle * Math.PI) / 180;
                // Spoke line
                const xInner = centerX + ((coreSize / 2) * Math.cos(rad));
                const yInner = centerY + ((coreSize / 2) * Math.sin(rad));
                const xOuter = centerX + ((radius - 1.2) * Math.cos(rad));
                const yOuter = centerY + ((radius - 0.8) * Math.sin(rad));

                pptxSlide.addShape(pptx.ShapeType.line, {
                    x: xInner, y: yInner, w: xOuter - xInner, h: yOuter - yInner,
                    line: { color: toHex(colors.primary), width: 2, transparency: 70 }
                });

                const nodeW = 2.2;
                const nodeH = 1.3;
                const nodeX = centerX + (radius * Math.cos(rad)) - (nodeW / 2);
                const nodeY = centerY + (radius * Math.sin(rad)) - (nodeH / 2);

                pptxSlide.addShape(pptx.ShapeType.roundRect, {
                    x: nodeX, y: nodeY, w: nodeW, h: nodeH,
                    fill: { color: 'FFFFFF' },
                    line: { color: toHex(colors.text), width: 0.5, transparency: 80 },
                    rectRadius: 0.1,
                    shadow: { type: 'outer', color: '000000', blur: 3, offset: 2, opacity: 0.2 }
                });

                // Badge
                pptxSlide.addShape(pptx.ShapeType.ellipse, {
                    x: nodeX + (nodeW / 2) - 0.2, y: nodeY - 0.2, w: 0.4, h: 0.4,
                    fill: { color: toHex(getStepColor(i)) }
                });
                pptxSlide.addText((i + 1).toString(), {
                    x: nodeX + (nodeW / 2) - 0.2, y: nodeY - 0.2, w: 0.4, h: 0.4,
                    fontSize: 10, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle'
                });

                pptxSlide.addText(step.label, {
                    x: nodeX + 0.1, y: nodeY + 0.2, w: nodeW - 0.2, h: 0.4,
                    fontSize: 12, bold: true, color: toHex(colors.text), align: 'center'
                });
                if (step.description) {
                    pptxSlide.addText(step.description, {
                        x: nodeX + 0.1, y: nodeY + 0.5, w: nodeW - 0.2, h: 0.6,
                        fontSize: 10, color: toHex(colors.text), transparency: 20, align: 'center', valign: 'top'
                    });
                }
            });
        }
    }
};
