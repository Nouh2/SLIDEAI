import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Palette, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { examples, type Example } from "@/data/examples";
import { useToast } from "@/hooks/use-toast";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";

export default function Examples() {
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>("");
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { toast } = useToast();

  const themes = ["Modern-01", "Minimal-Grid", "Bold-Contrast"];

  const handleCopyPrompt = () => {
    if (selectedExample) {
      navigator.clipboard.writeText(selectedExample.prompt);
      setCopiedPrompt(true);
      toast({
        title: "Prompt copié",
        description: "Le prompt a été copié dans votre presse-papier",
      });
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  const handleOpenExample = (example: Example) => {
    setSelectedExample(example);
    setCurrentTheme(example.theme);
    setCurrentSlideIndex(0);
  };

  const handleChangeTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setCurrentTheme(themes[nextIndex]);
    toast({
      title: "Thème changé",
      description: `Nouveau thème : ${themes[nextIndex]}`,
    });
  };

  const handleNextSlide = () => {
    if (selectedExample && currentSlideIndex < selectedExample.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-6 mb-20">
            <div className="inline-flex items-center space-x-2 rounded-full glass px-6 py-3 text-sm mb-4">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="text-foreground/90 font-medium">Inspiré par l'IA</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="text-gradient-animated">Galerie</span> d'exemples
            </h1>
            <p className="text-xl md:text-2xl text-foreground/70 max-w-2xl mx-auto">
              Découvrez ce que vous pouvez créer avec SlideAI
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {examples.map((example, idx) => (
              <Card 
                key={idx} 
                className="card-premium cursor-pointer group/preview overflow-hidden"
                onClick={() => handleOpenExample(example)}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden">
                    <SlideThumbnail example={example} />
                  </div>
                  <div className="p-4 md:p-6 space-y-4">
                    <h3 className="font-bold text-xl md:text-2xl">
                      {example.title}
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                      {example.prompt}
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs md:text-sm font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded-full gradient-aurora text-white shadow-glow">
                        {example.slides.length} slides
                      </span>
                      <Button size="sm" variant="outline">
                        Voir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={!!selectedExample} onOpenChange={() => setSelectedExample(null)}>
        <DialogContent className="max-w-7xl max-h-[95vh] w-[95vw] overflow-hidden flex flex-col p-0 card-premium card-static">
          <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-white/10">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-xl md:text-3xl font-bold text-gradient truncate">{selectedExample?.title}</DialogTitle>
              <Button 
                onClick={handleChangeTheme}
                variant="outline"
                size="sm"
                className="gap-2 shrink-0"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Changer de style</span>
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row gap-4 md:gap-6 p-4 md:p-6">
            {/* Main slide viewer */}
            <div className="flex-1 flex flex-col gap-3 md:gap-4">
              <div className="flex-1 relative rounded-lg overflow-hidden shadow-2xl min-h-[300px] md:min-h-[400px]">
                {selectedExample && selectedExample.slides[currentSlideIndex] && (
                  <div className="[&_*]:hover:translate-x-0 [&_*]:hover:translate-y-0 [&_*]:hover:scale-100 pointer-events-none select-none">
                    <SlideRenderer 
                      slide={selectedExample.slides[currentSlideIndex]} 
                      theme={currentTheme}
                    />
                  </div>
                )}
              </div>
              
              {/* Navigation */}
              <div className="flex items-center justify-between gap-2 md:gap-4">
                <Button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Précédent</span>
                </Button>
                
                <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                  {currentSlideIndex + 1} / {selectedExample?.slides.length}
                </span>
                
                <Button
                  onClick={handleNextSlide}
                  disabled={!selectedExample || currentSlideIndex === selectedExample.slides.length - 1}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </div>

              {/* Thumbnail navigation */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {selectedExample?.slides.map((slide, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`flex-shrink-0 w-24 h-16 md:w-32 md:h-20 rounded border-2 overflow-hidden ${
                      idx === currentSlideIndex ? 'border-primary shadow-lg' : 'border-border opacity-60'
                    }`}
                  >
                    <div className="scale-[0.25] origin-top-left w-[400%] h-[400%]">
                      <SlideRenderer slide={slide} theme={currentTheme} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Info sidebar */}
            <div className="w-full lg:w-80 flex flex-col gap-4 md:gap-6">
              <Card className="card-premium">
                <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-4">
                  <div>
                    <h4 className="font-bold mb-2 md:mb-3 flex items-center gap-2 text-base md:text-lg">
                      <Copy className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                      Prompt utilisé
                    </h4>
                    <p className="text-xs md:text-sm text-foreground/80 mb-3 md:mb-4 p-3 md:p-4 bg-black/30 rounded-2xl leading-relaxed border border-white/10">
                      {selectedExample?.prompt}
                    </p>
                    <Button 
                      onClick={handleCopyPrompt} 
                      className="w-full gradient-aurora shadow-glow"
                      variant="default"
                      size="sm"
                    >
                      {copiedPrompt ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copier le prompt
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 md:pt-6 space-y-2 md:space-y-3">
                  <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base">Informations</h4>
                  <div className="space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Thème actuel:</span>
                      <span className="font-medium">{currentTheme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre de slides:</span>
                      <span className="font-medium">{selectedExample?.slides.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slide actuelle:</span>
                      <span className="font-medium">{currentSlideIndex + 1}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
