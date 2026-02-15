// components/editor/AddSlideDialog.tsx
// Modal for adding a new slide with AI

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, MessageSquare, FileText, CheckCircle2, Sparkles, Target, Library, Bookmark, TableProperties } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { ModernSlideRenderer } from "@/components/slides/ModernSlideRenderer";

interface AddSlideDialogProps {
    presentationId: string;
    accessToken: string;
    onSuccess: (newSlide: any) => void;
    children: React.ReactNode;
    defaultTab?: string;
}

export function AddSlideDialog({
    presentationId,
    accessToken,
    onSuccess,
    children,
    defaultTab = "ai",
}: AddSlideDialogProps) {
    const [open, setOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [librarySlides, setLibrarySlides] = useState<any[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();

    const fetchLibrarySlides = async () => {
        setIsLoadingLibrary(true);
        try {
            const slides = await api.getLibrarySlides(accessToken);
            setLibrarySlides(slides);
        } catch (error) {
            toast({
                title: t('common.error'),
                description: "Failed to load library slides.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingLibrary(false);
        }
    };

    const handleInsertFromLibrary = (slide: any) => {
        onSuccess(slide.content);
        setOpen(false);
        toast({
            title: "Slide added",
            description: `"${slide.name}" has been inserted.`,
        });
    };

    const handleGenerate = async (promptOverride?: string) => {
        const promptToUse = promptOverride || customPrompt;
        if (!promptToUse) {
            toast({
                title: t('addSlide.instructionMissing'),
                description: t('addSlide.instructionMissingMsg'),
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);

        try {
            // Call API to start generation
            const { traceId } = await api.addSlide(
                presentationId,
                { prompt: promptToUse },
                accessToken
            );

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 30; // 30 seconds timeout

            const pollInterval = setInterval(async () => {
                attempts++;

                try {
                    const status = await api.getJobStatus(traceId);

                    if (status.status === 'succeeded' && status.newSlide) {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        setOpen(false);
                        setCustomPrompt("");

                        toast({
                            title: t('addSlide.slideAdded'),
                            description: t('addSlide.slideAddedMsg'),
                        });

                        onSuccess(status.newSlide);
                    } else if (status.status === 'failed') {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        toast({
                            title: t('common.error'),
                            description: status.error || t('addSlide.generationFailed'),
                            variant: "destructive",
                        });
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        toast({
                            title: t('addSlide.timeout'),
                            description: t('addSlide.timeoutMsg'),
                            variant: "destructive",
                        });
                    }
                } catch (pollError) {
                    console.error("Poll error:", pollError);
                }
            }, 1000);
        } catch (error: any) {
            setIsGenerating(false);
            toast({
                title: t('common.error'),
                description: error.message || t('addSlide.addError'),
                variant: "destructive",
            });
        }
    };

    const quickPrompts = [
        { label: t('addSlide.conclusion'), icon: CheckCircle2, prompt: t('addSlide.prompts.conclusion'), description: t('addSlide.conclusionDesc') },
        { label: t('addSlide.qa'), icon: MessageSquare, prompt: t('addSlide.prompts.qa'), description: t('addSlide.qaDesc') },
        { label: t('addSlide.recap'), icon: FileText, prompt: t('addSlide.prompts.recap'), description: t('addSlide.recapDesc') },
        { label: t('addSlide.cta'), icon: Target, prompt: t('addSlide.prompts.cta'), description: t('addSlide.ctaDesc') },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Plus className="h-5 w-5 text-primary" />
                        Add New Slide
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue={defaultTab} className="w-full" onValueChange={(val) => val === 'library' && fetchLibrarySlides()}>
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="ai" className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            {t('addSlide.title')}
                        </TabsTrigger>
                        <TabsTrigger value="library" className="gap-2">
                            <Library className="h-4 w-4" />
                            My Library
                        </TabsTrigger>
                        <TabsTrigger value="import" className="gap-2 text-[10px] sm:text-sm">
                            <TableProperties className="h-4 w-4" />
                            Import Data
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ai" className="space-y-4 py-2 outline-none">
                        <div className="space-y-4">
                            {/* Quick Prompts */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">
                                    {t('addSlide.quickSuggestions')}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {quickPrompts.map((item, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleGenerate(item.prompt)}
                                            disabled={isGenerating}
                                            className="h-auto py-3 px-3 flex items-start justify-start gap-3 text-left whitespace-normal hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="mt-0.5 rounded-full bg-primary/10 p-1.5 shrink-0">
                                                <item.icon className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-medium leading-none">{item.label}</span>
                                                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">{item.description}</span>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">{t('addSlide.orDescribe')}</span>
                                </div>
                            </div>

                            {/* Custom Prompt */}
                            <div className="space-y-2">
                                <Textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder={t('addSlide.placeholder')}
                                    rows={3}
                                    disabled={isGenerating}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                            <Button
                                variant="ghost"
                                onClick={() => setOpen(false)}
                                disabled={isGenerating}
                            >
                                {t('addSlide.cancel')}
                            </Button>
                            <Button
                                onClick={() => handleGenerate()}
                                disabled={isGenerating || !customPrompt.trim()}
                                className="min-w-[120px]"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('addSlide.generating')}
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('addSlide.generate')}
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="library" className="space-y-4 py-2 outline-none">
                        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                            {isLoadingLibrary ? (
                                <div className="col-span-2 py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p>Loading your library...</p>
                                </div>
                            ) : librarySlides.length === 0 ? (
                                <div className="col-span-2 py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/20">
                                    <Bookmark className="h-10 w-10 mb-2 opacity-20" />
                                    <p>No slides saved yet.</p>
                                    <p className="text-xs">Save slides from the Storyboard view to see them here.</p>
                                </div>
                            ) : (
                                librarySlides.map((savedSlide) => (
                                    <div
                                        key={savedSlide.id}
                                        className="group relative flex flex-col border rounded-xl overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer bg-card"
                                        onClick={() => handleInsertFromLibrary(savedSlide)}
                                    >
                                        <div className="aspect-video bg-muted relative overflow-hidden">
                                            {/* Preview would go here, using a simplified renderer or just title */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-4">
                                                <div className="text-center overflow-hidden">
                                                    <p className="font-bold text-slate-800 text-sm mb-1">{savedSlide.content.title || "Untitled"}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{savedSlide.content.layout || "Content"}</p>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                                <Plus className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                            </div>
                                        </div>
                                        <div className="p-2 border-t flex items-center justify-between">
                                            <span className="text-xs font-semibold truncate flex-1">{savedSlide.name}</span>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                                {new Date(savedSlide.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button
                                variant="ghost"
                                onClick={() => setOpen(false)}
                            >
                                {t('addSlide.cancel')}
                            </Button>
                        </DialogFooter>
                    </TabsContent>

                    <TabsContent value="import" className="space-y-4 py-2 outline-none">
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-12 px-6 border-2 border-dashed rounded-xl bg-muted/20">
                            <div className="p-4 rounded-full bg-primary/10">
                                <TableProperties className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg italic">Smart Data Paste</h3>
                                <p className="text-sm text-muted-foreground max-w-[400px]">
                                    Copy data from Excel, Sheets, or CSV and <b>paste it anywhere</b> in the editor (Ctrl+V) to create a new slide instantly.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                                <Sparkles className="h-3 w-3" />
                                AI automatically detects tables and charts
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="w-full sm:w-auto"
                            >
                                Got it!
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
