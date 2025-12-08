import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModernSlideRenderer } from "@/components/slides/ModernSlideRenderer";
import { examples } from "@/data/examples";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Sparkles,
  Image as ImageIcon,
  Layout,
  Type,
  Shapes,
  Download,
  Share2,
  Plus,
  Home,
  Palette,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MoreHorizontal,
  Undo,
  Redo,
  Play,
  Settings,
  Search,
  X,
  PanelRightClose,
  PanelRightOpen
} from "lucide-react";

// Modern Light Palette - "Organic Minimalist"
const COLORS = {
  bg: "#F9F9F7",        // Soft Off-White / Warm Beige tint
  surface: "#FFFFFF",   // Pure White
  surfaceHighlight: "#F2F2F0", // Hover state (Warm Grey)
  border: "#E6E6E0",    // Subtle Warm Border
  primary: "#2D2D2A",   // Charcoal (Primary Action)
  accent: "#E8E8E3",    // Beige Accent
  text: "#1F1F1F",      // Near Black
  textMuted: "#8A8A85", // Warm Grey Text
  success: "#10B981",   // Emerald Green
};

// Helper to adapt API deck format to frontend format
const adaptDeck = (deck: any) => {
  return {
    id: "generated",
    title: deck.title,
    subtitle: deck.subtitle,
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
    lastModified: new Date().toISOString(),
    slides: deck.slides.map((s: any) => ({
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
    colorScheme: deck.colorScheme,
  };
};


// Map project IDs to examples
const projectMap: Record<string, any> = {
  "deck-1": examples[0],
  "deck-2": examples[1],
  "deck-3": examples[2],
};

export default function Editor() {
  const { traceId } = useParams();

  const getInitialProject = () => {
    if (traceId && projectMap[traceId]) {
      return projectMap[traceId];
    }
    return examples[0];
  };

  const [currentProject, setCurrentProject] = useState(getInitialProject());
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [showAiAssistant, setShowAiAssistant] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [status, setStatus] = useState<string>("idle");
  const [activeTab, setActiveTab] = useState<string>("design");
  const { toast } = useToast();

  // Scaling logic for WYSIWYG
  // Actually, let's use a proper ref and effect
  const containerRef = useState<HTMLDivElement | null>(null);
  const [slideScale, setSlideScale] = useState(1);

  // We need a ref that we can attach to the element
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerElement) return;

    const updateScale = () => {
      const { width, height } = containerElement.getBoundingClientRect();
      const targetWidth = 1920;
      const targetHeight = 1080;

      // Calculate scale to fit CONTAIN
      const scaleX = width / targetWidth;
      const scaleY = height / targetHeight;

      // Use the smaller scale to ensure it fits completely
      setSlideScale(Math.min(scaleX, scaleY));
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(containerElement);

    // Initial call
    updateScale();

    return () => observer.disconnect();
  }, [containerElement]);

  useEffect(() => {
    if (traceId && projectMap[traceId]) {
      setCurrentProject(projectMap[traceId]);
      setSelectedSlide(0);
    }
  }, [traceId]);

  useEffect(() => {
    if (traceId && !projectMap[traceId]) {
      const pollStatus = async () => {
        try {
          const res = await api.getJobStatus(traceId);
          setStatus(res.status);

          if (res.status === "succeeded" && res.deck) {
            setCurrentProject(adaptDeck(res.deck));
            setIsLoading(false);
            toast({
              title: "Génération terminée",
              description: "Votre présentation est prête !",
            });
            return true;
          } else if (res.status === "failed") {
            setIsLoading(false);
            toast({
              title: "Échec de la génération",
              description: res.error || "Une erreur est survenue",
              variant: "destructive",
            });
            return true;
          } else {
            setIsLoading(true);
          }
          return false;
        } catch (error) {
          console.error("Polling error:", error);
          setIsLoading(false);
          return false;
        }
      };

      pollStatus();
      const interval = setInterval(async () => {
        const stop = await pollStatus();
        if (stop) clearInterval(interval);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [traceId, toast]);

  const handleExportPowerPoint = async () => {
    setIsExporting(true);
    try {
      // Call export API
      const response = await api.exportPresentation({
        format: 'pptx',
        deck: {
          title: currentProject.title,
          subtitle: currentProject.subtitle,
          theme: currentProject.theme,
          colorScheme: {
            primary: '#4A90E2',
            secondary: '#2C5AA0',
            accent: '#E94E77',
          },
          slides: currentProject.slides,
        },
      });

      const traceId = response.traceId;

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const status = await api.getJobStatus(traceId);

        if (status.status === 'succeeded' && status.url) {
          // Handle relative URLs (dev mode)
          let downloadUrl = status.url;
          if (downloadUrl.startsWith('/')) {
            // Remove /v1 from API_BASE_URL if present to get root URL
            const apiRoot = API_BASE_URL.replace('/v1', '');
            downloadUrl = `${apiRoot}${downloadUrl}`;
          }

          // Download file using anchor tag to avoid popup blockers
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = downloadUrl.split('/').pop() || 'presentation.pptx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          console.log('Downloading from:', downloadUrl);

          toast({
            title: 'Téléchargement lancé',
            description: 'Votre présentation est en cours de téléchargement...',
          });

          break;
        } else if (status.status === 'failed') {
          throw new Error('Export failed');
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Export timeout');
      }
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center space-y-6 p-12 rounded-[2rem] bg-surface/50 backdrop-blur-xl border border-border shadow-2xl">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-accent blur-3xl rounded-full animate-pulse"></div>
            <Loader2 className="h-16 w-16 animate-spin text-primary relative z-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Creating Magic...</h2>
            <p className="text-muted-foreground">Crafting your presentation ({status})</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden font-sans bg-background text-foreground selection:bg-accent selection:text-foreground">

      {/* 1. Top Navigation Bar - Refined */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/90 backdrop-blur-md z-50 shadow-sm">
        <div className="flex items-center space-x-6">
          <Link to="/" className="group flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted transition-all">
            <Home className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>

          <div className="h-6 w-px bg-[#E6E6E0]"></div>

          <div className="flex flex-col justify-center">
            <Input
              defaultValue={currentProject.title}
              className="h-6 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0 w-64 text-foreground placeholder:text-muted-foreground/50 hover:text-primary transition-colors"
            />
            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              Saved just now
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search Command */}
          <div className="hidden md:flex items-center h-9 px-3 rounded-lg border border-border bg-surface/50 hover:border-primary/30 transition-colors cursor-text group">
            <Search className="h-3.5 w-3.5 mr-2 text-muted-foreground group-hover:text-foreground" />
            <span className="text-xs text-muted-foreground w-24">Search...</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">⌘K</span>
          </div>

          <div className="flex items-center bg-surface/50 rounded-lg p-1 border border-border">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
              <Undo className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
              <Redo className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="h-6 w-px bg-[#E6E6E0] mx-2"></div>

          <Button
            variant="ghost"
            onClick={() => setShowAiAssistant(!showAiAssistant)}
            className={`h-9 px-3 rounded-lg border transition-all duration-200 ${showAiAssistant ? 'bg-primary/5 border-primary/20 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            {showAiAssistant ? <PanelRightOpen className="h-4 w-4 mr-2" /> : <PanelRightClose className="h-4 w-4 mr-2" />}
            AI Assistant
          </Button>

          <Button className="h-9 px-5 rounded-lg bg-primary hover:bg-[#1F1F1F] text-white shadow-lg shadow-primary/20 border border-border font-medium transition-all hover:scale-105">
            <Play className="h-3.5 w-3.5 mr-2 fill-current" />
            Present
          </Button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleExportPowerPoint}
              disabled={isExporting}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
              title="Export PowerPoint"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* 1. Sidebar (Left Panel) - Breathable & Light */}
        <div className="w-16 flex flex-col items-center py-6 border-r border-border bg-surface/30 backdrop-blur-sm z-40">
          <div className="flex flex-col gap-6 w-full px-2">
            {[
              { id: "design", icon: Palette, label: "Design" },
              { id: "elements", icon: Shapes, label: "Elements" },
              { id: "text", icon: Type, label: "Text" },
              { id: "images", icon: ImageIcon, label: "Images" },
              { id: "magic", icon: Wand2, label: "Magic" },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTab(tool.id)}
                className={`group relative w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${activeTab === tool.id
                  ? "bg-primary/5 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <tool.icon className={`h-5 w-5 mb-1 ${activeTab === tool.id ? "stroke-[2.5px]" : "stroke-2"}`} />
                <span className="text-[9px] font-medium opacity-80">{tool.label}</span>

                {/* Active Indicator */}
                {activeTab === tool.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1"></div>

          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-2">
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {/* Context Panel (Slide-out) */}
        {activeTab && (
          <div className="w-60 border-r border-border bg-surface/50 backdrop-blur-sm flex flex-col animate-in slide-in-from-left-2 duration-300 z-30">
            <div className="p-5 border-b border-border">
              <h3 className="text-base font-semibold text-foreground capitalize flex items-center gap-2">
                {activeTab === 'magic' && <Wand2 className="h-4 w-4 text-primary" />}
                {activeTab === 'design' && <Palette className="h-4 w-4 text-primary" />}
                {activeTab === 'text' && <Type className="h-4 w-4 text-primary" />}
                {activeTab === 'elements' && <Shapes className="h-4 w-4 text-primary" />}
                {activeTab === 'images' && <ImageIcon className="h-4 w-4 text-primary" />}
                {activeTab}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Customize your content</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {activeTab === "design" && (
                <div className="grid grid-cols-1 gap-3">
                  {["Modern", "Minimal", "Bold", "Classic"].map((theme) => (
                    <button
                      key={theme}
                      className="w-full aspect-[4/3] rounded-xl border border-border bg-background hover:bg-muted hover:border-primary/20 transition-all group relative overflow-hidden flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      </div>
                      <span className="font-medium text-xs text-foreground">{theme}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "magic" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-border bg-gradient-to-b from-[#E6E6E0] to-transparent">
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Actions
                    </h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start border-border bg-surface/50 hover:bg-primary hover:text-white hover:border-[#348ADC] transition-all rounded-xl h-10 text-sm font-normal text-muted-foreground">
                        <Sparkles className="h-4 w-4 mr-2" /> Enhance Content
                      </Button>
                      <Button variant="outline" className="w-full justify-start border-border bg-surface/50 hover:bg-primary hover:text-white hover:border-[#348ADC] transition-all rounded-xl h-10 text-sm font-normal text-muted-foreground">
                        <ImageIcon className="h-4 w-4 mr-2" /> Generate Image
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {(activeTab !== 'design' && activeTab !== 'magic') && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <MoreHorizontal className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">More options coming soon</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col min-w-0 relative">

          {/* 4. Background & Workspace Layout - Radial Spotlight */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-[100px]"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
          </div>

          {/* 2. Timeline (Top Thumbnails) - Expanded & Clearer */}
          <div className="h-28 border-b border-border bg-surface/50 backdrop-blur-sm flex flex-col py-1 px-2 relative z-20 overflow-hidden">
            <div className="flex items-center justify-between mb-1 px-2">
              <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Timeline</span>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-5 w-5 rounded-md text-muted-foreground hover:bg-muted"><ChevronLeft className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-5 w-5 rounded-md text-muted-foreground hover:bg-muted"><ChevronRight className="h-3 w-3" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center space-x-3 px-2 pb-5 no-scrollbar">
              {currentProject.slides.map((slide, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedSlide(idx)}
                  className={`relative flex-shrink-0 cursor-pointer transition-all duration-300 group/slide ${selectedSlide === idx
                    ? "scale-105 z-10"
                    : "opacity-60 hover:opacity-100 hover:scale-105"
                    }`}
                  style={{ width: "106px", height: "60px" }}
                >
                  <div className={`w-full h-full rounded-lg overflow-hidden border transition-all duration-300 ${selectedSlide === idx
                    ? "border-[#348ADC] shadow-[0_0_20px_-5px_rgba(0,0,0,0.1)] ring-1 ring-primary/20"
                    : "border-border group-hover/slide:border-[#8A8A85]/50"
                    }`}>
                    <div className="w-full h-full bg-surface overflow-hidden relative">
                      <div className="absolute top-0 left-0 origin-top-left" style={{ transform: 'scale(0.0552)' }}>
                        <ModernSlideRenderer
                          slide={slide}
                          theme={currentProject.theme}
                          className="w-[1920px] h-[1080px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[8px] font-medium transition-all duration-300 ${selectedSlide === idx
                    ? "text-primary translate-y-0"
                    : "text-muted-foreground translate-y-1 opacity-0 group-hover/slide:opacity-100 group-hover/slide:translate-y-0"
                    }`}>
                    Slide {idx + 1}
                  </div>
                </div>
              ))}

              <button className="flex-shrink-0 w-10 h-[60px] rounded-lg border border-dashed border-border hover:border-primary/20 hover:bg-primary/5 transition-all flex items-center justify-center group/add">
                <Plus className="h-3 w-3 text-muted-foreground group-hover/add:text-primary transition-colors" />
              </button>
            </div>
          </div>

          {/* Canvas Area - Spacious & Focused */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 z-10">

            {/* Main Slide Card */}
            <div className="relative w-full max-w-6xl aspect-video transition-transform duration-500 ease-out flex items-center justify-center">
              {/* Soft Shadow Frame */}
              <div className="absolute -inset-4 bg-[#F9F9F7] rounded-[2rem] blur-xl -z-10"></div>

              <Card className="w-full h-full border-0 shadow-2xl rounded-xl overflow-hidden bg-white relative ring-1 ring-white/10">
                <CardContent className="p-0 h-full relative overflow-hidden" ref={setContainerElement}>
                  <div className="absolute top-1/2 left-1/2 origin-center" style={{ width: '1920px', height: '1080px', transform: `translate(-50%, -50%) scale(${slideScale})` }}>
                    <ModernSlideRenderer
                      slide={currentProject.slides[selectedSlide]}
                      theme={currentProject.theme}
                      className="w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Floating Navigation Controls */}
              <div className="absolute top-1/2 -left-16 -translate-y-1/2">
                <button
                  onClick={() => selectedSlide > 0 && setSelectedSlide(selectedSlide - 1)}
                  disabled={selectedSlide === 0}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-surface/80 backdrop-blur text-[#1F1F1F] shadow-lg flex items-center justify-center hover:bg-[#348ADC] hover:scale-110 transition-all disabled:opacity-0 disabled:cursor-not-allowed border border-[#1F1F1F]/10"
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>

              <div className="absolute top-1/2 -right-16 -translate-y-1/2">
                <button
                  onClick={() => selectedSlide < currentProject.slides.length - 1 && setSelectedSlide(selectedSlide + 1)}
                  disabled={selectedSlide === currentProject.slides.length - 1}
                  className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-surface/80 backdrop-blur text-[#1F1F1F] shadow-lg flex items-center justify-center hover:bg-[#348ADC] hover:scale-110 transition-all disabled:opacity-0 disabled:cursor-not-allowed border border-[#1F1F1F]/10"
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                </button>
              </div>
            </div>

            {/* Bottom Info Pill */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-surface/80 backdrop-blur-md text-xs font-medium shadow-lg flex items-center gap-3 border-l border-[#E6E6E0] text-[#8A8A85] hover:text-[#1F1F1F] transition-colors cursor-default z-50">
              <span>Slide {selectedSlide + 1} of {currentProject.slides.length}</span>
              <div className="h-3 w-px bg-[#F2F2F0]"></div>
              <button
                onClick={() => {
                  const elem = document.documentElement;
                  if (!document.fullscreenElement) {
                    elem.requestFullscreen().catch(err => {
                      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                    });
                  } else {
                    document.exitFullscreen();
                  }
                }}
                className="hover:text-[#2D2D2A] transition-colors"
                title="Toggle Fullscreen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. AI Assistant (Right Panel) - Collapsible & Translucent */}
        {showAiAssistant && (
          <div className="w-80 border-l border-[#E6E6E0] bg-surface/80 backdrop-blur-md flex flex-col animate-in slide-in-from-right-4 duration-300 z-30">
            <div className="p-5 flex items-center justify-between border-b border-[#E6E6E0]">
              <h3 className="font-semibold text-[#1F1F1F] flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-[#2D2D2A]" />
                AI Assistant
              </h3>
              <button onClick={() => setShowAiAssistant(false)} className="text-[#8A8A85] hover:text-[#1F1F1F] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="relative group">
                <Input
                  placeholder="Ask AI to edit..."
                  className="pr-10 rounded-xl border-[#348ADC]/30 bg-[#F9F9F7] h-11 text-sm focus-visible:ring-primary transition-all shadow-inner"
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#348ADC] text-white hover:bg-[#1F1F1F] transition-colors shadow-md">
                  <Wand2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A85]">Smart Suggestions</p>
                {[
                  { icon: "🎨", text: "Change color scheme", desc: "Try a darker theme" },
                  { icon: "📝", text: "Summarize text", desc: "Make it more concise" },
                  { icon: "🖼️", text: "Add illustration", desc: "Relevant to context" }
                ].map((item, i) => (
                  <button key={i} className="w-full text-left p-3 rounded-xl border border-[#E6E6E0] bg-white hover:bg-[#F2F2F0] hover:border-[#2D2D2A]/30 transition-all group">
                    <div className="flex items-start gap-3">
                      <span className="text-lg p-1.5 rounded-lg bg-[#F9F9F7] group-hover:bg-[#2D2D2A]/10 transition-colors">{item.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-[#1F1F1F] mb-0.5">{item.text}</p>
                        <p className="text-xs text-[#8A8A85]">{item.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
