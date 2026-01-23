// components/editor/RegenerateSlideDialog.tsx
// Modal for regenerating a single slide with AI

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
import { Loader2, Wand2, Image, FileText, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface RegenerateSlideDialogProps {
    presentationId: string;
    slideIndex: number;
    slideTitle: string;
    accessToken: string;
    onSuccess: (newSlide: any) => void;
    children: React.ReactNode;
}

export function RegenerateSlideDialog({
    presentationId,
    slideIndex,
    slideTitle,
    accessToken,
    onSuccess,
    children,
}: RegenerateSlideDialogProps) {
    const [open, setOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [selectedMode, setSelectedMode] = useState<'visual' | 'detailed' | 'chart' | null>(null);
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleRegenerate = async (mode?: 'visual' | 'detailed' | 'chart') => {
        setIsRegenerating(true);
        setSelectedMode(mode || null);

        try {
            // Call API to start regeneration
            const { traceId } = await api.regenerateSlide(
                presentationId,
                slideIndex,
                {
                    prompt: customPrompt || undefined,
                    mode: mode,
                },
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
                        setIsRegenerating(false);
                        setOpen(false);
                        setCustomPrompt("");
                        setSelectedMode(null);

                        toast({
                            title: t('regenerate.success'),
                            description: t('regenerate.successMsg'),
                        });

                        onSuccess(status.newSlide);
                    } else if (status.status === 'failed') {
                        clearInterval(pollInterval);
                        setIsRegenerating(false);
                        setSelectedMode(null);
                        toast({
                            title: t('common.error'),
                            description: status.error || t('regenerate.errorMsg'),
                            variant: "destructive",
                        });
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        setIsRegenerating(false);
                        setSelectedMode(null);
                        toast({
                            title: t('regenerate.timeout'),
                            description: t('regenerate.timeoutMsg'),
                            variant: "destructive",
                        });
                    }
                } catch (pollError) {
                    console.error("Poll error:", pollError);
                }
            }, 1000);
        } catch (error: any) {
            setIsRegenerating(false);
            setSelectedMode(null);
            toast({
                title: t('common.error'),
                description: error.message || t('regenerate.genericError'),
                variant: "destructive",
            });
        }
    };

    const quickModes = [
        { id: 'visual' as const, label: t('regenerate.visual'), icon: Image, description: t('regenerate.visualDesc') },
        { id: 'detailed' as const, label: t('regenerate.detailed'), icon: FileText, description: t('regenerate.detailedDesc') },
        { id: 'chart' as const, label: t('regenerate.chart'), icon: BarChart3, description: t('regenerate.chartDesc') },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-primary" />
                        {t('regenerate.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('regenerate.subtitle', { current: slideIndex + 1, title: slideTitle || t('common.untitled') })}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Quick Mode Buttons */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            {t('regenerate.modes')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {quickModes.map((mode) => (
                                <Button
                                    key={mode.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRegenerate(mode.id)}
                                    disabled={isRegenerating}
                                    className="h-auto py-3 flex flex-col items-center gap-1"
                                >
                                    {isRegenerating && selectedMode === mode.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <mode.icon className="h-4 w-4" />
                                    )}
                                    <span className="text-xs font-medium">{mode.label}</span>
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
                            <span className="bg-background px-2 text-muted-foreground">{t('regenerate.or')}</span>
                        </div>
                    </div>

                    {/* Custom Prompt */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            {t('regenerate.customInstructions')}
                        </label>
                        <Textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder={t('regenerate.placeholder')}
                            rows={3}
                            disabled={isRegenerating}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isRegenerating}
                    >
                        {t('regenerate.cancel')}
                    </Button>
                    <Button
                        onClick={() => handleRegenerate()}
                        disabled={isRegenerating}
                    >
                        {isRegenerating && !selectedMode ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('regenerate.submitting')}
                            </>
                        ) : (
                            <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                {t('regenerate.submit')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
