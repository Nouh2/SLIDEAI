// components/editor/ColorPaletteDialog.tsx
// Modal for modifying presentation color palette with AI or Manually

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Palette, Sun, Moon, Sparkles, Wand2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ColorPaletteDialogProps {
    presentationId: string;
    accessToken: string;
    currentPalette?: any;
    onSuccess: (newPalette: any) => void;
    children: React.ReactNode;
}

export function ColorPaletteDialog({
    presentationId,
    accessToken,
    currentPalette,
    onSuccess,
    children,
}: ColorPaletteDialogProps) {
    const [open, setOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState("");
    const [isModifying, setIsModifying] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("ai");

    // Manual State
    const [manualColors, setManualColors] = useState({
        primary: currentPalette?.primary || '#000000',
        secondary: currentPalette?.secondary || '#000000',
        accent: currentPalette?.accent || '#000000',
        bg: currentPalette?.bg || '#ffffff',
        text: currentPalette?.text || '#000000',
    });

    const { toast } = useToast();

    const presets = [
        { id: 'dark', label: 'Thème sombre', icon: Moon, prompt: 'Thème sombre élégant avec fond noir/gris foncé et texte clair' },
        { id: 'light', label: 'Thème clair', icon: Sun, prompt: 'Thème clair et professionnel avec fond blanc et texte foncé' },
        { id: 'vibrant', label: 'Couleurs vives', icon: Sparkles, prompt: 'Couleurs vives et modernes, dynamiques et engageantes' },
    ];

    const handleManualColorChange = (key: string, value: string) => {
        setManualColors(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyManual = async () => {
        // Direct update without API call effectively (or call API to persist if needed)
        // For now, we update local state via onSuccess and let Editor handle persistence on next Save?
        // Optimally we should maybe save this change to backend too, but user asked for "manual choice".
        // Let's assume user will save presentation later.

        onSuccess({
            ...currentPalette,
            ...manualColors
        });
        setOpen(false);
        toast({
            title: "Couleurs appliquées",
            description: "La palette a été mise à jour manuellement.",
        });
    };

    const handleModifyAI = async (prompt: string, presetId?: string) => {
        if (!prompt.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez entrer une instruction.",
                variant: "destructive",
            });
            return;
        }

        setIsModifying(true);
        setSelectedPreset(presetId || null);

        try {
            const { traceId } = await api.modifyColorPalette(presentationId, prompt, accessToken);

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 30;

            const pollInterval = setInterval(async () => {
                attempts++;

                try {
                    const status = await api.getJobStatus(traceId);

                    if (status.status === 'succeeded' && status.newPalette) {
                        clearInterval(pollInterval);
                        setIsModifying(false);
                        setOpen(false);
                        setCustomPrompt("");
                        setSelectedPreset(null);

                        toast({
                            title: "Palette modifiée !",
                            description: "La nouvelle palette a été appliquée.",
                        });

                        onSuccess(status.newPalette);
                    } else if (status.status === 'failed') {
                        clearInterval(pollInterval);
                        setIsModifying(false);
                        setSelectedPreset(null);
                        toast({
                            title: "Erreur",
                            description: status.error || "La modification a échoué.",
                            variant: "destructive",
                        });
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        setIsModifying(false);
                        setSelectedPreset(null);
                        toast({
                            title: "Timeout",
                            description: "La modification prend trop de temps. Réessayez.",
                            variant: "destructive",
                        });
                    }
                } catch (pollError) {
                    console.error("Poll error:", pollError);
                }
            }, 1000);
        } catch (error: any) {
            setIsModifying(false);
            setSelectedPreset(null);
            toast({
                title: "Erreur",
                description: error.message || "Impossible de modifier la palette.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Modifier la palette
                    </DialogTitle>
                    <DialogDescription>
                        Personnalisez les couleurs de votre présentation
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="ai" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ai" className="flex items-center gap-2">
                            <Wand2 className="h-4 w-4" />
                            Assistant IA
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Manuel
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ai" className="space-y-4 py-4">
                        {/* Quick Presets */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Suggestion Rapide
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {presets.map((preset) => (
                                    <Button
                                        key={preset.id}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleModifyAI(preset.prompt, preset.id)}
                                        disabled={isModifying}
                                        className="h-auto py-3 flex flex-col items-center gap-1"
                                    >
                                        {isModifying && selectedPreset === preset.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <preset.icon className="h-4 w-4" />
                                        )}
                                        <span className="text-xs font-medium">{preset.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">ou</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Instructions personnalisées
                            </label>
                            <Textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                placeholder="Ex: Plus de bleu, couleurs pastel, style corporate..."
                                rows={3}
                                disabled={isModifying}
                                className="resize-none"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primary">Couleur Primaire</Label>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded border border-input overflow-hidden shrink-0">
                                        <input
                                            type="color"
                                            value={manualColors.primary}
                                            onChange={(e) => handleManualColorChange('primary', e.target.value)}
                                            className="w-full h-full p-0 border-0 cursor-pointer scale-150 origin-center"
                                        />
                                    </div>
                                    <Input
                                        id="primary"
                                        value={manualColors.primary}
                                        onChange={(e) => handleManualColorChange('primary', e.target.value)}
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="secondary">Secondaire</Label>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded border border-input overflow-hidden shrink-0">
                                        <input
                                            type="color"
                                            value={manualColors.secondary}
                                            onChange={(e) => handleManualColorChange('secondary', e.target.value)}
                                            className="w-full h-full p-0 border-0 cursor-pointer scale-150 origin-center"
                                        />
                                    </div>
                                    <Input
                                        id="secondary"
                                        value={manualColors.secondary}
                                        onChange={(e) => handleManualColorChange('secondary', e.target.value)}
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accent">Accent</Label>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded border border-input overflow-hidden shrink-0">
                                        <input
                                            type="color"
                                            value={manualColors.accent}
                                            onChange={(e) => handleManualColorChange('accent', e.target.value)}
                                            className="w-full h-full p-0 border-0 cursor-pointer scale-150 origin-center"
                                        />
                                    </div>
                                    <Input
                                        id="accent"
                                        value={manualColors.accent}
                                        onChange={(e) => handleManualColorChange('accent', e.target.value)}
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bg">Arrière-plan</Label>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded border border-input overflow-hidden shrink-0">
                                        <input
                                            type="color"
                                            value={manualColors.bg}
                                            onChange={(e) => handleManualColorChange('bg', e.target.value)}
                                            className="w-full h-full p-0 border-0 cursor-pointer scale-150 origin-center"
                                        />
                                    </div>
                                    <Input
                                        id="bg"
                                        value={manualColors.bg}
                                        onChange={(e) => handleManualColorChange('bg', e.target.value)}
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="text">Texte</Label>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 rounded border border-input overflow-hidden shrink-0">
                                        <input
                                            type="color"
                                            value={manualColors.text}
                                            onChange={(e) => handleManualColorChange('text', e.target.value)}
                                            className="w-full h-full p-0 border-0 cursor-pointer scale-150 origin-center"
                                        />
                                    </div>
                                    <Input
                                        id="text"
                                        value={manualColors.text}
                                        onChange={(e) => handleManualColorChange('text', e.target.value)}
                                        className="font-mono text-xs uppercase"
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isModifying}
                    >
                        Annuler
                    </Button>
                    {activeTab === 'ai' ? (
                        <Button
                            onClick={() => handleModifyAI(customPrompt)}
                            disabled={isModifying || !customPrompt.trim()}
                        >
                            {isModifying && !selectedPreset ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Modification...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Générer avec IA
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleApplyManual}>
                            Appliquer
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
