import { useState } from "react";
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
import { Share2, Copy, Check, Loader2, Edit3, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface ShareDialogProps {
    presentationId: string;
    accessToken: string;
    disabled?: boolean;
}

type ShareMode = "edit" | "view";

export function ShareDialog({ presentationId, accessToken, disabled }: ShareDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [shareMode, setShareMode] = useState<ShareMode>("edit");
    const [editShareUrl, setEditShareUrl] = useState<string | null>(null);
    const [viewShareUrl, setViewShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

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
                title: "Erreur",
                description: error.message || "Impossible de générer le lien de partage",
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
            toast({ title: "Lien copié !", description: "Le lien de partage est dans votre presse-papier." });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: "Erreur", description: "Impossible de copier le lien.", variant: "destructive" });
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            // Generate edit link by default when opening
            if (!editShareUrl) {
                handleGenerateLink("edit");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={disabled} title="Partager">
                    <Share2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-border bg-background/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5 text-primary" />
                        Partager cette présentation
                    </DialogTitle>
                    <DialogDescription>
                        Choisissez le type de partage et envoyez le lien à vos collaborateurs.
                    </DialogDescription>
                </DialogHeader>

                {/* Mode Selection */}
                <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                    <button
                        onClick={() => handleModeChange("edit")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${shareMode === "edit"
                                ? "bg-background shadow-sm text-primary border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                    >
                        <Edit3 className="h-4 w-4" />
                        Collaboratif
                    </button>
                    <button
                        onClick={() => handleModeChange("view")}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${shareMode === "view"
                                ? "bg-background shadow-sm text-primary border border-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                    >
                        <Eye className="h-4 w-4" />
                        Lecture seule
                    </button>
                </div>

                {/* Description based on mode */}
                <div className={`p-3 rounded-lg border text-sm ${shareMode === "edit"
                        ? "bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "bg-violet-500/5 border-violet-500/20 text-violet-600 dark:text-violet-400"
                    }`}>
                    {shareMode === "edit" ? (
                        <p className="flex items-start gap-2">
                            <Edit3 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Les destinataires pourront <strong>voir et modifier</strong> la présentation depuis leur compte.</span>
                        </p>
                    ) : (
                        <p className="flex items-start gap-2">
                            <Eye className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>Les destinataires pourront uniquement <strong>visualiser</strong> la présentation, sans pouvoir la modifier.</span>
                        </p>
                    )}
                </div>

                {/* Link display */}
                <div className="py-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Génération du lien...</span>
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
                            Impossible de générer le lien. Veuillez réessayer.
                        </p>
                    )}
                </div>

                <DialogFooter className="sm:justify-start">
                    <p className="text-xs text-muted-foreground">
                        {shareMode === "edit"
                            ? "Ce lien permet la modification. Partagez-le avec précaution."
                            : "Ce lien est en lecture seule. Les invités ne pourront pas modifier la présentation."
                        }
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
