import { useEffect, useRef, useState } from "react";
import { ModernSlideRenderer } from "@/components/slides/ModernSlideRenderer";

interface ProjectThumbnailProps {
    presentation: any;
    className?: string;
}

export function ProjectThumbnail({ presentation, className }: ProjectThumbnailProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2); // Default fallback

    // Robust data extraction
    // presentation is typically the DB row
    // presentation.slides is the JSON payload containing the actual deck data
    const deckData = presentation.slides || {};
    const slides = Array.isArray(deckData) ? deckData : (deckData.slides || []);
    const firstSlide = slides[0];

    // Theme can be at root (DB column) or inside deck data
    const theme = presentation.theme || deckData.theme || "startup-pitch";

    // Color palette usually inside deck data
    const colorPalette = deckData.colorPalette || deckData.colorScheme;

    useEffect(() => {
        if (!containerRef.current) return;

        const updateScale = () => {
            if (!containerRef.current) return;
            const { width } = containerRef.current.getBoundingClientRect();
            if (width === 0) return;
            // Target width is 1920
            const newScale = width / 1920;
            setScale(newScale);
        };

        const observer = new ResizeObserver(updateScale);
        observer.observe(containerRef.current);
        updateScale(); // Initial

        return () => observer.disconnect();
    }, []);

    if (!firstSlide) {
        return (
            <div className={`w-full aspect-video bg-muted flex items-center justify-center text-muted-foreground ${className}`}>
                {/* Fallback to initials if passed or just empty */}
                <div className="text-4xl font-bold opacity-10">
                    {presentation.title?.charAt(0).toUpperCase() || "?"}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative w-full aspect-video overflow-hidden bg-surface ${className}`}
        >
            <div
                className="absolute top-0 left-0 origin-top-left"
                style={{
                    width: '1920px',
                    height: '1080px',
                    transform: `scale(${scale})`
                }}
            >
                <ModernSlideRenderer
                    slide={firstSlide}
                    theme={theme}
                    colorPalette={colorPalette}
                    className="w-full h-full pointer-events-none" // Disable interaction in preview
                />
            </div>
            {/* Transparent overlay to capture clicks/hover without interacting with slide elements */}
            <div className="absolute inset-0 z-10" />
        </div>
    );
}
