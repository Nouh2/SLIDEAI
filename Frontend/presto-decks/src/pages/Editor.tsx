import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlideRenderer } from "@/components/slides/SlideRenderer";
import { examples } from "@/data/examples";
import {
  Sparkles,
  Image as ImageIcon,
  Layout,
  Type,
  Bold,
  Italic,
  Underline,
  Download,
  Share2,
  Plus,
  Trash2,
  Copy,
  MoveVertical,
  Settings,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Editor() {
  const [currentProject] = useState(examples[0]);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [showAiAssistant, setShowAiAssistant] = useState(true);

  return (
    <div className="min-h-screen flex flex-col">{/* Header removed - using global layout */}

      {/* Top Toolbar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">{currentProject.title}</h2>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Type className="h-4 w-4 mr-1" />
                  Text
                </Button>
                <Button variant="ghost" size="sm">
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Image
                </Button>
                <Button variant="ghost" size="sm">
                  <Layout className="h-4 w-4 mr-1" />
                  Layout
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAiAssistant(!showAiAssistant)}
                className="bg-gradient-to-r from-primary to-accent"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                AI Assistant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Slide Thumbnails Sidebar */}
        <div className="w-64 border-r border-border bg-card/30 backdrop-blur-sm overflow-y-auto">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {currentProject.slides.length} Slides
              </span>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {currentProject.slides.map((slide, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedSlide(idx)}
                className={`group relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                  selectedSlide === idx
                    ? "ring-2 ring-primary shadow-glow"
                    : "hover:ring-1 hover:ring-border"
                }`}
              >
                <div className="aspect-video bg-background/50">
                  <SlideRenderer
                    slide={slide}
                    theme={currentProject.theme}
                    className="scale-[0.25] origin-top-left w-[400%] h-[400%]"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{idx + 1}</span>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Typography Toolbar */}
          <div className="border-b border-border bg-card/30 backdrop-blur-sm p-3">
            <div className="flex items-center space-x-4">
              <Select defaultValue="pretendard">
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pretendard">Pretendard</SelectItem>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="16">
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[12, 14, 16, 18, 20, 24, 32, 40].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}px
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border border-border rounded-md">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none border-l border-border">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-none border-l border-border">
                  <Underline className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-5xl mx-auto">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-premium">
                <CardContent className="p-0">
                  <SlideRenderer
                    slide={currentProject.slides[selectedSlide]}
                    theme={currentProject.theme}
                  />
                </CardContent>
              </Card>

              {/* Magic Actions */}
              <div className="mt-6 flex justify-center space-x-3">
                <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Magic Enhance
                </Button>
                <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Magic Visualize
                </Button>
                <Button variant="outline" className="border-primary/50 hover:bg-primary/10">
                  <Layout className="h-4 w-4 mr-2" />
                  Magic Layout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Sidebar */}
        {showAiAssistant && (
          <div className="w-80 border-l border-border bg-card/30 backdrop-blur-sm overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  AI Assistant
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAiAssistant(false)}
                >
                  ×
                </Button>
              </div>

              <Card className="border-border/50 bg-background/50">
                <CardContent className="p-3 space-y-2">
                  <p className="text-sm font-medium">Suggestions</p>
                  <div className="space-y-1">
                    <button className="w-full text-left text-xs p-2 rounded hover:bg-primary/10 transition-colors">
                      💡 Add visual to slide {selectedSlide + 1}
                    </button>
                    <button className="w-full text-left text-xs p-2 rounded hover:bg-primary/10 transition-colors">
                      ✨ Simplify bullet points
                    </button>
                    <button className="w-full text-left text-xs p-2 rounded hover:bg-primary/10 transition-colors">
                      🎨 Adjust layout for better flow
                    </button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Input
                  placeholder="Ask AI to modify this slide..."
                  className="bg-background/50"
                />
                <Button size="sm" className="w-full bg-gradient-to-r from-primary to-accent">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply
                </Button>
              </div>

              <Card className="border-border/50 bg-background/50">
                <CardContent className="p-3 space-y-2">
                  <p className="text-sm font-medium">Quick Commands</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>@addImage</span>
                      <span className="text-primary">Add image</span>
                    </div>
                    <div className="flex justify-between">
                      <span>@enhance</span>
                      <span className="text-primary">Improve text</span>
                    </div>
                    <div className="flex justify-between">
                      <span>@layout</span>
                      <span className="text-primary">Change layout</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
