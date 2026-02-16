import { useEffect, useRef, useState } from "react";
import { ModernSlideRenderer } from "@/components/slides/ModernSlideRenderer";

interface ScalableSlidePreviewProps {
    slide: any;
    theme: string;
    colorPalette?: any;
    className?: string;
    titleFontScale?: number;
    textFontScale?: number;
}

export function ScalableSlidePreview({ slide, theme, colorPalette, className = "", titleFontScale, textFontScale }: ScalableSlidePreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2);

    useEffect(() => {
        if (!containerRef.current) return;

        const updateScale = () => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            if (width === 0 || height === 0) return;

            // Calculate scale to fit BOTH width and height (contain)
            const scaleX = width / 1920;
            const scaleY = height / 1080;
            const newScale = Math.min(scaleX, scaleY);

            setScale(newScale);
        };

        const observer = new ResizeObserver(updateScale);
        observer.observe(containerRef.current);

        // Initial calculation
        updateScale();

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
        >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    style={{
                        width: '1920px',
                        height: '1080px',
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                        flexShrink: 0
                    }}
                >
                    <ModernSlideRenderer
                        slide={slide}
                        theme={theme}
                        colorPalette={colorPalette}
                        titleFontScale={titleFontScale}
                        textFontScale={textFontScale}
                        className="w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
}
