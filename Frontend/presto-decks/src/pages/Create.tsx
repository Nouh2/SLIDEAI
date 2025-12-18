import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Wand2, ArrowRight, Zap, Paperclip, FileText, X, Loader2, ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateSelector } from "@/components/create/TemplateSelector";
import { getTemplateById } from "@/data/slideTemplates";
import { projectService } from "@/lib/projects";
import { supabase } from "@/contexts/AuthContext";

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
    const [step, setStep] = useState<'template' | 'customize'>("template");
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [vision, setVision] = useState("");
    const [purpose, setPurpose] = useState("Business Pitch");
    const [slides, setSlides] = useState([10]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);


    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

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

        // Store file directly (will be sent with generate request)
        setAttachedFile(file);
        toast({
            title: "Document ajouté",
            description: "Le fichier sera utilisé pour enrichir la présentation",
        });

        if (fileInputRef.current) fileInputRef.current.value = "";
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

            // Get current session for auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast({
                    title: "Session expirée",
                    description: "Veuillez vous reconnecter",
                    variant: "destructive",
                });
                navigate("/auth");
                return;
            }

            const template = selectedTemplate ? getTemplateById(selectedTemplate) : null;

            let finalPrompt = vision;

            // Add template context if selected
            if (template) {
                finalPrompt += `\n\n[STYLE: Utiliser le template "${template.name}" (${template.description}). Cas d'usage: ${template.useCases.join(', ')}]`;
            }

            const data = await api.generate({
                prompt: `${finalPrompt}. Objectif: ${purpose}. ${template ? `Theme suggéré: ${template.id}` : ''}`,
                language: "fr",
                tone: "pro",
                length: "medium",
                slideCount: slides[0],
                theme: template?.id,
                file: attachedFile || undefined, // Pass file for RAG extraction
                accessToken: session.access_token, // Pass auth token
            });

            const traceId = data.traceId;

            // Save project to local storage for Dashboard visibility
            projectService.add({
                id: traceId,
                title: vision.split('\n')[0].substring(0, 40) || purpose,
                prompt: finalPrompt,
                slides: new Array(slides[0]).fill({}), // Placeholder count
                theme: template ? { id: template.id, name: template.name } : "modern",
                createdAt: new Date().toISOString().split('T')[0],
                usage: 0,
            });

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
                className="max-w-7xl w-full space-y-8"
            >
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-4">
                    <div className={`flex items-center gap-2 ${step === 'template' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step === 'template' ? 'bg-primary text-white' : 'bg-muted'}`}>1</div>
                        <span className="text-sm font-medium hidden sm:inline">Choose Template</span>
                    </div>
                    <div className="h-px w-16 bg-border"></div>
                    <div className={`flex items-center gap-2 ${step === 'customize' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step === 'customize' ? 'bg-primary text-white' : 'bg-muted'}`}>2</div>
                        <span className="text-sm font-medium hidden sm:inline">Customize & Generate</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'template' ? (
                        <motion.div
                            key="template"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            <TemplateSelector
                                selectedTemplate={selectedTemplate}
                                onSelectTemplate={setSelectedTemplate}
                            />

                            <div className="flex justify-center gap-4">
                                <Button
                                    size="lg"
                                    onClick={() => {
                                        if (!selectedTemplate) {
                                            toast({
                                                title: "Template requis",
                                                description: "Veuillez sélectionner un template",
                                                variant: "destructive",
                                            });
                                            return;
                                        }
                                        setStep('customize');
                                    }}
                                    className="bg-gradient-to-r from-primary to-secondary text-white gap-2"
                                >
                                    Continuer
                                    <ArrowRight className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedTemplate(null);
                                        setStep('customize');
                                    }}
                                >
                                    Passer cette étape
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="customize"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Back button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('template')}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Retour aux templates
                            </Button>

                            {/* Selected template preview */}
                            {selectedTemplate && (
                                <div className="text-center space-y-2">
                                    <p className="text-sm text-muted-foreground">Template sélectionné:</p>
                                    <h3 className="text-xl font-semibold">{getTemplateById(selectedTemplate)?.name}</h3>
                                </div>
                            )}

                            <div className="text-center space-y-4">
                                <h1 className="text-4xl md:text-5xl font-bold">
                                    L'IA au service de vos <span className="text-gradient">idées</span>
                                </h1>
                                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                    Décrivez votre sujet, importez vos notes, et laissez SlideAI structurer et designer votre présentation.
                                </p>
                            </div>

                            {/* Command Center Card */}
                            <div className="relative z-10 max-w-4xl mx-auto">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-secondary rounded-2xl blur opacity-30 animate-pulse-glow"></div>
                                <Card className="relative glass-card border-border/40 shadow-2xl overflow-hidden">
                                    <CardContent className="p-1">
                                        <div className="flex flex-col md:flex-row gap-2 bg-white rounded-xl p-2 shadow-sm border border-border/50">
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
                                                                className="text-xs px-2 py-1 rounded-md bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground hover:text-primary transition-colors whitespace-nowrap"
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
                                            <div className="flex flex-col gap-2 md:w-72 md:border-l border-border md:pl-2">
                                                <div className="space-y-4 p-2">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground">Type de présentation</label>
                                                        <Select value={purpose} onValueChange={setPurpose} disabled={isGenerating}>
                                                            <SelectTrigger className="bg-white border-input h-10 text-sm">
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
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

