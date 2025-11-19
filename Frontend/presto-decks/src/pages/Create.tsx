import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Wand2, ArrowRight, Zap, Paperclip, FileText, X, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const purposes = [
    "Business Pitch",
    "Marketing Plan",
    "Educational Course",
    "Product Launch",
    "Sales Presentation",
    "Team Meeting",
    "Conference Talk",
];

export default function Create() {
    const [vision, setVision] = useState("");
    const [purpose, setPurpose] = useState("Business Pitch");
    const [slides, setSlides] = useState([10]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string; url: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit file size to 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "Fichier trop volumineux",
                description: "La taille maximale est de 10MB",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsUploading(true);
            const response = await api.uploadFile(file);
            setAttachedFile({ name: file.name, url: response.url });
            toast({
                title: "Document ajouté",
                description: "Le fichier sera utilisé pour enrichir la présentation",
            });
        } catch (error) {
            toast({
                title: "Erreur d'upload",
                description: "Impossible de charger le fichier",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleGenerate = async () => {
        if (!vision.trim()) {
            toast({
                title: "Vision requise",
                description: "Veuillez décrire votre présentation",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsGenerating(true);

            let finalPrompt = vision;
            if (attachedFile) {
                finalPrompt += `\n\n[CONTEXTE: Utiliser le document joint "${attachedFile.name}" (${attachedFile.url}) pour générer le contenu]`;
            }

            const data = await api.generate({
                prompt: `${finalPrompt}. Objectif: ${purpose}. Nombre de slides: ${slides[0]}`,
                language: "fr",
                tone: "pro",
                length: "medium",
            });

            const traceId = data.traceId;

            toast({
                title: "Génération lancée",
                description: "Redirection vers l'éditeur...",
            });

            navigate(`/editor/${traceId}`);
        } catch (e: any) {
            toast({
                title: "Erreur",
                description: e?.message ?? "Impossible de lancer la génération",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 flex flex-col items-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            <div className="absolute inset-0 -z-10 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] animate-pulse-glow" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full space-y-8"
            >
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold">
                        L'IA au service de vos <span className="text-gradient">idées</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Décrivez votre sujet, importez vos notes, et laissez SlideAI structurer et designer votre présentation.
                    </p>
                </div>

                {/* Command Center Card */}
                <div className="relative z-10">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur opacity-30 animate-pulse-glow"></div>
                    <Card className="relative glass-card border-white/10 shadow-2xl overflow-hidden">
                        <CardContent className="p-1">
                            <div className="flex flex-col md:flex-row gap-2 bg-black/40 rounded-xl p-2">
                                {/* Vision Input */}
                                <div className="flex-1 relative group flex flex-col">
                                    <div className="absolute top-4 left-4 text-muted-foreground">
                                        <Wand2 className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        value={vision}
                                        onChange={(e) => setVision(e.target.value)}
                                        placeholder="Décrivez votre présentation... (ex : 'Pitch deck pour une startup SaaS')"
                                        className="w-full flex-1 min-h-[200px] md:min-h-[300px] bg-transparent border-none rounded-lg pl-12 pr-4 py-4 text-lg text-foreground placeholder:text-muted-foreground/50 focus:ring-0 resize-none leading-relaxed"
                                    />

                                    {/* Attached File Display */}
                                    <AnimatePresence>
                                        {attachedFile && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="mx-4 mb-2 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2 w-fit"
                                            >
                                                <FileText className="w-4 h-4 text-primary" />
                                                <span className="text-sm text-foreground/90 truncate max-w-[200px]">{attachedFile.name}</span>
                                                <button
                                                    onClick={() => setAttachedFile(null)}
                                                    className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Quick Actions & Upload */}
                                    <div className="flex items-center justify-between px-4 pb-2">
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                            {["@moderne", "@pro", "@startup"].map((tag) => (
                                                <button
                                                    key={tag}
                                                    onClick={() => setVision(vision + " " + tag)}
                                                    className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                onChange={handleFileSelect}
                                                accept=".pdf,.doc,.docx,.txt,.md"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Paperclip className="w-4 h-4" />
                                                )}
                                                <span className="hidden sm:inline">Ajouter un document</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls Sidebar */}
                                <div className="flex flex-col gap-2 md:w-72 md:border-l border-white/5 md:pl-2">
                                    <div className="space-y-4 p-2">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground">Type de présentation</label>
                                            <Select value={purpose} onValueChange={setPurpose} disabled={isGenerating}>
                                                <SelectTrigger className="bg-white/5 border-white/10 h-10 text-sm">
                                                    <SelectValue placeholder="Objectif" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {purposes.map((p) => (
                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <label className="text-xs font-medium text-muted-foreground">Nombre de slides</label>
                                                <span className="text-xs font-mono">{slides[0]}</span>
                                            </div>
                                            <Slider
                                                value={slides}
                                                onValueChange={setSlides}
                                                min={5}
                                                max={30}
                                                step={1}
                                                className="py-2"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-auto p-2">
                                        <Button
                                            size="lg"
                                            onClick={handleGenerate}
                                            disabled={(!vision.trim() && !attachedFile) || isGenerating}
                                            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-glow hover:shadow-glow-hover text-white font-semibold rounded-lg group h-12"
                                        >
                                            {isGenerating ? (
                                                <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                            ) : (
                                                <div className="flex items-center gap-2 justify-center">
                                                    <Zap className="w-4 h-4 fill-current" />
                                                    <span>Générer la présentation</span>
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
}
