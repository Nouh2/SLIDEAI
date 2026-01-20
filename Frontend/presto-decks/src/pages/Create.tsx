import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Wand2, ArrowRight, Zap, Paperclip, FileText, X, Loader2, ChevronLeft } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateSelector } from "@/components/create/TemplateSelector";
import { getTemplateById } from "@/data/slideTemplates";
import { projectService } from "@/lib/projects";
import { supabase } from "@/contexts/AuthContext";
import { OutOfCreditsModal } from "@/components/OutOfCreditsModal";



export default function Create() {
    const [step, setStep] = useState<'template' | 'customize'>("template");
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [vision, setVision] = useState("");

    const [slides, setSlides] = useState([10]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);


    const [isDragging, setIsDragging] = useState(false);
    const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    const processFile = (file: File) => {
        // Limit file size to 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: "Fichier trop volumineux",
                description: "La taille maximale est de 10MB",
                variant: "destructive",
            });
            return;
        }

        setAttachedFile(file);
        toast({
            title: "Document ajouté",
            description: "Le fichier sera utilisé pour enrichir la présentation",
        });

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
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
                prompt: `${finalPrompt}. Objectif: Présentation. ${template ? `Theme suggéré: ${template.id}` : ''}`,
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
                title: vision.split('\n')[0].substring(0, 40) || "Présentation",
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
            // Check if this is a credit limit error
            const errorMessage = e?.message ?? "Impossible de lancer la génération";
            if (errorMessage.includes("limite") || errorMessage.includes("crédit") || e?.status === 403) {
                setShowOutOfCreditsModal(true);
            } else {
                toast({
                    title: "Erreur",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
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

                                                {/* Attached File Display - In Input Area */}
                                                <AnimatePresence>
                                                    {attachedFile && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 10 }}
                                                            className="mx-4 mb-4 flex items-center justify-between gap-3 bg-muted/50 border border-border/60 rounded-xl px-4 py-3 group/file"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                    <FileText className="w-4 h-4 text-primary" />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-sm font-medium truncate">{attachedFile.name}</span>
                                                                    <span className="text-xs text-muted-foreground">{(attachedFile.size / 1024).toFixed(0)} KB</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setAttachedFile(null)}
                                                                className="text-muted-foreground hover:text-destructive transition-colors p-1 hover:bg-destructive/10 rounded-full"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Quick Actions */}
                                                <div className="flex items-center justify-start px-4 pb-4">
                                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                                        {/* Tags removed earlier, keeping container for potential future use or spacing */}
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Controls Sidebar with Drop Zone */}
                                            <div className="flex flex-col gap-4 md:w-72 md:border-l border-border md:pl-4">
                                                <div className="flex flex-col h-full gap-4">
                                                    {/* Drop Zone */}
                                                    <div
                                                        className={`
                                                            relative rounded-xl border-dashed border-2 transition-all duration-200 ease-in-out
                                                            flex flex-col items-center justify-center p-6 text-center cursor-pointer min-h-[160px]
                                                            ${isDragging
                                                                ? 'border-primary bg-primary/5 scale-[1.02]'
                                                                : 'border-border/60 hover:border-primary/50 hover:bg-muted/30'
                                                            }
                                                        `}
                                                        onDragOver={handleDragOver}
                                                        onDragLeave={handleDragLeave}
                                                        onDrop={handleDrop}
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <input
                                                            type="file"
                                                            ref={fileInputRef}
                                                            className="hidden"
                                                            onChange={handleFileSelect}
                                                            accept=".pdf,.doc,.docx,.txt,.md"
                                                        />

                                                        <div className={`
                                                            w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors
                                                            ${isDragging ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                                                        `}>
                                                            {isDragging ? <ArrowRight className="w-5 h-5 animate-bounce" /> : <Paperclip className="w-5 h-5" />}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium">
                                                                {isDragging ? "Déposez ici" : "Ajouter un fichier"}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Glissez ou cliquez
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Slider moves here */}
                                                    <div className="space-y-3 px-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-medium text-muted-foreground">Nombre de slides</label>
                                                            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">{slides[0]}</span>
                                                        </div>
                                                        <Slider
                                                            value={slides}
                                                            onValueChange={setSlides}
                                                            min={5}
                                                            max={20}
                                                            step={1}
                                                            className="py-2"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-2">
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
                                                                <span>Générer</span>
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

            {/* Out of Credits Modal */}
            <OutOfCreditsModal
                isOpen={showOutOfCreditsModal}
                onClose={() => setShowOutOfCreditsModal(false)}
            />
        </div>
    );
}

