import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Sparkles, Zap, Laptop, Shield, MessageSquare, Star } from "lucide-react";
import { SEO } from "@/components/common/SEO";

export default function PDFToPowerPoint() {
    const navigate = useNavigate();

    const faqs = [
        {
            q: "Quel est le format de fichier accepté ?",
            r: "PDF, Word, PowerPoint, images (JPG, PNG)"
        },
        {
            q: "Combien de temps pour convertir un PDF ?",
            r: "30 secondes en moyenne, peu importe la taille"
        },
        {
            q: "Puis-je modifier la présentation après conversion ?",
            r: "Oui, 100% modifiable dans PowerPoint"
        },
        {
            q: "Y a-t-il une limite de fichier ?",
            r: "Max 50 Mo par fichier"
        },
        {
            q: "Est-ce vraiment gratuit ?",
            r: "Oui, 7€ de test gratuit (annulez quand vous voulez)"
        },
        {
            q: "Mes données sont-elles sécurisées ?",
            r: "Oui, chiffrement SSL, suppression auto après 24h"
        }
    ];

    return (
        <div className="min-h-screen w-full relative pt-20 overflow-x-hidden">
            <SEO
                title="Convertir PDF en PowerPoint Gratuit | SlideAI"
                description="Transformez vos PDF en présentations PowerPoint en quelques secondes avec l'IA. Gratuit, rapide et sans inscription. Essayez maintenant."
            />

            <Helmet>
                <link rel="alternate" hrefLang="fr" href="https://www.slideai.fr/pdf-to-powerpoint" />
                <link rel="alternate" hrefLang="en" href="https://www.slideai.fr/en/pdf-to-powerpoint" />
                <link rel="alternate" hrefLang="x-default" href="https://www.slideai.fr/pdf-to-powerpoint" />

                {/* HowTo Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "HowTo",
                        "name": "Comment convertir un PDF en PowerPoint",
                        "description": "Convertissez votre PDF en PowerPoint en 30 secondes avec l'IA",
                        "image": "https://www.slideai.fr/images/pdf-to-powerpoint.jpg",
                        "step": [
                            {
                                "@type": "HowToStep",
                                "name": "Télécharger votre PDF",
                                "text": "Glissez-déposez votre fichier PDF sur SlideAI"
                            },
                            {
                                "@type": "HowToStep",
                                "name": "L'IA analyse et crée",
                                "text": "Notre IA crée automatiquement des slides professionnelles en 30 secondes"
                            },
                            {
                                "@type": "HowToStep",
                                "name": "Télécharger votre PowerPoint",
                                "text": "Récupérez votre présentation PowerPoint prête à l'emploi"
                            }
                        ]
                    })}
                </script>

                {/* Product Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Product",
                        "name": "SlideAI - Convertir PDF en PowerPoint",
                        "description": "Convertissez vos PDF en présentations PowerPoint en 30 secondes avec l'IA",
                        "brand": {
                            "@type": "Brand",
                            "name": "SlideAI"
                        },
                        "offers": {
                            "@type": "Offer",
                            "price": "7",
                            "priceCurrency": "EUR",
                            "availability": "https://schema.org/InStock"
                        },
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.8",
                            "reviewCount": "50"
                        }
                    })}
                </script>

                {/* FAQ Schema */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": faqs.map(faq => ({
                            "@type": "Question",
                            "name": faq.q,
                            "acceptedAnswer": {
                                "@type": "Answer",
                                "text": faq.r
                            }
                        }))
                    })}
                </script>
            </Helmet>

            {/* Grid Background */}
            <div className="fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center text-sm text-foreground/60 hover:text-primary transition-colors mb-12 group"
                >
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Retour à l'accueil
                </button>

                {/* SECTION 1 : HERO */}
                <section className="text-center space-y-8 mb-32">
                    <div className="inline-flex items-center px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Nouveau : Conversion PDF intelligente v2.0
                    </div>

                    <h1 className="text-4xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground to-foreground/50 leading-tight">
                        Convertir PDF en PowerPoint <br />
                        <span className="text-primary italic">en Secondes avec l'IA</span>
                    </h1>

                    <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
                        Transformez vos documents en présentations professionnelles sans effort.
                        <br />
                        <span className="text-sm font-semibold text-primary mt-2 inline-block">✓ 500+ freelancers utilisent SlideAI</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button
                            size="lg"
                            onClick={() => navigate("/create")}
                            className="h-14 px-8 text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground"
                        >
                            Essayer gratuitement (7€)
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button
                            variant="link"
                            onClick={() => {
                                const element = document.getElementById('how-it-works');
                                element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="h-14 px-8 text-base text-foreground/60 hover:text-primary"
                        >
                            Voir la démo
                        </Button>
                    </div>
                </section>

                {/* SECTION 2 : PROBLÈME + SOLUTION */}
                <section className="mb-32 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold">Pourquoi convertir un PDF en PowerPoint ?</h2>
                        <div className="space-y-4 text-foreground/70 leading-relaxed">
                            <p>
                                Vous avez un PDF (rapport client, contrat, document stratégique) et vous devez le transformer en présentation PowerPoint pour votre réunion demain ?
                            </p>
                            <p>
                                Normalement, cela prend 2-3 heures de travail manuel : copier-coller le texte, redimensionner les images, créer une mise en page cohérente...
                            </p>
                            <p className="font-semibold text-foreground">
                                Avec SlideAI, c'est différent. Notre IA convertit votre PDF en PowerPoint professionnel en 30 secondes.
                            </p>
                            <div className="grid grid-cols-2 gap-3 pt-4">
                                {['Freelancer', 'Consultant', 'Coach', 'Manager'].map((item) => (
                                    <div key={item} className="flex items-center text-sm gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border border-border/50 aspect-video flex items-center justify-center">
                        <FileText className="w-20 h-20 text-primary opacity-50" />
                    </div>
                </section>

                {/* SECTION 3 : COMMENT ÇA MARCHE */}
                <section id="how-it-works" className="mb-32 py-16 px-8 bg-foreground/5 rounded-3xl border border-border/50">
                    <h2 className="text-3xl font-bold text-center mb-16">Comment convertir un PDF en PowerPoint avec SlideAI ?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { step: "1️⃣", title: "Télécharger votre PDF", desc: "Glissez-déposez votre fichier PDF sur SlideAI (ou cliquez pour parcourir). Nous acceptons les PDF jusqu'à 50 Mo." },
                            { step: "2️⃣", title: "L'IA analyse et crée", desc: "Notre IA analyse le contenu de votre PDF et crée automatiquement des slides professionnelles en 30 secondes." },
                            { step: "3️⃣", title: "Télécharger votre PowerPoint", desc: "Récupérez votre présentation PowerPoint prête à l'emploi. Vous pouvez la modifier à 100% dans PowerPoint." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-4 text-center">
                                <div className="text-4xl mb-4">{item.step}</div>
                                <h3 className="text-xl font-bold">{item.title}</h3>
                                <p className="text-foreground/60 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 4 : AVANTAGES CLÉS */}
                <section className="mb-32 space-y-16">
                    <h2 className="text-3xl font-bold text-center">Pourquoi choisir SlideAI pour convertir PDF en PowerPoint ?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { title: "✅ Rapide", desc: "30 secondes vs 2-3 heures manuellement. Gagnez 2-3 heures par conversion." },
                            { title: "✅ Gratuit", desc: "Essayez gratuitement (7€ de test). Sans engagement." },
                            { title: "✅ Professionnel", desc: "L'IA crée des slides avec une mise en page et une hiérarchie visuelle claire." },
                            { title: "✅ Modifiable", desc: "100% personnalisable. Modifiez le texte, les couleurs et les images." },
                            { title: "✅ Sans inscription", desc: "Commencez immédiatement sans créer de compte pour tester." },
                            { title: "✅ Sécurisé", desc: "Chiffrement SSL et suppression auto après 24h. Vos données sont protégées." }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-background border border-border/50 rounded-xl space-y-2">
                                <h3 className="font-bold text-lg">{item.title}</h3>
                                <p className="text-foreground/60 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <Button
                            size="lg"
                            onClick={() => navigate("/create")}
                            className="h-14 px-12 bg-primary hover:bg-primary/90 rounded-xl font-bold"
                        >
                            Convertir mon PDF maintenant
                        </Button>
                    </div>
                </section>

                {/* SECTION 5 : CAS D'USAGE DÉTAILLÉS */}
                <section className="mb-32 space-y-16">
                    <h2 className="text-3xl font-bold text-center">Exemples concrets : qui utilise PDF to PowerPoint ?</h2>
                    <div className="grid grid-cols-1 gap-8">
                        {[
                            { icon: <Zap className="w-6 h-6" />, title: "Freelancer - Pitch deck client", desc: "Votre client vous envoie un rapport PDF de 20 pages. Vous devez créer un pitch deck demain. Gain de temps : 2 heures." },
                            { icon: <Laptop className="w-6 h-6" />, title: "Consultant - Présentation stratégique", desc: "Transformez vos documents de 20 pages en une présentation structurée pour un comité de direction." },
                            { icon: <Sparkles className="w-6 h-6" />, title: "Coach - Contenu de formation", desc: "Convertissez vos PDF de formation en slides prêts à l'emploi pour vos plateformes de cours." },
                            { icon: <FileText className="w-6 h-6" />, title: "Manager - Rapport mensuel", desc: "Transformez vos rapports d'activité en une présentation visuelle percutante en 30 secondes." }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-6 p-8 bg-foreground/3 rounded-2xl border border-border/50 items-start">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                    {item.icon}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">{item.title}</h3>
                                    <p className="text-foreground/60 leading-relaxed">{item.desc}</p>
                                    <p className="text-primary font-semibold text-sm">→ Résultat : Présentation professionnelle en 30 sec</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 6 : FAQ */}
                <section className="mb-32 space-y-16">
                    <h2 className="text-3xl font-bold text-center">Questions fréquentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {faqs.map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex gap-3">
                                    <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-1" />
                                    <h3 className="font-bold">{item.q}</h3>
                                </div>
                                <p className="pl-8 text-foreground/60 text-sm leading-relaxed">{item.r}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 7 : ENGLISH SEO SECTION (OPPORTUNITY #2) */}
                <section className="mb-32 p-12 bg-primary/5 rounded-3xl border border-primary/10">
                    <h2 className="text-3xl font-bold mb-6">Convert PDF to PowerPoint Online - Free Tool</h2>
                    <div className="prose prose-invert max-w-none text-foreground/70">
                        <p className="mb-4">
                            Looking for a fast and reliable way to <strong>convert PDF to PowerPoint</strong>? SlideAI uses advanced artificial intelligence to transform your static PDF documents into dynamic, editable PPT slides in seconds. Whether it's a client report, a research paper, or a business proposal, our AI analyzes the layout and content to create a professional presentation that saves you hours of manual work.
                        </p>
                        <p className="mb-4">
                            Why use SlideAI as your primary <strong>PDF to PPT converter</strong>? Unlike traditional converters that just embed images of your PDF onto slides, SlideAI reconstructs the text and structure, making it 100% editable in Microsoft PowerPoint or Google Slides.
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-6">
                            <li>Fast: 30-second conversion.</li>
                            <li>Smart: AI-powered layout reconstruction.</li>
                            <li>Free to try: Get started with our trial plan.</li>
                            <li>Secure: Your data is encrypted and deleted automatically.</li>
                        </ul>
                        <div className="flex justify-center mt-8">
                            <Button
                                size="lg"
                                onClick={() => navigate("/create")}
                                className="h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold"
                            >
                                Start Converting Now
                            </Button>
                        </div>
                    </div>
                </section>

                {/* SECTION 7 : PRICING + CTA FINAL */}
                <section className="mb-32 p-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-3xl border border-primary/20 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-12">Commencer gratuitement</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                        <div className="p-8 bg-background border border-border/50 rounded-2xl space-y-4">
                            <h3 className="text-xl font-bold">Plan Gratuit (7€ test)</h3>
                            <ul className="text-sm text-foreground/60 space-y-2 text-left">
                                <li>• 5 conversions/mois</li>
                                <li>• Fichiers jusqu'à 50 Mo</li>
                                <li>• Support par email</li>
                                <li>• Annulation facile</li>
                            </ul>
                            <Button onClick={() => navigate("/create")} className="w-full h-12 rounded-xl font-bold bg-primary mt-4">Essayer gratuitement</Button>
                        </div>
                        <div className="p-8 bg-background/50 border border-primary/30 rounded-2xl space-y-4 relative overflow-hidden">
                            <div className="absolute top-4 right-4 text-[10px] font-bold bg-primary text-foreground px-2 py-1 rounded-full uppercase tracking-tighter">Populaire</div>
                            <h3 className="text-xl font-bold">Plan Pro (19€/mois)</h3>
                            <ul className="text-sm text-foreground/60 space-y-2 text-left">
                                <li>• Conversions illimitées</li>
                                <li>• Fichiers jusqu'à 500 Mo</li>
                                <li>• Support prioritaire</li>
                                <li>• Intégrations API</li>
                            </ul>
                            <Button variant="outline" onClick={() => navigate("/pricing")} className="w-full h-12 rounded-xl font-bold mt-4">Voir tous les plans</Button>
                        </div>
                    </div>
                </section>

                {/* SECTION 8 : SOCIAL PROOF */}
                <section className="text-center space-y-12">
                    <h2 className="text-3xl font-bold">Rejoignez 500+ utilisateurs satisfaits</h2>
                    <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-6 h-6 text-yellow-500 fill-yellow-500" />)}
                        <span className="ml-3 font-bold text-lg">4.8/5</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Freelancer, consultant", quote: "J'ai gagné 2 heures par semaine." },
                            { name: "Coach marketing", quote: "Parfait pour mes présentations clients." },
                            { name: "Agence de communication", quote: "Outil indispensable pour mon agence." }
                        ].map((item, i) => (
                            <div key={i} className="p-6 italic text-foreground/60 text-sm border-l-2 border-primary/30">
                                "{item.quote}"
                                <p className="mt-4 not-italic font-bold text-foreground">{item.name}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
