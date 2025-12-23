import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModernSlideRenderer } from "@/components/slides/ModernSlideRenderer";
import { examples } from "@/data/examples";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";
import {
  Loader2,
  Download,
  Home,
  ChevronLeft,
  ChevronRight,
  Play,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { PresentationBuilderLoader } from "@/components/layout/PresentationBuilderLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Supabase client (using anon key for read-only)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dntcdhabtctfbylynlcr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGNkaGFidGN0ZmJ5bHlubGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDg1NTUsImV4cCI6MjA4MTYyNDU1NX0.9mtNdCOyR7qiEXjS0n7uC5Dq8hSS8s5gZ3wtxbre-R8";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to adapt API deck format to frontend format
const adaptDeck = (deck: any) => {
  return {
    id: deck.id || "generated",
    title: deck.title,
    subtitle: deck.subtitle,
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
    lastModified: new Date().toISOString(),
    slides: (deck.slides?.slides || deck.slides || []).map((s: any) => ({
      id: s.id || Math.random().toString(36).substr(2, 9),
      type: s.type || s.layout || "content",
      title: s.title,
      subtitle: s.subtitle || s.content?.subtitle,
      layout: s.layout || "title-top-bullets-bottom",

      // Background image from Unsplash
      backgroundImage: s.backgroundImage,

      // Legacy content fields
      bullets: s.content?.bullets || s.bullets || [],
      quote: s.content?.quote || s.quote,
      metrics: s.content?.metrics || s.metrics,
      columns: s.content?.columns || s.columns,
      description: s.content?.description || s.description,
      benefits: s.content?.benefits || s.benefits,

      // NEW: Rich content types
      chart: s.content?.chart || s.chart,
      table: s.content?.table || s.table,
      timeline: s.content?.timeline || s.timeline,
      infographic: s.content?.infographic || s.infographic,
      comparison: s.content?.comparison || s.comparison,
      stats: s.content?.stats || s.stats,
      items: s.content?.items || s.items,
      text: s.content?.text || s.text,

      // Pass through the entire content object as fallback
      content: s.content,

      // Illustration handling
      illustration: s.illustration || {
        type: "icon",
        iconName: "Sparkles",
        url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80"
      },

      notes: s.notes || "",
    })),
    theme: deck.theme || "startup-pitch",
    themeConfig: deck.themeConfig,
    colorScheme: deck.colorPalette || deck.colorScheme,
  };
};

// Map project IDs to examples for dev/test
const projectMap: Record<string, any> = {
  "deck-1": examples[0],
  "deck-2": examples[1],
  "deck-3": examples[2],
};

export default function Editor() {
  const { traceId } = useParams();
  const [searchParams] = useSearchParams();
  const presentationId = searchParams.get("id"); // Get ?id=UUID from URL
  const { toast } = useToast();

  // Refs
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // States
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string>("idle");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slideScale, setSlideScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentProject) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        if (selectedSlide < currentProject.slides.length - 1) {
          setSelectedSlide(prev => prev + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (selectedSlide > 0) {
          setSelectedSlide(prev => prev - 1);
        }
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentProject, selectedSlide]);

  // Handle Fullscreen events
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

      const container = slideContainerRef.current;
      const { width, height } = container.getBoundingClientRect();

      // Target 1920x1080
      const targetWidth = 1920;
      const targetHeight = 1080;

      // Add padding calculation
      const padding = isFullscreen ? 0 : 64; // No padding in fullscreen
      const availableWidth = width - padding;
      const availableHeight = height - padding;

      const scaleX = availableWidth / targetWidth;
      const scaleY = availableHeight / targetHeight;

      setSlideScale(Math.min(scaleX, scaleY));
    };

    const observer = new ResizeObserver(updateScale);
    if (slideContainerRef.current) {
      observer.observe(slideContainerRef.current);
    }

    updateScale();
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [isFullscreen]);

  // Data Fetching
  useEffect(() => {
    setError(null);

    // === MODE 1: Fetch by presentation ID from Supabase ===
    if (presentationId) {
      const fetchFromSupabase = async () => {
        setIsLoading(true);
        try {
          const { data, error: dbError } = await supabase
            .from('presentations')
            .select('*')
            .eq('id', presentationId)
            .single();

          if (dbError || !data) {
            setError("Présentation introuvable");
            setIsLoading(false);
            return;
          }

          // Adapt the data - slides might be nested in the 'slides' column
          const adapted = adaptDeck({
            id: data.id,
            title: data.title,
            slides: data.slides, // This is the full JSON stored
            theme: data.theme,
          });
          setCurrentProject(adapted);
          setIsLoading(false);
        } catch (err: any) {
          console.error("Supabase fetch error:", err);
          setError("Erreur lors du chargement");
          setIsLoading(false);
        }
      };

      fetchFromSupabase();
      return;
    }

    // === MODE 2: Mock data for dev/test ===
    if (traceId && projectMap[traceId]) {
      setCurrentProject(projectMap[traceId]);
      setIsLoading(false);
      return;
    }

    // === MODE 3: Poll job status (generation in progress) ===
    if (traceId) {
      const pollStatus = async () => {
        try {
          const res = await api.getJobStatus(traceId);
          setStatus(res.status);

          if (res.status === "succeeded" && res.deck) {
            setCurrentProject(adaptDeck(res.deck));
            setIsLoading(false);
            return true; // Stop polling
          } else if (res.status === "failed") {
            setIsLoading(false);
            setError(res.error || "Une erreur est survenue");
            return true; // Stop polling
          } else {
            // Still processing
            setIsLoading(true);
          }
          return false;
        } catch (err) {
          console.error("Polling error:", err);
          return false;
        }
      };

      // Poll immediately
      pollStatus();

      // Setup interval
      const interval = setInterval(async () => {
        const stop = await pollStatus();
        if (stop) clearInterval(interval);
      }, 2000);

      return () => clearInterval(interval);
    }

    // === MODE 4: No ID provided - fetch latest from Supabase ===
    const fetchLatest = async () => {
      setIsLoading(true);
      try {
        const { data, error: dbError } = await supabase
          .from('presentations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (dbError || !data) {
          setError("Aucune présentation trouvée");
          setIsLoading(false);
          return;
        }

        const adapted = adaptDeck({
          id: data.id,
          title: data.title,
          slides: data.slides,
          theme: data.theme,
        });
        setCurrentProject(adapted);
        setIsLoading(false);
      } catch (err: any) {
        console.error("Supabase fetch error:", err);
        setError("Erreur lors du chargement");
        setIsLoading(false);
      }
    };

    fetchLatest();
  }, [traceId, presentationId, toast]);

  const toggleFullscreen = () => {
    if (!editorContainerRef.current) return;

    if (!document.fullscreenElement) {
      editorContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleExportClick = () => {
    setIsExportDialogOpen(true);
  };

  const handleNotifyMe = () => {
    toast({
      title: "C'est noté !",
      description: "Vous serez prévenu dès que l'export sera disponible.",
    });
    setIsExportDialogOpen(false);
  };

  // Loading Screen
  if (isLoading || !currentProject) {
    if (error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
          <div className="text-center space-y-6 p-12 rounded-[2rem] bg-surface/50 backdrop-blur-xl border border-border shadow-2xl">
            <div className="relative inline-block">
              <AlertCircle className="h-16 w-16 text-destructive relative z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">Oops!</h2>
              <p className="text-muted-foreground">{error}</p>
              <Link to="/" className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden">
        <PresentationBuilderLoader status={status} />
      </div>
    );
  }

  return (
    <div
      ref={editorContainerRef}
      className="h-screen flex flex-col overflow-hidden font-sans bg-background text-foreground selection:bg-accent selection:text-foreground"
    >
      {/* 1. Header (Hidden in Fullscreen) */}
      {!isFullscreen && (
        <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/90 backdrop-blur-md z-50 shadow-sm shrink-0">
          <div className="flex items-center space-x-6">
            <Link to="/" className="group flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-all">
              <Home className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            <div className="h-6 w-px bg-[#E6E6E0]"></div>

            <div className="flex flex-col justify-center">
              <Input
                defaultValue={currentProject.title}
                readOnly
                className="h-6 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 w-64 text-foreground hover:text-primary transition-colors cursor-default"
              />
              <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                Ready to Present
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Removed Search, Undo/Redo, AI Assistant */}

            <Button
              onClick={toggleFullscreen}
              className="h-9 px-5 rounded-lg bg-primary hover:bg-[#1F1F1F] text-white shadow-lg shadow-primary/20 border border-border font-medium transition-all hover:scale-105"
            >
              <Play className="h-3.5 w-3.5 mr-2 fill-current" />
              Diaporama
            </Button>

            <div className="flex items-center gap-1">
              <Button
                onClick={handleExportClick}
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Export PowerPoint"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">

        {/* 2. Vertical Timeline (Left Sidebar) - Now displays all slides */}
        {!isFullscreen && (
          <div className="w-64 flex flex-col border-r border-border bg-surface/50 backdrop-blur-sm z-30">
            <div className="p-4 border-b border-border flex items-center justify-between bg-surface/80">
              <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Slides</span>
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{currentProject.slides.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 custom-scrollbar">
              {currentProject.slides.map((slide: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => setSelectedSlide(idx)}
                  className={`group relative cursor-pointer outline-none`}
                >
                  {/* Slide Number Indicator */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full transition-all duration-300 origin-left scale-x-0 group-hover:scale-x-100 mb-1" style={{ opacity: selectedSlide === idx ? 1 : undefined, transform: selectedSlide === idx ? 'scaleX(1)' : undefined }}></div>

                  <div className={`relative aspect-video w-full rounded-lg overflow-hidden border transition-all duration-200 ${selectedSlide === idx
                    ? "border-primary ring-2 ring-primary/10 shadow-lg scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:shadow-md"
                    }`}>
                    <div className="w-full h-full bg-surface relative pointer-events-none">
                      {/* Scaled preview of the slide */}
                      <div className="absolute top-0 left-0 w-[1920px] h-[1080px] origin-top-left" style={{ transform: `scale(${220 / 1920})` /* Approx scale for sidebar width */ }}>
                        <ModernSlideRenderer
                          slide={slide}
                          theme={currentProject.theme}
                          colorPalette={currentProject.colorScheme}
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between px-1">
                    <span className={`text-[10px] font-medium transition-colors ${selectedSlide === idx ? "text-primary" : "text-muted-foreground"}`}>
                      {idx + 1}. {slide.title || "Untitled Slide"}
                    </span>
                  </div>
                </div>
              ))}

              <div className="h-10"></div> {/* Spacer */}
            </div>
          </div>
        )}

        {/* 3. Main Canvas Area */}
        <div
          ref={slideContainerRef}
          className={`flex-1 relative overflow-hidden flex items-center justify-center ${isFullscreen ? 'bg-black' : 'bg-background/50 p-8'}`}
        >
          {/* Background Effects (only when not fullscreen) */}
          {!isFullscreen && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[80px]"></div>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]"></div>
            </div>
          )}

          {/* Render Slide */}
          <div
            className={`relative transition-transform duration-300 ease-out origin-center shadow-2xl ${isFullscreen ? '' : 'rounded-xl ring-1 ring-black/5'}`}
            style={{
              width: '1920px',
              height: '1080px',
              transform: `scale(${slideScale})`
            }}
          >
            <ModernSlideRenderer
              slide={currentProject.slides[selectedSlide]}
              theme={currentProject.theme}
              colorPalette={currentProject.colorScheme}
              className="w-full h-full bg-white"
            />
          </div>

          {/* Navigation Controls (Floating) */}
          {!isFullscreen && (
            <>
              <div className="absolute left-8 top-1/2 -translate-y-1/2">
                <Button
                  onClick={() => selectedSlide > 0 && setSelectedSlide(selectedSlide - 1)}
                  disabled={selectedSlide === 0}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-background/80 backdrop-blur shadow-lg hover:bg-primary hover:text-white transition-all disabled:opacity-0"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </div>

              <div className="absolute right-8 top-1/2 -translate-y-1/2">
                <Button
                  onClick={() => selectedSlide < currentProject.slides.length - 1 && setSelectedSlide(selectedSlide + 1)}
                  disabled={selectedSlide === currentProject.slides.length - 1}
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-background/80 backdrop-blur shadow-lg hover:bg-primary hover:text-white transition-all disabled:opacity-0"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              {/* Bottom Info Pill */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md text-xs font-medium shadow-sm border border-border flex items-center gap-3 text-muted-foreground cursor-default">
                <span>Slide {selectedSlide + 1} of {currentProject.slides.length}</span>
              </div>
            </>
          )}
        </div>

      </div>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-border bg-background/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              L'export PPTX arrive très bientôt !
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-foreground/80 leading-relaxed">
              On travaille jour et nuit pour vous offrir un export parfait.
              <br /><br />
              En attendant, profitez de la <strong>visionneuse plein écran</strong> pour vos présentations ou partagez votre <strong>lien unique</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button onClick={handleNotifyMe} className="w-full font-bold shadow-lg shadow-primary/20">
              Être prévenu de la sortie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

