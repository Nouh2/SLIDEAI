// components/editor/BugReportDialog.tsx
// Modal for reporting bugs during beta testing

import { useState } from "react";
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

    const bugOptions = [
        {
            id: 'empty-slide' as BugType,
            label: 'Slide Vide',
            icon: ImageOff,
            description: 'Une slide s\'affiche vide ou sans contenu',
            color: 'text-red-500',
        },
        {
            id: 'generation-failed' as BugType,
            label: 'Génération Incomplète',
            icon: FileWarning,
            description: 'La présentation n\'a qu\'une seule slide avec le prompt',
            color: 'text-orange-500',
        },
        {
            id: 'other' as BugType,
            label: 'Autre Bug',
            icon: HelpCircle,
            description: 'Signaler un autre problème',
            color: 'text-blue-500',
        },
    ];

    const handleSubmit = async () => {
        if (!selectedType) return;
        if (selectedType === 'other' && !userDescription.trim()) {
            toast({
                title: "Description requise",
                description: "Veuillez décrire le bug que vous avez rencontré.",
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
                    title: "✅ Bug signalé !",
                    description: "Merci pour votre retour. Notre équipe va analyser le problème.",
                });
                setOpen(false);
                setSelectedType(null);
                setUserDescription("");
            } else {
                throw new Error("Échec de l'envoi");
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible d'envoyer le rapport. Réessayez plus tard.",
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
                    title="Signaler un bug"
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
                        Signaler un Bug
                    </DialogTitle>
                    <DialogDescription>
                        Aidez-nous à améliorer SlideAI en signalant les problèmes rencontrés.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Bug Type Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            Type de bug
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
                                <span className="text-muted-foreground">Slide actuelle:</span>
                                <span className="font-medium">#{slideIndex + 1}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Présentation:</span>
                                <span className="font-medium truncate max-w-[200px]">
                                    {presentationTitle || presentationId.slice(0, 8)}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground pt-2 border-t mt-2">
                                Les logs de la slide seront envoyés pour analyse.
                            </p>
                        </div>
                    )}

                    {/* Description for 'other' bug type */}
                    {selectedType === 'other' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Décrivez le problème
                            </label>
                            <Textarea
                                value={userDescription}
                                onChange={(e) => setUserDescription(e.target.value)}
                                placeholder="Expliquez ce qui ne fonctionne pas correctement..."
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
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedType || isSending}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Envoi...
                            </>
                        ) : (
                            <>
                                <Bug className="mr-2 h-4 w-4" />
                                Envoyer le rapport
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
