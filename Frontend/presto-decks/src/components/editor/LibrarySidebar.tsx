import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Search,
    Bookmark,
    Trash2,
    GripVertical,
    Loader2,
    X,
    PlusCircle,
    Clock,
    Layout as LayoutIcon,
    Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ModernSlideRenderer } from "@/components/slides/ModernSlideRenderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";

interface LibrarySidebarProps {
    accessToken: string;
    onInsertSlide: (slide: any) => void;
    onClose: () => void;
    theme: string;
    colorPalette: any;
    fontConfig: any;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
    accessToken,
    onInsertSlide,
    onClose,
    theme,
    colorPalette,
    fontConfig,
}) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [slides, setSlides] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);

    // Get unique categories and types for filtering
    const categories = Array.from(new Set(slides.map(s => s.category).filter(Boolean))) as string[];
    const types = Array.from(new Set(slides.map(s => s.type).filter(Boolean))) as string[];

    const fetchLibrary = async () => {
        setIsLoading(true);
        try {
            const data = await api.getLibrarySlides(accessToken);
            setSlides(data);
        } catch (error) {
            console.error("Failed to fetch library slides:", error);
            toast({
                title: t("common.error"),
                description: "Failed to load your slide library.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (accessToken) {
            fetchLibrary();
        }
    }, [accessToken]);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this slide from your library?")) return;

        setIsDeleting(id);
        try {
            await api.deleteLibrarySlide(id, accessToken);
            setSlides(slides.filter((s) => s.id !== id));
            toast({
                title: "Deleted",
                description: "Slide removed from library.",
            });
        } catch (error) {
            toast({
                title: t("common.error"),
                description: "Failed to delete slide.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredSlides = slides.filter((slide) => {
        const matchesSearch =
            (slide.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (slide.content?.title || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = !selectedCategory || slide.category === selectedCategory;
        const matchesType = !selectedType || slide.type === selectedType;

        return matchesSearch && matchesCategory && matchesType;
    });

    return (
        <div className="flex flex-col h-full bg-surface border-l border-border shadow-2xl z-40 w-[320px] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <Bookmark className="w-4 h-4 text-primary" />
                        </div>
                        <h2 className="text-sm font-bold tracking-tight uppercase text-foreground">
                            My Slide Library
                        </h2>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search your library..."
                        className="pl-9 bg-muted/40 border-muted focus-visible:ring-primary/20 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Filters */}
                {(categories.length > 0 || types.length > 0) && (
                    <div className="mt-4 flex flex-col gap-2">
                        {categories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                        className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full border transition-all",
                                            selectedCategory === cat
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                        {types.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 border-t border-border/10 pt-2">
                                {types.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setSelectedType(selectedType === t ? null : t)}
                                        className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full border transition-all",
                                            selectedType === t
                                                ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                                                : "bg-background text-muted-foreground border-border hover:border-secondary/50"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                        {(selectedCategory || selectedType) && (
                            <Button
                                variant="link"
                                size="sm"
                                className="h-4 p-0 text-[10px] text-primary w-fit mt-1"
                                onClick={() => {
                                    setSelectedCategory(null);
                                    setSelectedType(null);
                                }}
                            >
                                Clear all filters
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                            <p className="text-xs text-muted-foreground animate-pulse">Loading your assets...</p>
                        </div>
                    ) : filteredSlides.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 px-4 border-2 border-dashed border-muted rounded-2xl">
                            <div className="p-3 rounded-full bg-muted">
                                <Bookmark className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">No slides found</p>
                                <p className="text-xs text-muted-foreground">
                                    {searchQuery ? "Try a different search term" : "Save slides from the Storyboard to see them here."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {filteredSlides.map((savedSlide) => (
                                    <DraggableLibraryItem
                                        key={savedSlide.id}
                                        savedSlide={savedSlide}
                                        theme={theme}
                                        colorPalette={colorPalette}
                                        fontConfig={fontConfig}
                                        onInsertSlide={onInsertSlide}
                                        onDelete={handleDelete}
                                        isDeleting={isDeleting === savedSlide.id}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer / Tip */}
            {!isLoading && slides.length > 0 && (
                <div className="p-3 bg-muted/30 border-t border-border mt-auto">
                    <p className="text-[9px] text-center text-muted-foreground font-medium uppercase tracking-wider">
                        Tip: Drag slides into the storyboard
                    </p>
                </div>
            )}
        </div>
    );
};

interface DraggableLibraryItemProps {
    savedSlide: any;
    theme: string;
    colorPalette: any;
    fontConfig: any;
    onInsertSlide: (slide: any) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    isDeleting: boolean;
}

const DraggableLibraryItem: React.FC<DraggableLibraryItemProps> = ({
    savedSlide,
    theme,
    colorPalette,
    fontConfig,
    onInsertSlide,
    onDelete,
    isDeleting
}) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `library-${savedSlide.id}`,
        data: {
            type: 'library-slide',
            slide: savedSlide.content
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : undefined;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md",
                isDragging && "opacity-50 ring-2 ring-primary"
            )}
            onClick={() => onInsertSlide(savedSlide.content)}
        >
            {/* Preview Section */}
            <div className="relative aspect-video w-full bg-muted/20 overflow-hidden pointer-events-none border-b border-border/50">
                <div
                    className="absolute inset-0 origin-top-left"
                    style={{ transform: "scale(0.15)", width: "1920px", height: "1080px" }}
                >
                    <ModernSlideRenderer
                        slide={savedSlide.content}
                        theme={theme}
                        colorPalette={colorPalette}
                        fontConfig={fontConfig}
                        className="w-full h-full"
                    />
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                    <Button variant="secondary" size="sm" className="rounded-full shadow-lg border border-primary/20 scale-90 group-hover:scale-100 transition-transform">
                        <PlusCircle className="mr-2 h-3.5 w-3.5" />
                        Insert Slide
                    </Button>
                </div>

                {/* Drag Handle Overlay (only visible on hover) */}
                <div className="absolute top-2 left-2 p-1.5 bg-background/80 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-border/50">
                    <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
            </div>

            {/* Info Section */}
            <div className="p-3 flex items-start justify-between gap-2 bg-background/50">
                <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-bold text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                        {savedSlide.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {savedSlide.category && (
                            <Badge variant="secondary" className="text-[8px] px-1 h-3.5 font-medium bg-primary/10 text-primary border-none">
                                {savedSlide.category}
                            </Badge>
                        )}
                        {savedSlide.type && (
                            <Badge variant="outline" className="text-[8px] px-1 h-3.5 font-normal text-muted-foreground border-muted-foreground/20">
                                {savedSlide.type}
                            </Badge>
                        )}
                        {/* <Badge variant="outline" className="text-[8px] px-1 h-3.5 font-normal text-muted-foreground border-muted-foreground/20">
                            {savedSlide.content?.layout?.split('-').join(' ') || "content"}
                        </Badge> */}
                        <div className="flex items-center text-[8px] text-muted-foreground whitespace-nowrap ml-auto">
                            <Clock className="w-2 h-2 mr-1" />
                            {new Date(savedSlide.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 opacity-0 group-hover:opacity-100 transition-all"
                                onClick={(e) => onDelete(savedSlide.id, e)}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p className="text-[10px]">Remove from library</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </motion.div>
    );
};

export default LibrarySidebar;
