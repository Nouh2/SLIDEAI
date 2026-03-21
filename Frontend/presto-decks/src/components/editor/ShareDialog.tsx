import { useState } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Copy, Check, Loader2, Edit3, Eye, Lock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface ShareDialogProps {
    presentationId: string;
    accessToken: string;
    canShareByLink?: boolean;
    canShareCollaborative?: boolean;
}

type ShareMode = "edit" | "view";

export function ShareDialog({ presentationId, accessToken, canShareByLink = true, canShareCollaborative = true }: ShareDialogProps) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [shareMode, setShareMode] = useState<ShareMode>("view");
    const [editShareUrl, setEditShareUrl] = useState<string | null>(null);
    const [viewShareUrl, setViewShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();

    const currentShareUrl = shareMode === "edit" ? editShareUrl : viewShareUrl;

    const handleGenerateLink = async (mode: ShareMode) => {
        setIsLoading(true);
        try {
            const result = await api.sharePresentation(presentationId, accessToken, mode);
            if (mode === "edit") {
                setEditShareUrl(result.shareUrl);
            } else {
                setViewShareUrl(result.shareUrl);
            }
        } catch (error: any) {
            toast({
                title: t('common.error'),
                description: error.message || t('share.generateError'),
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleModeChange = async (mode: ShareMode) => {
        setShareMode(mode);
        setCopied(false);

        // Generate link if not already cached
        const cachedUrl = mode === "edit" ? editShareUrl : viewShareUrl;
        if (!cachedUrl) {
            await handleGenerateLink(mode);
        }
    };

    const handleCopy = async () => {
        if (!currentShareUrl) return;
        try {
            await navigator.clipboard.writeText(currentShareUrl);
            setCopied(true);
            toast({ title: t('share.copied'), description: t('share.copiedMsg') });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: t('common.error'), description: t('share.copyError'), variant: "destructive" });
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            // Generate view link by default when opening
            if (!viewShareUrl) {
                handleGenerateLink("view");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" title="Partager">
                    <Share2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-border bg-background/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        {t('share.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('share.subtitle')}
                    </DialogDescription>
                </DialogHeader>

                {!canShareByLink ? (
                    /* Upgrade gate — free users */
                    <div className="flex flex-col items-center gap-4 py-4 text-center">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                            <Lock className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">Le partage de lien est disponible avec un pack ou un abonnement</p>
                            <p className="text-xs text-muted-foreground mt-1">Achetez un pack ou passez à Pro pour partager vos présentations avec un lien public.</p>
                        </div>
                        <Button onClick={() => navigate("/pricing")} className="w-full sm:w-auto">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Voir les offres
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Mode Selection */}
                        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                            <button
                                onClick={() => canShareCollaborative ? handleModeChange("edit") : navigate("/pricing")}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
                                    !canShareCollaborative
                                        ? "text-muted-foreground/60 cursor-pointer hover:bg-muted"
                                        : shareMode === "edit"
                                        ? "bg-background shadow-sm text-primary border border-primary/20"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                            >
                                {canShareCollaborative ? <Edit3 className="h-4 w-4" /> : <Lock className="h-3.5 w-3.5" />}
                                {t('share.collaborative')}
                                {!canShareCollaborative && (
                                    <span className="ml-1 text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded">Pro</span>
                                )}
                            </button>
                            <button
                                onClick={() => handleModeChange("view")}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${shareMode === "view"
                                    ? "bg-background shadow-sm text-primary border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                    }`}
                            >
                                <Eye className="h-4 w-4" />
                                {t('share.readOnly')}
                            </button>
                        </div>

                        {/* Collaborative upgrade nudge */}
                        {!canShareCollaborative && shareMode === "view" && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground">
                                <Lock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                <span>Le partage collaboratif (édition à plusieurs) est disponible avec Pro.</span>
                                <button onClick={() => navigate("/pricing")} className="ml-auto text-primary font-medium hover:underline whitespace-nowrap">
                                    Voir Pro
                                </button>
                            </div>
                        )}

                        {/* Description based on mode */}
                        <div className={`p-3 rounded-lg border text-sm ${shareMode === "edit"
                            ? "bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400"
                            : "bg-violet-500/5 border-violet-500/20 text-violet-600 dark:text-violet-400"
                            }`}>
                            {shareMode === "edit" ? (
                                <p className="flex items-start gap-2">
                                    <Edit3 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        <Trans i18nKey="share.editDesc" components={{ strong: <strong /> }} />
                                    </span>
                                </p>
                            ) : (
                                <p className="flex items-start gap-2">
                                    <Eye className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>
                                        <Trans i18nKey="share.viewDesc" components={{ strong: <strong /> }} />
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Link display */}
                        <div className="py-2">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <span className="ml-2 text-muted-foreground">{t('share.generating')}</span>
                                </div>
                            ) : currentShareUrl ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={currentShareUrl}
                                        readOnly
                                        className="flex-1 bg-muted/50 text-sm"
                                    />
                                    <Button variant="outline" size="icon" onClick={handleCopy}>
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    {t('share.generateFail')}
                                </p>
                            )}
                        </div>

                        <DialogFooter className="sm:justify-start">
                            <p className="text-xs text-muted-foreground">
                                {shareMode === "edit"
                                    ? t('share.editNote')
                                    : t('share.viewNote')
                                }
                            </p>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
