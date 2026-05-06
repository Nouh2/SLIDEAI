import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Laptop, MessageSquare, Sparkles, Zap } from "lucide-react";
import { SEO } from "@/components/common/SEO";
import { pdfToPowerPointPageContent } from "@/content/seo/marketingPages";
import { useLocalePath } from "@/hooks/use-locale-path";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function PDFToPowerPoint() {
    const navigate = useNavigate();
    const { localize } = useLocalePath();
    const page = pdfToPowerPointPageContent;
    const useCaseIcons = [<FileText className="w-6 h-6" />, <Laptop className="w-6 h-6" />, <Zap className="w-6 h-6" />];

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
            },
        })),
    };

    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "Comment convertir un PDF en PowerPoint avec SlideAI",
        description: page.description,
        step: page.howItWorks.map((step) => ({
            "@type": "HowToStep",
            text: step,
        })),
    };

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Accueil",
                item: "https://www.slideai.fr/",
            },
            {
                "@type": "ListItem",
                position: 2,
                name: page.title,
                item: `https://www.slideai.fr${page.url}`,
            },
        ],
    };

    const handlePrimaryCta = () => {
        Analytics.trackEvent(
            ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
            ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
            "SEO CTA - /pdf-to-powerpoint"
        );
        navigate(localize("/pricing", "fr"));
    };

    const handleExamplesCta = () => {
        Analytics.trackEvent("Navigation", "Examples Click", "SEO Secondary CTA - /pdf-to-powerpoint");
        navigate(localize("/examples", "fr"));
    };

    return (
        <div className="min-h-screen w-full relative pt-20 overflow-x-hidden">
            <SEO
                title={page.title}
                description={page.description}
                url={page.url}
                keywords="convertir pdf en powerpoint, transformer pdf en powerpoint, pdf en powerpoint, convertir un pdf en powerpoint"
                alternates={{ fr: page.url, "x-default": page.url }}
            />

            <Helmet>
                <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
                <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
                <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
            </Helmet>

            <div className="fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
                <button
                    onClick={() => navigate(localize("/", "fr"))}
                    className="flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-12 group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Retour a l'accueil
                </button>

                <section className="text-center space-y-8 mb-20">
                    <div className="inline-flex items-center px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
                        <Sparkles className="w-4 h-4 mr-2" />
                        {page.eyebrow}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight max-w-4xl mx-auto">
                        {page.h1}
                    </h1>

                    <p className="text-xl text-foreground/60 max-w-3xl mx-auto">{page.intro}</p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                        <Button
                            size="lg"
                            onClick={handlePrimaryCta}
                            className="h-14 px-8 text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground"
                        >
                            {page.primaryCta}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={handleExamplesCta}
                            className="h-14 px-8 text-base font-bold rounded-xl"
                        >
                            {page.secondaryCta}
                        </Button>
                    </div>
                </section>

                <section className="mb-16 space-y-10">
                    <div className="text-center space-y-3">
                        <h2 className="text-3xl font-bold">Pourquoi cette page convertit mieux</h2>
                        <p className="text-foreground/60 max-w-2xl mx-auto">
                            L'intention PDF vers PowerPoint est precise. Le visiteur sait ce qu'il veut faire et cherche une solution rapide.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {page.highlights.map((item) => (
                            <div key={item.title} className="p-6 bg-background border border-border/50 rounded-2xl space-y-3">
                                <h3 className="font-bold text-lg">{item.title}</h3>
                                <p className="text-foreground/60 text-sm leading-7">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-16 py-10 px-8 bg-foreground/5 rounded-3xl border border-border/50">
                    <h2 className="text-3xl font-bold text-center mb-10">Comment convertir un PDF en PowerPoint avec SlideAI</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {page.howItWorks.map((step, index) => (
                            <div key={step} className="rounded-2xl bg-background/70 border border-border/50 p-6 space-y-4 text-center">
                                <div className="text-sm font-bold text-primary">Etape {index + 1}</div>
                                <p className="text-foreground/80 leading-7">{step}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-16 space-y-10">
                    <div className="text-center space-y-3">
                        <h2 className="text-3xl font-bold">Cas d'usage prioritaires</h2>
                        <p className="text-foreground/60 max-w-2xl mx-auto">
                            La promesse n'est pas une conversion gadget, mais un vrai gain de temps sur des supports deja existants.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                        {page.useCases.map((item, index) => (
                            <div key={item.title} className="flex flex-col md:flex-row gap-5 p-6 bg-background border border-border/50 rounded-2xl items-start">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                    {useCaseIcons[index]}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">{item.title}</h3>
                                    <p className="text-foreground/60 leading-7">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-16 rounded-3xl border border-primary/20 bg-primary/5 p-8">
                    <h2 className="text-3xl font-bold mb-6 text-center">Ce que vous obtenez</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {page.highlights.map((item) => (
                            <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-background/70 p-5">
                                <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                                <div>
                                    <h3 className="font-semibold">{item.title}</h3>
                                    <p className="text-sm text-foreground/60 leading-7">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-16 space-y-10">
                    <h2 className="text-3xl font-bold text-center">Questions frequentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {page.faqs.map((faq) => (
                            <div key={faq.question} className="space-y-3 rounded-2xl border border-border/50 bg-background p-6">
                                <div className="flex gap-3">
                                    <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-1" />
                                    <h3 className="font-bold">{faq.question}</h3>
                                </div>
                                <p className="text-foreground/60 text-sm leading-7">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="text-center rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-10 space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold">Passez du PDF au deck editable plus vite</h2>
                    <p className="text-foreground/60 max-w-2xl mx-auto">
                        Essayez SlideAI pour transformer une matiere existante en base de presentation exploitable, puis finalisez le rendu dans PowerPoint.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" onClick={handlePrimaryCta} className="h-14 px-8 font-bold rounded-xl">
                            Profiter de l'offre a 2,99EUR
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => navigate(localize("/pricing", "fr"))} className="h-14 px-8 font-bold rounded-xl">
                            Voir les tarifs
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
