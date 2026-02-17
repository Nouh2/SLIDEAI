// components/editor/BugReportDialog.tsx
// Modal for reporting bugs during beta testing

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
import { Loader2, Bug, ImageOff, FileWarning, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendBugReport, BugType } from "@/lib/discordBugReport";

interface BugReportDialogProps {
    presentationId: string;
    presentationTitle?: string;
    currentSlide: any;
    slideIndex: number;
    allSlides: any[];
    theme?: string;
    colorPalette?: any;
}

export function BugReportDialog({
    presentationId,
    presentationTitle,
    currentSlide,
    slideIndex,
    allSlides,
    theme,
    colorPalette,
}: BugReportDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [selectedType, setSelectedType] = useState<BugType | null>(null);
    const [userDescription, setUserDescription] = useState("");
    const { toast } = useToast();
    const { t } = useTranslation();

    const bugOptions = [
        {
            id: 'empty-slide' as BugType,
            label: t('bugReport.types.emptySlide'),
            icon: ImageOff,
            description: t('bugReport.types.emptySlideDesc'),
            color: 'text-red-500',
        },
        {
            id: 'generation-failed' as BugType,
            label: t('bugReport.types.generationIncomplete'),
            icon: FileWarning,
            description: t('bugReport.types.generationIncompleteDesc'),
            color: 'text-orange-500',
        },
        {
            id: 'other' as BugType,
            label: t('bugReport.types.other'),
            icon: HelpCircle,
            description: t('bugReport.types.otherDesc'),
            color: 'text-blue-500',
        },
    ];

    const handleSubmit = async () => {
        if (!selectedType) return;
        if (selectedType === 'other' && !userDescription.trim()) {
            toast({
                title: t('bugReport.validation.descRequired'),
                description: t('bugReport.validation.descRequiredMsg'),
                variant: "destructive",
            });
            return;
        }

        setIsSending(true);

        try {
            const success = await sendBugReport({
                type: selectedType,
                presentationId,
                presentationTitle,
                slideIndex,
                slideData: currentSlide,
                allSlides: selectedType === 'generation-failed' ? allSlides : undefined,
                theme,
                colorPalette,
                userDescription: selectedType === 'other' ? userDescription : undefined,
                userAgent: navigator.userAgent,
                timestamp: new Date().toLocaleString('fr-FR'),
                url: window.location.href,
            });

            if (success) {
                toast({
                    title: t('bugReport.successTitle'),
                    description: t('bugReport.successMsg'),
                });
                setOpen(false);
                setSelectedType(null);
                setUserDescription("");
            } else {
                throw new Error(t('bugReport.errors.sendFailure'));
            }
        } catch (error) {
            toast({
                title: t('bugReport.errorTitle'),
                description: t('bugReport.errorMsg'),
                variant: "destructive",
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleTypeSelect = (type: BugType) => {
        setSelectedType(type);
        // Auto-submit for non-'other' types
        if (type !== 'other') {
            setSelectedType(type);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    title={t('bugReport.trigger')}
                    className="relative hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <Bug className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bug className="h-5 w-5 text-red-500" />
                        {t('bugReport.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('bugReport.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Bug Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            {t('bugReport.typeLabel')}
                        </label>
                        <div className="grid gap-2">
                            {bugOptions.map((option) => (
                                <Button
                                    key={option.id}
                                    variant={selectedType === option.id ? "default" : "outline"}
                                    onClick={() => handleTypeSelect(option.id)}
                                    disabled={isSending}
                                    className={`h-auto py-3 justify-start gap-3 ${selectedType === option.id
                                        ? 'ring-2 ring-primary ring-offset-2'
                                        : ''
                                        }`}
                                >
                                    <option.icon className={`h-5 w-5 ${option.color}`} />
                                    <div className="text-left">
                                        <div className="font-medium">{option.label}</div>
                                        <div className="text-xs text-muted-foreground font-normal">
                                            {option.description}
                                        </div>
                                    </div>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Context Info */}
                    {selectedType && selectedType !== 'other' && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('bugReport.context.currentSlide')}</span>
                                <span className="font-medium">#{slideIndex + 1}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t('bugReport.context.presentation')}</span>
                                <span className="font-medium truncate max-w-[200px]">
                                    {presentationTitle || presentationId.slice(0, 8)}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                                {t('bugReport.context.logsNote')}
                            </p>
                        </div>
                    )}

                    {/* Description for 'other' bug type */}
                    {selectedType === 'other' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                {t('bugReport.descriptionLabel')}
                            </label>
                            <Textarea
                                value={userDescription}
                                onChange={(e) => setUserDescription(e.target.value)}
                                placeholder={t('bugReport.placeholder')}
                                rows={4}
                                disabled={isSending}
                                className="resize-none"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setOpen(false);
                            setSelectedType(null);
                            setUserDescription("");
                        }}
                        disabled={isSending}
                    >
                        {t('bugReport.cancel')}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedType || isSending}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('bugReport.submitting')}
                            </>
                        ) : (
                            <>
                                <Bug className="mr-2 h-4 w-4" />
                                {t('bugReport.submit')}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
