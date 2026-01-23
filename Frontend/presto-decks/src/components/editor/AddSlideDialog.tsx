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
import { Loader2, Plus, MessageSquare, FileText, CheckCircle2, Sparkles, Target } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AddSlideDialogProps {
    presentationId: string;
    accessToken: string;
    onSuccess: (newSlide: any) => void;
    children: React.ReactNode;
}

export function AddSlideDialog({
    presentationId,
    accessToken,
    onSuccess,
    children,
}: AddSlideDialogProps) {
    const [open, setOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();

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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {t('addSlide.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('addSlide.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
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

                <DialogFooter className="gap-2 sm:gap-0">
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
            </DialogContent>
        </Dialog>
    );
}
