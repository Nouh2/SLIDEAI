import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function AnimatedBackground() {
    // Use simple state to trigger the mount animation
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-slate-950">
            {/* 
                Performance Note: 
                We use pure CSS animations for the background blobs to avoid 
                expensive JS/Canvas updates on every frame.
                The 'will-change-transform' CSS property is crucial here for GPU promotion.
            */}

            {/* Primary Blob (Purple/Blue) */}
            <div
                className="absolute top-[20%] left-[20%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-blob"
                style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.8)', // Primary
                    willChange: 'transform',
                }}
            />

            {/* Secondary Blob (Cyan) */}
            <div
                className="absolute top-[40%] right-[20%] w-[500px] h-[500px] rounded-full mix-blend-screen filter blur-[80px] opacity-20 animate-blob animation-delay-2000"
                style={{
                    backgroundColor: 'rgba(34, 197, 250, 0.8)', // Secondary
                    willChange: 'transform',
                }}
            />

            {/* Accent Blob (Purple/Pink) */}
            <div
                className="absolute -bottom-[10%] left-[30%] w-[600px] h-[600px] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-blob animation-delay-4000"
                style={{
                    backgroundColor: 'rgba(168, 85, 247, 0.8)', // Accent
                    willChange: 'transform',
                }}
            />

            {/* Warm Blob (Orange) */}
            <div
                className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full mix-blend-screen filter blur-[80px] opacity-10 animate-blob animation-delay-6000"
                style={{
                    backgroundColor: 'rgba(249, 115, 22, 0.6)', // Warm
                    willChange: 'transform',
                }}
            />

            {/* Floating Thematic Elements (Preserved from original) */}

            {/* Left Floating Slide */}
            <div className="absolute top-[25%] left-[5%] w-64 h-40 border border-white/10 rounded-2xl bg-white/[0.02] rotate-[-6deg] animate-float backdrop-blur-md shadow-lg" />

            {/* Right Floating Slide */}
            <div className="absolute top-[35%] right-[8%] w-72 h-48 border border-white/10 rounded-2xl bg-white/[0.02] rotate-[12deg] animate-float animation-delay-2000 backdrop-blur-md shadow-lg" />

            {/* Bottom Center Slide */}
            <div className="absolute bottom-[15%] left-[30%] w-56 h-36 border border-white/10 rounded-2xl bg-white/[0.02] rotate-[-3deg] animate-float animation-delay-4000 backdrop-blur-md shadow-lg opacity-60" />

            {/* Subtle Grid Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                    backgroundSize: '50px 50px',
                    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)'
                }}
            />

            {/* Radial vignette fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background opacity-80" />

            <style>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 10s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .animation-delay-6000 {
                    animation-delay: 6s;
                }
            `}</style>
        </div>
    );
}
