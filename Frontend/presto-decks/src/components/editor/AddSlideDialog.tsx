// components/editor/AddSlideDialog.tsx
// Modal for adding a new slide with AI

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

    const handleGenerate = async (promptOverride?: string) => {
        const promptToUse = promptOverride || customPrompt;
        if (!promptToUse) {
            toast({
                title: "Instruction manquante",
                description: "Veuillez entrer une instruction ou choisir un suggestion.",
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
                            title: "Slide ajoutée !",
                            description: "La nouvelle slide a été ajoutée à la fin de la présentation.",
                        });

                        onSuccess(status.newSlide);
                    } else if (status.status === 'failed') {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        toast({
                            title: "Erreur",
                            description: status.error || "La génération a échoué.",
                            variant: "destructive",
                        });
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        setIsGenerating(false);
                        toast({
                            title: "Timeout",
                            description: "La génération prend trop de temps. Réessayez.",
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
                title: "Erreur",
                description: error.message || "Impossible d'ajouter la slide.",
                variant: "destructive",
            });
        }
    };

    const quickPrompts = [
        { label: 'Conclusion', icon: CheckCircle2, prompt: 'Génère une slide de conclusion percutante avec un appel à l\'action clair.', description: 'Synthèse et fin' },
        { label: 'Q&A', icon: MessageSquare, prompt: 'Génère une slide dédiée aux Questions / Réponses pour engager l\'audience.', description: 'Session questions' },
        { label: 'Récapitulatif', icon: FileText, prompt: 'Génère une slide qui résume les points clés abordés pour renforcer la mémorisation.', description: 'Résumé des points' },
        { label: 'Call to Action', icon: Target, prompt: 'Génère une slide incitant l\'audience à passer à l action immédiatement.', description: 'Prochaine étape' },
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
                        Ajouter une slide magique
                    </DialogTitle>
                    <DialogDescription>
                        L'IA va générer une nouvelle slide cohérente avec le reste de votre présentation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Quick Prompts */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            Suggestions rapides
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
                            <span className="bg-background px-2 text-muted-foreground">ou décrivez vos besoins</span>
                        </div>
                    </div>

                    {/* Custom Prompt */}
                    <div className="space-y-2">
                        <Textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Ex: Une slide sur les bénéfices financiers, avec un graphique en barres..."
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
                        Annuler
                    </Button>
                    <Button
                        onClick={() => handleGenerate()}
                        disabled={isGenerating || !customPrompt.trim()}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>
                                <Plus className="mr-2 h-4 w-4" />
                                Générer
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
