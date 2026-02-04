import { Link } from 'react-router-dom';

export const LogoConcept = () => {
    return (
        <Link to="/" className="group flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Gradients */}
                <svg width="0" height="0">
                    <defs>
                        <linearGradient id="magicGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Icon */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-md transition-transform group-hover:scale-105"
                >
                    {/* Main Sheet Body */}
                    <path
                        d="M5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H16C17.1046 21 18 20.1046 18 19V8L13 3H5Z"
                        stroke="url(#magicGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover:fill-primary/5 transition-colors"
                    />

                    {/* The "Magic" Transformation (Pixels/Sparkles top right) */}
                    <path
                        d="M15 3V6C15 7.10457 15.8954 8 17 8H20"
                        stroke="url(#magicGradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-50"
                    />

                    {/* Sparkles / Pixels flying off */}
                    <rect x="19" y="4" width="2" height="2" rx="0.5" fill="url(#magicGradient)" className="animate-pulse" />
                    <rect x="21" y="7" width="1.5" height="1.5" rx="0.5" fill="url(#magicGradient)" className="animate-pulse delay-75" />
                    <rect x="17.5" y="2" width="1" height="1" rx="0.2" fill="url(#magicGradient)" opacity="0.8" />

                    {/* Star sparkle */}
                    <path
                        d="M21 1.5L21.5 2.5L22.5 3L21.5 3.5L21 4.5L20.5 3.5L19.5 3L20.5 2.5L21 1.5Z"
                        fill="url(#magicGradient)"
                        className="animate-pulse delay-150"
                    />
                </svg>
            </div>

            <span className="font-bold text-xl tracking-tight">
                <span className="text-zinc-900 dark:text-zinc-100">Slide</span>
                <span className="bg-gradient-to-r from-[hsl(var(--primary))] to-sky-500 bg-clip-text text-transparent">AI</span>
            </span>
        </Link>
    );
};
