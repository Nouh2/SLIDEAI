import { useEffect, useRef } from "react";

export function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Animation state
        let animationFrameId: number;
        let time = 0;

        // Gradient colors (matching Snapdeck theme)
        const colors = {
            primary: { r: 99, g: 102, b: 241 },      // purple
            secondary: { r: 34, g: 197, b: 250 },    // cyan
            accent: { r: 168, g: 85, b: 247 },       // magenta
            warm: { r: 249, g: 115, b: 22 },         // orange
        };

        // Create radial gradient blob
        const createGradient = (
            x: number,
            y: number,
            r: number,
            opacity: number,
            color: { r: number; g: number; b: number }
        ) => {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`);
            gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.3})`);
            gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
            return gradient;
        };

        // Animation loop
        const animate = () => {
            time += 0.0003;

            // Clear canvas with gradient background
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            bgGradient.addColorStop(0, "rgba(15, 23, 42, 1)");
            bgGradient.addColorStop(0.5, "rgba(20, 29, 50, 0.95)");
            bgGradient.addColorStop(1, "rgba(15, 23, 42, 1)");
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw animated gradient blobs (Aurora effect)
            const blobs = [
                {
                    baseX: canvas.width * 0.15,
                    baseY: canvas.height * 0.25,
                    offsetX: Math.sin(time * 0.3) * 150,
                    offsetY: Math.cos(time * 0.25) * 120,
                    radius: 400,
                    color: colors.primary,
                    opacity: 0.15,
                },
                {
                    baseX: canvas.width * 0.85,
                    baseY: canvas.height * 0.35,
                    offsetX: Math.cos(time * 0.35) * 180,
                    offsetY: Math.sin(time * 0.28) * 150,
                    radius: 450,
                    color: colors.secondary,
                    opacity: 0.12,
                },
                {
                    baseX: canvas.width * 0.5,
                    baseY: canvas.height * 0.7,
                    offsetX: Math.sin(time * 0.32) * 140,
                    offsetY: Math.cos(time * 0.38) * 160,
                    radius: 420,
                    color: colors.accent,
                    opacity: 0.1,
                },
                {
                    baseX: canvas.width * 0.25,
                    baseY: canvas.height * 0.75,
                    offsetX: Math.cos(time * 0.33) * 120,
                    offsetY: Math.sin(time * 0.4) * 140,
                    radius: 380,
                    color: colors.warm,
                    opacity: 0.08,
                },
            ];

            // Draw each blob
            blobs.forEach((blob) => {
                const x = blob.baseX + blob.offsetX;
                const y = blob.baseY + blob.offsetY;
                const gradient = createGradient(x, y, blob.radius, blob.opacity, blob.color);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });

            // Add horizontal shimmer wave (similar to Snapdeck)
            const shimmerY = (Math.sin(time * 0.4) + 1) * canvas.height * 0.5;
            const shimmerGradient = ctx.createLinearGradient(
                0,
                shimmerY - 150,
                0,
                shimmerY + 150
            );
            shimmerGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
            shimmerGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.02)");
            shimmerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = shimmerGradient;
            ctx.fillRect(0, shimmerY - 150, canvas.width, 300);

            // Add diagonal light rays occasionally
            if (Math.sin(time * 0.5) > 0.8) {
                const rayGradient = ctx.createLinearGradient(
                    -canvas.width,
                    -canvas.height,
                    canvas.width * 2,
                    canvas.height * 2
                );
                const intensity = (Math.sin(time * 0.5) - 0.8) * 5;
                rayGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
                rayGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.01 * intensity})`);
                rayGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
                ctx.fillStyle = rayGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resizeCanvas);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
            {/* Canvas for animated gradients */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ display: "block" }}
            />

            {/* Floating "Slides" - Thematic Elements */}
            {/* Left Floating Slide */}
            <div className="absolute top-[25%] left-[5%] w-64 h-40 border border-white/10 rounded-2xl bg-white/[0.02] rotate-[-6deg] animate-float backdrop-blur-md shadow-lg" />

            {/* Right Floating Slide */}
            <div className="absolute top-[35%] right-[8%] w-72 h-48 border border-white/10 rounded-2xl bg-white/[0.02] rotate-[12deg] animate-float backdrop-blur-md shadow-lg" style={{ animationDelay: "2s" }} />

            {/* Bottom Center Slide */}
            <div className="absolute bottom-[15%] left-[30%] w-56 h-36 border border-white/10 rounded-2xl bg-white/[0.02] rotate-[-3deg] animate-float backdrop-blur-md shadow-lg opacity-60" style={{ animationDelay: "4s" }} />

            {/* Subtle Grid Overlay */}
            <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                    pointerEvents: 'none'
                }}
            />

            {/* Radial vignette fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background opacity-60" />
        </div>
    );
}
