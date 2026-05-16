import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Wand2, ArrowRight, Zap, Paperclip, FileText, X, Loader2, ChevronLeft, Globe } from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { api, ParseDocumentResponse, BrandKit } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateSelector } from "@/components/create/TemplateSelector";
import { DocumentStructureStep } from "@/components/create/DocumentStructureStep";
import { PromptStoryboardStep, PromptStoryboardSelection } from "@/components/create/PromptStoryboardStep";
import { BrandKitSelector } from "@/components/brand/BrandKitSelector";
import { getTemplateById } from "@/data/slideTemplates";
import { projectService } from "@/lib/projects";
import { supabase } from "@/contexts/AuthContext";
import { OutOfCreditsModal } from "@/components/OutOfCreditsModal";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";
import { hasFeature } from "@/lib/subscription";
import { ACTIVATION_USE_CASES, ActivationUseCaseId, getActivationUseCase } from "@/lib/activation";
import {
    BlogAttribution,
    getBlogAttributionEventParams,
    getBlogAttributionFromSearch,
    getStoredBlogAttribution,
    markBlogCtaReplayed,
    rememberBlogAttribution,
    shouldReplayBlogCta,
} from "@/lib/blogAttribution";

const TEMPLATE_STARTER_PROMPTS: Record<string, string> = {
    "business-review":
        "Cree une business review / QBR pour presenter la performance du trimestre, les KPI cles, les faits marquants, les ecarts vs objectifs, les risques, les opportunites et les priorites du prochain trimestre.",
    "corporate-report":
        "Cree un rapport corporate clair avec synthese executive, indicateurs cles, analyse des resultats, enseignements, risques et prochaines actions.",
    "consulting":
        "Cree une presentation de conseil structuree avec contexte, diagnostic, enjeux, recommandations, plan d'action, impacts attendus et prochaines etapes.",
    "sales-proposal":
        "Cree une proposition commerciale client avec contexte, probleme, solution recommandee, perimetre, livrables, planning, prix et prochaines etapes.",
    "seo-audit":
        "Cree un audit SEO client avec synthese executive, constats techniques, opportunites contenu, priorites, quick wins et roadmap d'actions.",
    "financial-audit":
        "Cree une presentation d'audit financier avec synthese, chiffres cles, analyse des ecarts, risques, recommandations et plan de suivi.",
    "product-roadmap":
        "Cree une roadmap produit avec vision, objectifs, priorites, initiatives, calendrier, dependances, risques et criteres de succes.",
    "cybersecurity-audit":
        "Cree un audit cybersecurite avec niveau de risque, vulnerabilites principales, impacts business, recommandations et roadmap de remediation.",
    "board-deck":
        "Cree un board deck pour comite de direction avec synthese executive, performance, decisions attendues, risques, finances et prochaines priorites.",
    "startup-pitch":
        "Cree un pitch deck startup avec probleme, solution, marche, produit, traction, business model, go-to-market, equipe et levee de fonds.",
    "educational":
        "Cree un support de cours clair avec objectifs pedagogiques, notions cles, exemples, exercices, recapitulatif et conclusion.",
};

const getTemplateStarterPrompt = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (!template) return "";

    return TEMPLATE_STARTER_PROMPTS[templateId] ||
        `Cree une presentation ${template.name} professionnelle sur mon sujet, avec une structure claire, des messages actionnables et un rendu adapte a ce type de livrable.`;
};

const buildEditorGenerationUrl = (traceId: string, slideCount: number, activationUseCase: ActivationUseCaseId | null) => {
    const params = new URLSearchParams({ slides: String(slideCount) });
    if (activationUseCase) {
        params.set("activation", activationUseCase);
    }
    return `/editor/${traceId}?${params.toString()}`;
};


export default function Create() {
    const initialParams = new URLSearchParams(window.location.search);
    const initialBlogAttribution = getBlogAttributionFromSearch(initialParams);
    const [step, setStep] = useState<'activation' | 'template' | 'customize' | 'storyboard' | 'document-structure'>(
        initialBlogAttribution
            ? "customize"
            : initialParams.get("onboarding") === "1" && !initialParams.get("activation")
                ? "activation"
                : "template"
    );
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialBlogAttribution?.templateId || null);
    const [vision, setVision] = useState(initialBlogAttribution?.prompt || "");
    const [blogAttribution, setBlogAttribution] = useState<BlogAttribution | null>(initialBlogAttribution);
    const [activationUseCase, setActivationUseCase] = useState<ActivationUseCaseId | null>(null);
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [contentLanguage, setContentLanguage] = useState<string>(i18n.language === 'fr' ? 'fr' : i18n.language === 'es' ? 'es' : 'en');

    const [slides, setSlides] = useState([initialBlogAttribution?.slideCount || 10]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);

    // Smart Report Parsing state
    const [parsedDocument, setParsedDocument] = useState<ParseDocumentResponse | null>(null);
    const [parseToken, setParseToken] = useState<string | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
    const [selectedBrandKit, setSelectedBrandKit] = useState<BrandKit | null>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const appliedBlogAttributionRef = useRef<string | null>(initialBlogAttribution?.content || null);
    const navigate = useNavigate();
    const { toast } = useToast();
    const canUseBrandKit = hasFeature(subscription, "brand_kit");
    const blogEventParams = getBlogAttributionEventParams(blogAttribution);
    const authReturnTo = `/auth?returnTo=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`;

    const applyActivationUseCase = (id: ActivationUseCaseId, surface: string) => {
        const useCase = getActivationUseCase(id);
        if (!useCase) return;

        setActivationUseCase(useCase.id);
        setSelectedTemplate(useCase.templateId);
        setVision((current) => current.trim() ? current : useCase.prompt);
        setSlides([useCase.slideCount]);
        setStep("customize");

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("activation", useCase.id);
        nextParams.delete("onboarding");
        setSearchParams(nextParams, { replace: true });

        Analytics.trackActivationStep({
            step: "activation_use_case_selected",
            surface,
            useCase: useCase.id,
            templateId: useCase.templateId,
            slideCount: useCase.slideCount,
        });
    };

    useEffect(() => {
        const loadSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                return;
            }

            try {
                const data = await api.getMySubscription(session.access_token);
                setSubscription(data);
            } catch (error) {
                console.error("Failed to load subscription", error);
            }
        };

        loadSubscription();
    }, []);

    useEffect(() => {
        const fromUrl = getBlogAttributionFromSearch(searchParams);
        const stored = getStoredBlogAttribution();
        const attribution = fromUrl
            ? {
                ...fromUrl,
                wasAuthenticated: stored?.content === fromUrl.content ? stored.wasAuthenticated : fromUrl.wasAuthenticated,
            }
            : stored;
        if (!attribution) return;

        rememberBlogAttribution(attribution);
        setBlogAttribution(attribution);

        if (appliedBlogAttributionRef.current !== attribution.content) {
            appliedBlogAttributionRef.current = attribution.content;
            setVision((current) => current.trim() ? current : attribution.prompt);
            setSelectedTemplate((current) => current || attribution.templateId);
            setSlides([attribution.slideCount]);
            setStep("customize");
        }

        const replayAnonymousClick = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            const eventParams = getBlogAttributionEventParams(attribution);
            const createOpenedKey = `slideai-create-opened-${attribution.content}`;
            if (!localStorage.getItem(createOpenedKey)) {
                localStorage.setItem(createOpenedKey, "tracked");
                Analytics.trackProductEvent("create_opened", {
                    ...eventParams,
                    surface: "create_page",
                    template_id: attribution.templateId,
                    slide_count: attribution.slideCount,
                });
            }

            if (shouldReplayBlogCta(attribution)) {
                Analytics.trackProductEvent("blog_cta_click", {
                    ...eventParams,
                    cta_variant: "replayed_after_auth",
                    destination: "create",
                    replayed_after_auth: true,
                });
                markBlogCtaReplayed(attribution);
            }
        };

        void replayAnonymousClick();
    }, [searchParams]);

    useEffect(() => {
        const requestedUseCase = getActivationUseCase(searchParams.get("activation"));
        if (!requestedUseCase || activationUseCase === requestedUseCase.id) return;

        setActivationUseCase(requestedUseCase.id);
        setSelectedTemplate(requestedUseCase.templateId);
        setVision((current) => current.trim() ? current : requestedUseCase.prompt);
        setSlides([requestedUseCase.slideCount]);
        setStep("customize");

        Analytics.trackActivationStep({
            step: "activation_onboarding_started",
            surface: "create_url",
            useCase: requestedUseCase.id,
            templateId: requestedUseCase.templateId,
            slideCount: requestedUseCase.slideCount,
        });
    }, [searchParams, activationUseCase]);

    useEffect(() => {
        if (!canUseBrandKit && selectedBrandKit) {
            setSelectedBrandKit(null);
        }
    }, [canUseBrandKit, selectedBrandKit]);

    const processFile = async (file: File) => {
        // Limit file size to 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: t('create.fileTooLarge'),
                description: t('create.maxFileSize'),
                variant: "destructive",
            });
            return;
        }

        setAttachedFile(file);

        // For PDF/DOCX files, try to parse structure for Smart Report feature
        const fname = file.name.toLowerCase();
        if (fname.endsWith('.pdf') || fname.endsWith('.docx') || fname.endsWith('.pptx')) {
            try {
                setIsParsing(true);
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    toast({ title: t('create.sessionExpired'), variant: "destructive" });
                    navigate(authReturnTo);
                    return;
                }

                const result = await api.parseDocument(file, session.access_token);
                if (result.success && result.document && result.document.sections.length > 1) {
                    // Document has structure - offer section selection
                    setParsedDocument(result);
                    setParseToken(result.parseToken || null);
                    toast({
                        title: t('create.structureDetected'),
                        description: t('create.chaptersFound', { count: result.document.sections.length }),
                    });
                } else {
                    // No structure or single section - proceed normally
                    toast({
                        title: t('create.fileAdded'),
                        description: t('create.fileAddedMsg'),
                    });
                }
            } catch (e: any) {
                console.error('Parse error:', e);
                // Continue without structure - fallback to normal flow
                toast({
                    title: t('create.fileAdded'),
                    description: t('create.fileAddedMsg'),
                });
            } finally {
                setIsParsing(false);
            }
        } else {
            toast({
                title: t('create.fileAdded'),
                description: t('create.fileAddedMsg'),
            });
        }

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

    // Smart Report: Generate from selected sections
    const handleGenerateFromSections = async (selection: {
        sectionIds: string[];
        sectionVisuals: Record<string, 'image' | 'chart-bar' | 'chart-pie' | 'chart-line' | 'text-only'>;
        structurePrompt: string; // NEW: Receive the plan instruction
        totalSlides: number; // NEW: Received from Smart Plan
        evidenceMode?: 'standard' | 'strict';
    }) => {
        if (!parseToken) return;

        try {
            setIsGenerating(true);
            Analytics.trackEvent(ANALYTICS_EVENTS.PRESENTATION.CATEGORY, ANALYTICS_EVENTS.PRESENTATION.GENERATE_START);
            Analytics.trackActivationStep({
                step: "create_started",
                surface: "document_structure",
                useCase: activationUseCase,
                templateId: selectedTemplate,
                slideCount: selection.totalSlides,
                hasFile: true,
                extra: blogEventParams,
            });

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast({ title: t('create.sessionExpired'), variant: "destructive" });
                navigate(authReturnTo);
                return;
            }

            const template = selectedTemplate ? getTemplateById(selectedTemplate) : null;

            // INJECTED PROMPT: Original Vision + The Strict Plan
            const prompt = (vision.trim() || t('create.generateFromDoc', { title: parsedDocument?.document?.title }))
                + selection.structurePrompt;

            const data = await api.generateFromSections(
                {
                    prompt,
                    parseToken,
                    sectionIds: selection.sectionIds,
                    sectionVisuals: selection.sectionVisuals,
                    language: contentLanguage,
                    theme: template?.id,
                    deliverableType: template?.id,
                    evidenceMode: selection.evidenceMode,
                    slideCount: selection.totalSlides, // USE SMART PLAN COUNT
                    // Brand kit integration
                    brandColors: selectedBrandKit?.colors,
                    brandFonts: selectedBrandKit?.fonts,
                    brandLogoUrl: selectedBrandKit?.logo_url,
                    templateOverlay: selectedBrandKit?.template_overlay,
                },
                session.access_token
            );

            const traceId = data.traceId;

            projectService.add({
                id: traceId,
                title: parsedDocument?.document?.title || t('create.defaultTitle'),
                prompt,
                slides: new Array(selection.totalSlides).fill({}), // USE SMART PLAN COUNT
                theme: template ? { id: template.id, name: template.name } : "modern",
                createdAt: new Date().toISOString().split('T')[0],
                usage: 0,
            });

            toast({
                title: t('create.generationStarted'),
                description: t('create.redirecting'),
            });

            navigate(buildEditorGenerationUrl(traceId, selection.totalSlides, activationUseCase));
            Analytics.trackEvent(ANALYTICS_EVENTS.PRESENTATION.CATEGORY, ANALYTICS_EVENTS.PRESENTATION.GENERATE_COMPLETE);
        } catch (e: any) {
            const errorMessage = e?.message ?? t('create.errorGenerating');
            if (errorMessage.includes("limite") || errorMessage.includes("crédit") || e?.status === 403) {
                setShowOutOfCreditsModal(true);
            } else {
                toast({ title: t('create.error'), description: errorMessage, variant: "destructive" });
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePrepareStoryboard = () => {
        if (parsedDocument?.document && parseToken) {
            setStep('document-structure');
            return;
        }

        if (!vision.trim() && !attachedFile) {
            toast({
                title: t('create.visionRequired'),
                description: t('create.visionRequiredMsg'),
                variant: "destructive",
            });
            return;
        }

        setStep('storyboard');
    };

    const handleGenerate = async (storyboard?: PromptStoryboardSelection) => {
        if (!vision.trim() && !attachedFile) {
            toast({
                title: t('create.visionRequired'),
                description: t('create.visionRequiredMsg'),
                variant: "destructive",
            });
            return;
        }

        try {
            setIsGenerating(true);
            Analytics.trackEvent(ANALYTICS_EVENTS.PRESENTATION.CATEGORY, ANALYTICS_EVENTS.PRESENTATION.GENERATE_START);
            Analytics.trackActivationStep({
                step: "create_started",
                surface: "prompt_storyboard",
                useCase: activationUseCase,
                templateId: selectedTemplate,
                slideCount: storyboard?.totalSlides || slides[0],
                hasFile: Boolean(attachedFile),
                extra: blogEventParams,
            });

            // Get current session for auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast({
                    title: t('create.sessionExpired'),
                    description: t('create.sessionExpiredMsg'),
                    variant: "destructive",
                });
                navigate(authReturnTo);
                return;
            }

            const template = selectedTemplate ? getTemplateById(selectedTemplate) : null;

            let finalPrompt = vision;

            // Add template context if selected
            if (template) {
                finalPrompt += `\n\n[STYLE: Utiliser le template "${template.name}" (${template.description}). Cas d'usage: ${template.useCases.join(', ')}]`;
            }

            if (storyboard?.structurePrompt) {
                finalPrompt += storyboard.structurePrompt;
            }

            const finalSlideCount = storyboard?.totalSlides || slides[0];

            const data = await api.generate({
                prompt: `${finalPrompt}. Objectif: Présentation. ${template ? `Theme suggéré: ${template.id}` : ''}`,
                language: contentLanguage,
                tone: "pro",
                length: "medium",
                slideCount: finalSlideCount,
                theme: template?.id,
                deliverableType: template?.id,
                file: attachedFile || undefined,
                accessToken: session.access_token,
                // Brand kit integration
                brandColors: selectedBrandKit?.colors,
                brandFonts: selectedBrandKit?.fonts,
                brandLogoUrl: selectedBrandKit?.logo_url,
                templateOverlay: selectedBrandKit?.template_overlay,
            });

            const traceId = data.traceId;

            // Save project to local storage for Dashboard visibility
            projectService.add({
                id: traceId,
                title: vision.split('\n')[0].substring(0, 40) || t('create.defaultTitle'),
                prompt: finalPrompt,
                slides: new Array(finalSlideCount).fill({}), // Placeholder count
                theme: template ? { id: template.id, name: template.name } : "modern",
                createdAt: new Date().toISOString().split('T')[0],
                usage: 0,
            });

            toast({
                title: t('create.generationStarted'),
                description: t('create.redirecting'),
            });

            navigate(buildEditorGenerationUrl(traceId, finalSlideCount, activationUseCase));
            Analytics.trackEvent(ANALYTICS_EVENTS.PRESENTATION.CATEGORY, ANALYTICS_EVENTS.PRESENTATION.GENERATE_COMPLETE);
        } catch (e: any) {
            // Check if this is a credit limit error
            const errorMessage = e?.message ?? "Impossible de lancer la génération";
            if (errorMessage.includes("limite") || errorMessage.includes("crédit") || e?.status === 403) {
                setShowOutOfCreditsModal(true);
            } else {
                toast({
                    title: t('create.error'),
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
                        <span className="text-sm font-medium hidden sm:inline">{t('create.step1')}</span>
                    </div>
                    <div className="h-px w-16 bg-border"></div>
                    <div className={`flex items-center gap-2 ${step === 'customize' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step === 'customize' ? 'bg-primary text-white' : 'bg-muted'}`}>2</div>
                        <span className="text-sm font-medium hidden sm:inline">{t('create.step2')}</span>
                    </div>
                    <div className="h-px w-16 bg-border"></div>
                    <div className={`flex items-center gap-2 ${step === 'storyboard' || step === 'document-structure' ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step === 'storyboard' || step === 'document-structure' ? 'bg-primary text-white' : 'bg-muted'}`}>3</div>
                        <span className="text-sm font-medium hidden sm:inline">Plan</span>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'activation' ? (
                        <motion.div
                            key="activation"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="mx-auto max-w-5xl space-y-6"
                        >
                            <div className="text-center space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Premier deck utile
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold">
                                    Choisissez un cas concret
                                </h1>
                                <p className="mx-auto max-w-2xl text-muted-foreground">
                                    SlideAI va pre-remplir le brief, le style et le nombre de slides pour vous faire arriver plus vite au resultat.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {ACTIVATION_USE_CASES.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => applyActivationUseCase(item.id, "create_onboarding")}
                                        className="group rounded-2xl border border-border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
                                    >
                                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            {item.id === "pdf_to_powerpoint" ? <FileText className="h-5 w-5" /> : <Wand2 className="h-5 w-5" />}
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary">{item.title}</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                                        <div className="mt-4 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                            <span>{item.slideCount} slides</span>
                                            <span>{getTemplateById(item.templateId)?.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-center">
                                <Button variant="ghost" onClick={() => setStep("template")}>
                                    Partir d'un template
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    ) : step === 'document-structure' && parsedDocument?.document ? (
                        <motion.div
                            key="document-structure"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStep('customize');
                                    setParsedDocument(null);
                                    setParseToken(null);
                                }}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                {t('common.back')}
                            </Button>

                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">{t('create.configureGeneration')}</h2>
                                <p className="text-muted-foreground">
                                    {t('create.selectChapters')}
                                </p>
                            </div>

                            <DocumentStructureStep
                                document={parsedDocument.document}
                                onConfirm={handleGenerateFromSections}
                                onCancel={() => {
                                    setStep('customize');
                                    setParsedDocument(null);
                                    setParseToken(null);
                                }}
                                isGenerating={isGenerating}
                            />
                        </motion.div>
                    ) : step === 'storyboard' ? (
                        <motion.div
                            key="storyboard"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setStep('customize')}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Retour au brief
                            </Button>

                            <PromptStoryboardStep
                                template={selectedTemplate ? getTemplateById(selectedTemplate) : null}
                                requestedSlides={slides[0]}
                                prompt={vision}
                                onBack={() => setStep('customize')}
                                onConfirm={handleGenerate}
                                isGenerating={isGenerating}
                            />
                        </motion.div>
                    ) : step === 'template' ? (
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

                            <div className="flex flex-col-reverse sm:flex-row justify-center gap-4">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedTemplate(null);
                                        setStep('customize');
                                    }}
                                    className="w-full sm:w-auto"
                                >
                                    {t('create.skipStep')}
                                </Button>

                                <Button
                                    size="lg"
                                    onClick={() => {
                                        if (!selectedTemplate) {
                                            toast({
                                                title: t('create.templateRequired'),
                                                description: t('create.templateRequiredMsg'),
                                                variant: "destructive",
                                            });
                                            return;
                                        }
                                        setVision((current) => current.trim() ? current : getTemplateStarterPrompt(selectedTemplate));
                                        setStep('customize');
                                    }}
                                    className="bg-gradient-to-r from-primary to-secondary text-white gap-2 w-full sm:w-auto"
                                >
                                    <div className="flex flex-col items-start gap-0.5">
                                        <span className="text-base font-bold leading-none">{t('create.continue')}</span>
                                        <span className="text-[10px] font-medium opacity-80">{t('create.continueSub')}</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 ml-1" />
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
                                {t('create.backToTemplates')}
                            </Button>

                            {/* Selected template preview */}
                            {selectedTemplate && (
                                <div className="text-center space-y-2">
                                    <p className="text-sm text-muted-foreground">{t('create.selectedTemplate')}</p>
                                    <h3 className="text-xl font-semibold">{getTemplateById(selectedTemplate)?.name}</h3>
                                </div>
                            )}

                            {blogAttribution && (
                                <div className="mx-auto max-w-3xl rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground/80">
                                    <span className="font-semibold text-primary">Brief pre-rempli depuis le blog : </span>
                                    {blogAttribution.postTitle}
                                </div>
                            )}

                            <div className="text-center space-y-4">
                                <h1 className="text-4xl md:text-5xl font-bold">
                                    {t('create.aiTitle')} <span className="text-gradient">{t('create.aiTitleHighlight')}</span>
                                </h1>
                                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                    {t('create.aiSubtitle')}
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
                                                    placeholder={t('create.placeholder')}
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
                                                            <div className="flex items-center gap-2">
                                                                {/* Button to configure chapters if document was parsed */}
                                                                {parsedDocument?.document && parsedDocument.document.sections.length > 1 && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setStep('document-structure')}
                                                                        className="text-xs h-7 px-2"
                                                                    >
                                                                        <FileText className="w-3 h-3 mr-1" />
                                                                        {t('create.chapters', { count: parsedDocument.document.sections.length })}
                                                                    </Button>
                                                                )}
                                                                {isParsing && (
                                                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        setAttachedFile(null);
                                                                        setParsedDocument(null);
                                                                        setParseToken(null);
                                                                    }}
                                                                    className="text-muted-foreground hover:text-destructive transition-colors p-1 hover:bg-destructive/10 rounded-full"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
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
                                                            accept=".pdf,.doc,.docx,.txt,.md,.pptx"
                                                        />

                                                        <div className={`
                                                            w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors
                                                            ${isDragging ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
                                                        `}>
                                                            {isDragging ? <ArrowRight className="w-5 h-5 animate-bounce" /> : <Paperclip className="w-5 h-5" />}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium">
                                                                {isDragging ? t('create.dropHere') : t('create.addFile')}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {t('create.dragOrClick')}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Slider moves here - HIDDEN if document is attached (Smart Plan handles it) */}
                                                    {!parsedDocument && (
                                                        <div className="space-y-3 px-1">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-xs font-medium text-muted-foreground">{t('create.slideCount')}</label>
                                                                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-foreground">{slides[0]}</span>
                                                            </div>
                                                            <Slider
                                                                value={slides}
                                                                onValueChange={setSlides}
                                                                min={5}
                                                                max={50}
                                                                step={1}
                                                                className="py-2"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Language Selector */}
                                                    <div className="space-y-3 px-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                                <Globe className="w-3 h-3" />
                                                                {t('create.contentLanguage')}
                                                            </label>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {(['en', 'fr', 'es'] as const).map((lang) => (
                                                                <button
                                                                    key={lang}
                                                                    type="button"
                                                                    onClick={() => setContentLanguage(lang)}
                                                                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${contentLanguage === lang
                                                                        ? 'bg-primary text-white border-primary'
                                                                        : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                                                                        }`}
                                                                >
                                                                    {t(`create.languages.${lang}`)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Brand Kit Selector */}
                                                    <div className="space-y-3 px-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-xs font-medium text-muted-foreground">{t('create.brandKit')}</label>
                                                        </div>
                                                        <BrandKitSelector
                                                            selectedKit={selectedBrandKit}
                                                            onSelect={setSelectedBrandKit}
                                                            disabled={!canUseBrandKit}
                                                        />
                                                        {!canUseBrandKit && (
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Activez Pro pour appliquer vos couleurs, polices et logos a la generation.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-auto pt-2">
                                                    <Button
                                                        size="lg"
                                                        onClick={handlePrepareStoryboard}
                                                        disabled={(!vision.trim() && !attachedFile) || isGenerating}
                                                        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-glow hover:shadow-glow-hover text-white font-semibold rounded-lg group h-12"
                                                    >
                                                        {isGenerating ? (
                                                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                                        ) : (
                                                            <div className="flex items-center gap-2 justify-center">
                                                                <Zap className="w-4 h-4 fill-current" />
                                                                <span>{parsedDocument?.document ? 'Configurer le plan' : 'Préparer le plan'}</span>
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

