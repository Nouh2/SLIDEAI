import { useEffect, useState, useRef } from "react";
import { SEO } from "@/components/common/SEO";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { supabase } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, Eye, ChevronLeft, ChevronRight, Home, Maximize2, Minimize2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModernSlideRenderer } from "@/components/slides/ModernSlideRenderer";

type ViewStatus = "loading" | "viewing" | "error" | "auth_required";

// Helper to adapt API deck format to frontend format (same as Editor)
const adaptDeck = (deck: any) => {
    const rootData = deck.slides?.slides ? deck.slides : deck;
    const slideItems = deck.slides?.slides || deck.slides || [];

    return {
        id: deck.id || "generated",
        title: deck.title || rootData.title,
        subtitle: deck.subtitle || rootData.subtitle,
        slides: slideItems.map((s: any, index: number) => ({
            id: s.id || `slide-${index}`,
            type: s.type || s.layout || "content",
            title: s.title,
            subtitle: s.subtitle || s.content?.subtitle,
            layout: s.layout || "title-top-bullets-bottom",
            backgroundImage: s.backgroundImage,
            imageSearchQuery: s.imageSearchQuery,
            bullets: s.bullets || s.content?.bullets || [],
            quote: s.quote || s.content?.quote,
            metrics: s.metrics || s.content?.metrics,
            columns: s.columns || s.content?.columns,
            description: s.description || s.content?.description,
            benefits: s.benefits || s.content?.benefits,
            chart: s.chart || s.content?.chart,
            table: s.table || s.content?.table,
            timeline: s.timeline || s.content?.timeline,
            infographic: s.infographic || s.content?.infographic,
            comparison: s.comparison || s.content?.comparison,
            stats: s.stats || s.content?.stats,
            items: s.items || s.content?.items,
            text: s.text || s.content?.text,
            variation: s.variation,
            content: s.content,
            illustration: s.illustration || {
                type: "icon",
                iconName: "Sparkles",
                url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80"
            },
            notes: s.notes || "",
        })),
        theme: deck.theme || rootData.theme || "startup-pitch",
        themeConfig: deck.themeConfig || rootData.themeConfig,
        colorScheme: deck.colorPalette || deck.colorScheme || rootData.colorPalette || rootData.colorScheme,
    };
};

export default function ViewPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const slideContainerRef = useRef<HTMLDivElement>(null);

    const [status, setStatus] = useState<ViewStatus>("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [project, setProject] = useState<any>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [slideScale, setSlideScale] = useState(1);
    const [showWatermark, setShowWatermark] = useState(false);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!project) return;

            if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
                if (currentSlideIndex < project.slides.length - 1) {
                    setCurrentSlideIndex(prev => prev + 1);
                }
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                if (currentSlideIndex > 0) {
                    setCurrentSlideIndex(prev => prev - 1);
                }
            } else if (e.key === "Escape") {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [project, currentSlideIndex]);

    // Fullscreen change handler
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    // Scale slide to fit container
    useEffect(() => {
        const updateScale = () => {
            if (!slideContainerRef.current) return;

            const { width, height } = slideContainerRef.current.getBoundingClientRect();

            // Guard against 0 dimensions (container not yet rendered)
            if (width === 0 || height === 0) return;

            const targetWidth = 1920;
            const targetHeight = 1080;

            const horizontalPadding = isFullscreen ? 0 : 160;
            const verticalPadding = isFullscreen ? 0 : 120;

            const availableWidth = width - horizontalPadding;
            const availableHeight = height - verticalPadding;

            const scaleX = availableWidth / targetWidth;
            const scaleY = availableHeight / targetHeight;

            const maxScale = isFullscreen ? 1 : 0.55;
            setSlideScale(Math.min(scaleX, scaleY, maxScale));
        };

        const observer = new ResizeObserver(updateScale);
        if (slideContainerRef.current) {
            observer.observe(slideContainerRef.current);
        }

        // Multiple timeouts to ensure we catch the layout after it stabilizes
        updateScale();
        setTimeout(updateScale, 50);
        setTimeout(updateScale, 150);
        setTimeout(updateScale, 300);
        window.addEventListener('resize', updateScale);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateScale);
        };
    }, [isFullscreen, project, status]);

    // Load presentation (supports both token route and ID query param)
    // Load presentation (supports both token route and ID query param)
    // Load presentation (supports both token route and ID query param)
    useEffect(() => {
        const loadPresentation = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const presentationId = searchParams.get("id");

            try {
                let presentationData: any;

                if (token) {
                    // Mode 1: Accessed via /view/:token - try PUBLIC endpoint first (no auth needed)
                    try {
                        presentationData = await api.getPublicPresentation(token);
                    } catch (publicError) {
                        // If public endpoint fails, try authenticated flow
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) {
                            setStatus("auth_required");
                            return;
                        }
                        const result = await api.joinViewOnlyPresentation(token, session.access_token);
                        presentationData = await api.getPresentation(result.presentationId, session.access_token);
                    }
                } else if (presentationId) {
                    // Mode 2: Accessed via /viewer?id=xxx - requires auth
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                        setStatus("auth_required");
                        return;
                    }
                    presentationData = await api.getPresentation(presentationId, session.access_token);
                } else {
                    setStatus("error");
                    setErrorMessage(t('join.invalidLink'));
                    return;
                }

                if (!presentationData) {
                    throw new Error("No presentation data received");
                }

                const adapted = adaptDeck({
                    id: presentationData.id,
                    title: presentationData.title,
                    slides: presentationData.slides,
                    theme: presentationData.theme,
                });

                setProject(adapted);
                setShowWatermark(presentationData.showWatermark ?? false);
                setStatus("viewing");
            } catch (error: any) {
                setStatus("error");
                setErrorMessage(error.message || t('view.accessError'));
            }
        };

        loadPresentation();
    }, [token, navigate]);

    const handleLogin = () => {
        const returnUrl = `/view/${token}`;
        navigate(`/auth?returnTo=${encodeURIComponent(returnUrl)}`);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const handlePrevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

    const handleNextSlide = () => {
        if (project && currentSlideIndex < project.slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    // Loading state
    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-6 p-12 rounded-[2rem] bg-surface/50 backdrop-blur-xl border border-border shadow-2xl max-w-md">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">{t('common.loading')}</h2>
                        <p className="text-muted-foreground">{t('view.fetching')}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Auth required state
    if (status === "auth_required") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-6 p-12 rounded-[2rem] bg-surface/50 backdrop-blur-xl border border-border shadow-2xl max-w-md">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Eye className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">{t('join.authRequiredTitle')}</h2>
                        <p className="text-muted-foreground">
                            {t('view.authRequiredMsg')}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button onClick={handleLogin} className="w-full">{t('auth.signIn')}</Button>
                        <Button variant="outline" onClick={handleLogin} className="w-full">{t('auth.signUp')}</Button>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (status === "error") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-6 p-12 rounded-[2rem] bg-surface/50 backdrop-blur-xl border border-border shadow-2xl max-w-md">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold">{t('join.oops')}</h2>
                        <p className="text-muted-foreground">{errorMessage}</p>
                    </div>
                    <Link to="/" className="inline-block">
                        <Button variant="outline">{t('editor.backHome')}</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const currentSlide = project?.slides?.[currentSlideIndex];

    // Viewing state
    return (
        <div
            ref={containerRef}
            className="h-screen flex flex-col overflow-hidden font-sans bg-background text-foreground"
        >
            <SEO
                title={project?.title || "Présentation SlideAI"}
                description={project?.subtitle || "Regardez cette présentation créée avec SlideAI."}
                url={`/view/${token}`}
                // Use the first slide's background or a default OG image if available
                image={project?.slides?.[0]?.backgroundImage || "/og-image.png"}
            />

            {/* Header (Hidden in Fullscreen) */}
            {!isFullscreen && (
                <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/90 backdrop-blur-md z-50 shadow-sm shrink-0">
                    <div className="flex items-center space-x-6">
                        <Link to="/dashboard" className="group flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-all">
                            <Home className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </Link>

                        <div className="h-6 w-px bg-border"></div>

                        <div className="flex flex-col justify-center">
                            <span className="text-sm font-semibold text-foreground">{project?.title || t('view.presentationDefaultTitle')}</span>
                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-2 mt-0.5">
                                <Eye className="w-3 h-3" />
                                {t('view.readOnlyMode')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">
                            {currentSlideIndex + 1} / {project?.slides?.length || 0}
                        </span>

                        <Button
                            onClick={toggleFullscreen}
                            className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-medium transition-all hover:scale-105"
                        >
                            <Play className="h-3.5 w-3.5 mr-2 fill-current" />
                            {t('editor.slideshow')}
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div ref={slideContainerRef} className="flex-1 flex items-center justify-center relative overflow-hidden bg-muted/30">
                {/* Navigation Left */}
                <button
                    onClick={handlePrevSlide}
                    disabled={currentSlideIndex === 0}
                    className={`absolute left-4 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-all ${currentSlideIndex === 0
                        ? "opacity-30 cursor-not-allowed"
                        : "bg-surface/80 backdrop-blur-sm border border-border hover:bg-surface hover:scale-110 shadow-lg"
                        }`}
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>

                {/* Slide */}
                <div
                    className="relative bg-white rounded-2xl shadow-2xl overflow-hidden"
                    style={{
                        width: `${1920 * slideScale}px`,
                        height: `${1080 * slideScale}px`,
                    }}
                >
                    <div
                        className="absolute top-0 left-0 w-[1920px] h-[1080px] origin-top-left"
                        style={{ transform: `scale(${slideScale})` }}
                    >
                        {currentSlide && (
                            <ModernSlideRenderer
                                slide={currentSlide}
                                theme={project.theme}
                                colorPalette={project.colorScheme}
                                className="w-full h-full"
                                showWatermark={showWatermark}
                            />
                        )}
                    </div>
                </div>

                {/* Navigation Right */}
                <button
                    onClick={handleNextSlide}
                    disabled={!project || currentSlideIndex === project.slides.length - 1}
                    className={`absolute right-4 z-20 w-12 h-12 rounded-full flex items-center justify-center transition-all ${!project || currentSlideIndex === project.slides.length - 1
                        ? "opacity-30 cursor-not-allowed"
                        : "bg-surface/80 backdrop-blur-sm border border-border hover:bg-surface hover:scale-110 shadow-lg"
                        }`}
                >
                    <ChevronRight className="h-6 w-6" />
                </button>

                {/* Fullscreen Exit Button */}
                {isFullscreen && (
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-all"
                    >
                        <Minimize2 className="h-5 w-5 text-white" />
                    </button>
                )}
            </div>

            {/* Bottom Navigation (Hidden in Fullscreen) */}
            {!isFullscreen && (
                <div className="h-16 flex items-center justify-center gap-2 border-t border-border bg-surface/50 shrink-0">
                    {project?.slides?.map((_: any, index: number) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlideIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentSlideIndex
                                ? "bg-primary scale-125"
                                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
