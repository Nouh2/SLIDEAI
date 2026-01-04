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
import { Share2, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface ShareDialogProps {
    presentationId: string;
    accessToken: string;
    disabled?: boolean;
}

export function ShareDialog({ presentationId, accessToken, disabled }: ShareDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleGenerateLink = async () => {
        setIsLoading(true);
        try {
            const result = await api.sharePresentation(presentationId, accessToken);
            setShareUrl(result.shareUrl);
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

    const handleCopy = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast({ title: "Lien copié !", description: "Le lien de partage est dans votre presse-papier." });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: "Erreur", description: "Impossible de copier le lien.", variant: "destructive" });
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open && !shareUrl) {
            handleGenerateLink();
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
                        Envoyez ce lien à vos collègues. Ils pourront voir et modifier la présentation depuis leur propre compte.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="ml-2 text-muted-foreground">Génération du lien...</span>
                        </div>
                    ) : shareUrl ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={shareUrl}
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
                        Ce lien est permanent. Toute personne disposant du lien pourra modifier la présentation.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
