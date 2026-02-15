import React, { useState } from 'react';
import {
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ModernSlideRenderer } from '@/components/slides/ModernSlideRenderer';
import { Button } from '@/components/ui/button';
import { Trash2, Wand2, GripVertical, ZoomIn, Layers, X, Info, Bookmark, Loader2, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from "@/lib/utils";
import { AiNarrativeFlowDialog } from './AiNarrativeFlowDialog';
import { NarrativeFlowSidebar } from './NarrativeFlowSidebar';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface StoryboardViewProps {
    slides: any[];
    theme: string;
    colorPalette: any;
    fontConfig?: any;
    accessToken?: string;
    onReorder: (newSlides: any[]) => void;
    onSelectSlide: (index: number) => void;
    onDeleteSlide: (index: number, e: React.MouseEvent) => void;
    onUpdateSlide?: (index: number, updates: any) => void;
}

// Sub-component for individual sortable slide
const SortableSlide = ({
    slide,
    index,
    theme,
    colorPalette,
    fontConfig,
    onSelect,
    onDelete,
    onToggleAppendix,
    onSaveToLibrary,
    isSavingToLibrary
}: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            id={`slide-${index}`}
            style={style}
            className={cn(
                "relative group flex flex-col list-none transition-all duration-500",
                isDragging && "z-50"
            )}
        >
            <div
                className={cn(
                    "relative aspect-video rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-all overflow-hidden group-hover:ring-2 group-hover:ring-primary/20",
                    slide.isAppendix && "grayscale-[0.5] opacity-80",
                    !isDragging && "cursor-grab active:cursor-grabbing"
                )}
                {...attributes}
                {...listeners}
                onDoubleClick={() => onSelect(index)}
            >
                <AutoScaledSlide
                    slide={slide}
                    theme={theme}
                    colorPalette={colorPalette}
                    fontConfig={fontConfig}
                />

                {/* Appendix Indicator */}
                {slide.isAppendix && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded text-[10px] font-bold border border-amber-200 dark:border-amber-800 z-10 flex items-center gap-1 shadow-sm">
                        <Layers className="w-3 h-3" />
                        Appendix
                    </div>
                )}

                {/* Interaction Overlay */}
                <div className="absolute inset-0 bg-transparent pointer-events-none" />

                {/* Actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-md shadow-sm bg-background/90 hover:bg-background text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSaveToLibrary(index);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        disabled={isSavingToLibrary === index}
                        title="Save to Library"
                    >
                        {isSavingToLibrary === index ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Bookmark className="w-4 h-4" />
                        )}
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-md shadow-sm bg-background/90 hover:bg-background",
                            slide.isAppendix ? "text-amber-600 hover:text-amber-700" : "text-muted-foreground hover:text-primary"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleAppendix(index);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        title={slide.isAppendix ? "Remove from Appendix (Move back to main flow)" : "Move to Appendix (Backup slides)"}
                    >
                        <Layers className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-md shadow-sm bg-background/90 hover:bg-background hover:text-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(index);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        title="Focus/Edit Slide"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-md shadow-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(index, e);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        title="Delete Slide"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Drag Handle Icon (Visual hint) */}
                <div className="absolute bottom-2 right-2 p-1 bg-background/80 backdrop-blur rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <GripVertical className="w-3 h-3 text-muted-foreground" />
                </div>

                {/* Slide Number */}
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 backdrop-blur rounded text-[10px] font-medium text-muted-foreground z-10 pointer-events-none">
                    {index + 1}
                </div>
            </div>

            <div className="mt-2 px-1">
                <h3 className="text-sm font-medium leading-none truncate opacity-90">{slide.title || "Untitled Slide"}</h3>
                <p className="text-xs text-muted-foreground mt-1 truncate">{slide.layout || "Content"}</p>
            </div>
        </div>
    );
};

// Helper component for scaled preview
const AutoScaledSlide = ({ slide, theme, colorPalette, fontConfig }: any) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(0.2);

    React.useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                setScale(width / 1920);
            }
        };

        updateScale();
        const observer = new ResizeObserver(updateScale);
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-white">
            <div
                style={{
                    width: 1920,
                    height: 1080,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none'
                }}
            >
                <ModernSlideRenderer
                    slide={slide}
                    theme={theme}
                    colorPalette={colorPalette}
                    fontConfig={fontConfig}
                    className="w-full h-full"
                />
            </div>
        </div>
    );
};

export const StoryboardView: React.FC<StoryboardViewProps> = ({
    slides,
    theme,
    colorPalette,
    fontConfig,
    accessToken,
    onReorder,
    onSelectSlide,
    onDeleteSlide,
    onUpdateSlide
}) => {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [isAiFlowDialogOpen, setIsAiFlowDialogOpen] = useState(false);
    const [isSavingToLibrary, setIsSavingToLibrary] = useState<number | null>(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [saveData, setSaveData] = useState({
        index: -1,
        name: "",
        category: "Generic",
        type: "Content"
    });

    const handleSaveToLibrary = (index: number) => {
        if (!accessToken) {
            toast({
                title: t("common.error"),
                description: "You must be logged in to save slides to your library.",
                variant: "destructive",
            });
            return;
        }

        const slide = slides[index];
        setSaveData({
            index,
            name: slide.title || `Slide ${index + 1}`,
            category: "Analysis",
            type: "Content"
        });
        setSaveDialogOpen(true);
    };

    const handleConfirmSave = async () => {
        const { index, name, category, type } = saveData;
        const slide = slides[index];

        setIsSavingToLibrary(index);
        setSaveDialogOpen(false);

        try {
            await api.saveSlideToLibrary(name || `Slide ${index + 1}`, slide, accessToken || "", category, type);
            toast({
                title: "Saved!",
                description: `"${name}" has been added to your slide library as ${category}/${type}.`,
            });
        } catch (error) {
            toast({
                title: t("common.error"),
                description: "Failed to save slide to library.",
                variant: "destructive",
            });
        } finally {
            setIsSavingToLibrary(null);
        }
    };



    const handleToggleAppendix = (index: number) => {
        if (onUpdateSlide) {
            onUpdateSlide(index, { isAppendix: !slides[index].isAppendix });
        }
    };

    const handleScrollToSlide = (index: number) => {
        const element = document.getElementById(`slide-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add a brief highlight effect
            element.classList.add('ring-4', 'ring-primary', 'ring-offset-4');
            setTimeout(() => {
                element.classList.remove('ring-4', 'ring-primary', 'ring-offset-4');
            }, 2000);
        }
    };

    return (
        <div className="w-full h-full flex overflow-hidden">
            <NarrativeFlowSidebar
                slides={slides}
                onOptimizeFlow={() => setIsAiFlowDialogOpen(true)}
                onSelectSlide={handleScrollToSlide}
            />

            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/30 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto pb-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Storyboard</h2>
                            <p className="text-muted-foreground text-sm">Organize your presentation structure.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 gap-2"
                                onClick={() => setIsAiFlowDialogOpen(true)}
                            >
                                <Wand2 className="h-4 w-4 text-purple-600" />
                                Smart Optimization
                            </Button>
                        </div>
                    </div>

                    <AiNarrativeFlowDialog
                        open={isAiFlowDialogOpen}
                        onOpenChange={setIsAiFlowDialogOpen}
                        slides={slides}
                        onApplyReorder={onReorder}
                    />


                    <SortableContext
                        items={slides.map(s => s.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {slides.map((slide, index) => (
                                <SortableSlide
                                    key={slide.id}
                                    slide={slide}
                                    index={index}
                                    theme={theme}
                                    colorPalette={colorPalette}
                                    fontConfig={fontConfig}
                                    onSelect={onSelectSlide}
                                    onDelete={onDeleteSlide}
                                    onToggleAppendix={handleToggleAppendix}
                                    onSaveToLibrary={handleSaveToLibrary}
                                    isSavingToLibrary={isSavingToLibrary}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Save to Slide Library</DialogTitle>
                                <DialogDescription>
                                    Classify this slide to find it easily later.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={saveData.name}
                                        onChange={(e) => setSaveData({ ...saveData, name: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="category" className="text-right">
                                        Category
                                    </Label>
                                    <Select
                                        value={saveData.category}
                                        onValueChange={(v) => setSaveData({ ...saveData, category: v })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Analysis">Analysis</SelectItem>
                                            <SelectItem value="Strategy">Strategy</SelectItem>
                                            <SelectItem value="Financial">Financial</SelectItem>
                                            <SelectItem value="Operations">Operations</SelectItem>
                                            <SelectItem value="Marketing">Marketing</SelectItem>
                                            <SelectItem value="Generic">Generic</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="type" className="text-right">
                                        Type
                                    </Label>
                                    <Select
                                        value={saveData.type}
                                        onValueChange={(v) => setSaveData({ ...saveData, type: v })}
                                    >
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SWOT">SWOT</SelectItem>
                                            <SelectItem value="Executive Summary">Executive Summary</SelectItem>
                                            <SelectItem value="Roadmap">Roadmap</SelectItem>
                                            <SelectItem value="Chart">Chart</SelectItem>
                                            <SelectItem value="Table">Table</SelectItem>
                                            <SelectItem value="Title">Title Slide</SelectItem>
                                            <SelectItem value="Content">Content Slide</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleConfirmSave} className="gap-2">
                                    <Save className="w-4 h-4" />
                                    Save Slide
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>
        </div>
    );
};

export default StoryboardView;
