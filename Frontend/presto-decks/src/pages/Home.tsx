import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Hero } from "@/components/home/Hero";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { WhyFreelance } from "@/components/home/WhyFreelance";
import { HowItWorks } from "@/components/home/HowItWorks";
import { OfferSection } from "@/components/home/OfferSection";
import { SubscriptionSection } from "@/components/home/SubscriptionSection";
import { FaqSection } from "@/components/home/FaqSection";
import { DemoFlowSection } from "@/components/home/DemoFlowSection";
import { BeforeAfterSection } from "@/components/home/BeforeAfterSection";
import { StickyTrialCta } from "@/components/home/StickyTrialCta";
import { BusinessSeoSection } from "@/components/home/BusinessSeoSection";
import { SEO } from "@/components/common/SEO";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function Home() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");
  const seoTitle = isFr
    ? "Générateur PowerPoint IA | Créez vos présentations en 30 secondes"
    : "AI PowerPoint Generator | Create presentations in 30 seconds";
  const seoDescription = isFr
    ? "Le générateur PowerPoint IA pour créer un PowerPoint avec IA, générer une présentation automatiquement et livrer plus vite. Essai 7 jours sans carte bancaire."
    : "Use AI to create presentations automatically from your client docs. Start a 7-day trial with no credit card.";
  const seoKeywords = isFr
    ? "générateur PowerPoint IA, créer un PowerPoint avec IA, IA pour faire un PowerPoint, générer une présentation automatiquement, outil IA présentation"
    : "ai powerpoint generator, create powerpoint with ai, ai for powerpoint, generate presentation automatically, ai presentation tool";
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "SlideAI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      category: isFr ? "Essai gratuit 7 jours" : "7-day free trial",
    },
    description: seoDescription,
  };
  const faqItems = [
    {
      q: t("faq.questions.trial.q"),
      a: t("faq.questions.trial.a"),
    },
    {
      q: t("faq.questions.deliver.q"),
      a: t("faq.questions.deliver.a"),
    },
    {
      q: t("faq.questions.pdf.q"),
      a: t("faq.questions.pdf.a"),
    },
    {
      q: t("faq.questions.security.q"),
      a: t("faq.questions.security.a"),
    },
    {
      q: t("faq.questions.usage.q"),
      a: t("faq.questions.usage.a"),
    },
    {
      q: isFr ? "La qualité est-elle suffisante pour un comité de direction ?" : "Is the quality good enough for executive reviews?",
      a: isFr
        ? "Oui. Vous obtenez une base claire et professionnelle, puis vous ajustez les messages clés avant livraison."
        : "Yes. You get a clear professional draft, then refine key messages before delivery.",
    },
    {
      q: isFr ? "Mes documents clients restent-ils confidentiels ?" : "Do my client documents stay confidential?",
      a: isFr
        ? "Les documents sont traités de façon sécurisée. Vous gardez le contrôle sur ce que vous importez et exportez."
        : "Documents are handled through secure workflows. You keep control over what you import and export.",
    },
    {
      q: isFr ? "Puis-je garder la charte graphique du client ?" : "Can I keep the client's visual identity?",
      a: isFr
        ? "Oui. Vous pouvez adapter styles, couleurs et structure pour coller à votre contexte client."
        : "Yes. You can adapt style, colors, and structure to match your client context.",
    },
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "SlideAI",
    url: "https://www.slideai.fr/",
    inLanguage: isFr ? "fr-FR" : "en-US",
  };
  const handleBottomCta = () => {
    Analytics.trackEvent(
      ANALYTICS_EVENTS.ECOMMERCE.CATEGORY,
      ANALYTICS_EVENTS.ECOMMERCE.SELECT_PLAN,
      "Landing Bottom CTA - 7d Trial"
    );
    navigate(`/auth?returnTo=${encodeURIComponent("/create")}`);
  };

  return (
    <div className="min-h-screen w-full relative pb-16 md:pb-0">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        url="/"
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(softwareSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>

      {/* SlideAI DNA: Grid Background - Full Page */}
      <div className="fixed inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      {/* Hero Section */}
      <Hero />

      {/* Pourquoi Freelance */}
      <div id="pourquoi-outil-ia-presentation">
        <WhyFreelance />
      </div>

      {/* Comment ça marche */}
      <div id="creer-powerpoint-avec-ia">
        <HowItWorks />
      </div>

      <DemoFlowSection />

      {/* Outils (FeatureGrid) */}
      <FeatureGrid />

      <BusinessSeoSection />

      {/* Produit en action */}
      <div id="generer-presentation-automatiquement">
        <ProductShowcase />
      </div>

      <BeforeAfterSection />

      {/* Offre essai 7 jours */}
      <OfferSection />

      {/* Abonnement Pro */}
      <SubscriptionSection />

      {/* FAQ */}
      <FaqSection />

      {/* Bottom CTA Section */}
      <section id="creer-premiere-presentation-30-secondes" className="relative py-8 md:py-12 px-4 overflow-hidden border-t border-border/50">
        <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 md:w-96 h-60 md:h-96 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl opacity-40" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold px-2">
              {t('finalCta.title')}
            </h2>
            <p className="text-base md:text-lg text-foreground/60 max-w-2xl mx-auto px-4 whitespace-pre-line">
              {t('finalCta.subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 px-4">
            <Button
              size="lg"
              onClick={handleBottomCta}
              className="h-12 md:h-14 text-sm md:text-base font-bold rounded-xl bg-gradient-primary hover:shadow-neon-hover transition-all duration-300 group text-foreground w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {t('finalCta.button')}
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      <StickyTrialCta />
    </div>
  );
}
