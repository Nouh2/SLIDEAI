import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Hero } from "@/components/home/Hero";
import { DemoFlowSection } from "@/components/home/DemoFlowSection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { BentoOutputs } from "@/components/home/BentoOutputs";
import { BeforeAfterSection } from "@/components/home/BeforeAfterSection";
import { TestimonialBand } from "@/components/home/TestimonialBand";
import { PricingSection } from "@/components/home/PricingSection";
import { FaqSection } from "@/components/home/FaqSection";
import { BusinessSeoSection } from "@/components/home/BusinessSeoSection";
import { PromoBar } from "@/components/home/PromoBar";
import { StickyTrialCta } from "@/components/home/StickyTrialCta";
import { SEO } from "@/components/common/SEO";
import { toAbsoluteUrl } from "@/lib/localeRouting";
import { homePageContent } from "@/content/seo/marketingPages";

/**
 * Compact 8-section landing flow (was 11 sections):
 *   1. PromoBar (sticky)
 *   2. Hero (with TemplatePicker)
 *   3. DemoFlowSection (50s product video)
 *   4. HowItWorks (3 isometric SVG steps)
 *   5. BentoOutputs (6 real deck PNGs — replaces FeatureGrid + ProductShowcase)
 *   6. BeforeAfterSection (table)
 *   7. TestimonialBand (single dark quote)
 *   8. PricingSection (launch offer + 3 tiers — replaces OfferSection + SubscriptionSection + BottomCTA)
 *   9. FaqSection
 *   - BusinessSeoSection moved to bottom (SEO-only, low visual prominence)
 *   - WhyFreelance dropped (its bullets duplicated the H1 + BeforeAfter)
 */
export default function Home() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language.startsWith("fr");
  const pageContent = isFr ? homePageContent.fr : homePageContent.en;
  const seoTitle = pageContent.title;
  const seoDescription = pageContent.description;
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
      price: "9.90",
      priceCurrency: "EUR",
      category: isFr ? "Offre de lancement Pro" : "Pro launch offer",
    },
    description: seoDescription,
  };
  const faqItems = [
    { q: t("faq.questions.trial.q"), a: t("faq.questions.trial.a") },
    { q: t("faq.questions.deliver.q"), a: t("faq.questions.deliver.a") },
    { q: t("faq.questions.pdf.q"), a: t("faq.questions.pdf.a") },
    { q: t("faq.questions.security.q"), a: t("faq.questions.security.a") },
    { q: t("faq.questions.usage.q"), a: t("faq.questions.usage.a") },
    {
      q: isFr
        ? "La qualité est-elle suffisante pour un comité de direction ?"
        : "Is the quality good enough for executive reviews?",
      a: isFr
        ? "Oui. Vous obtenez une base claire et professionnelle, puis vous ajustez les messages clés avant livraison."
        : "Yes. You get a clear professional draft, then refine key messages before delivery.",
    },
    {
      q: isFr
        ? "Mes documents clients restent-ils confidentiels ?"
        : "Do my client documents stay confidential?",
      a: isFr
        ? "Les documents sont traités de façon sécurisée. Vous gardez le contrôle sur ce que vous importez et exportez."
        : "Documents are handled through secure workflows. You keep control over what you import and export.",
    },
    {
      q: isFr
        ? "Puis-je garder la charte graphique du client ?"
        : "Can I keep the client's visual identity?",
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
    url: toAbsoluteUrl("/", isFr ? "fr" : "en"),
    inLanguage: isFr ? "fr-FR" : "en-US",
  };
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SlideAI",
    url: "https://www.slideai.fr",
    logo: {
      "@type": "ImageObject",
      url: "https://www.slideai.fr/logo.png",
    },
  };

  return (
    <div className="min-h-screen w-full relative pb-16 md:pb-0">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        url="/"
        alternates={{ fr: "/", en: "/", "x-default": "/" }}
      />

      <Helmet>
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(softwareSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>

      {/* Static grid background — absolute, not fixed (no permanent compositor layer) */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
      ></div>

      {/* 1. Promo bar (sticky-ish at top of flow) */}
      <PromoBar />

      {/* 2. Hero with template picker */}
      <Hero />

      {/* 3. Demo video — section header + lazy mount */}
      <section className="relative z-10 px-4 pt-2 pb-8 md:pt-4 md:pb-12 lp-defer">
        <div className="mx-auto max-w-6xl text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {isFr ? "SlideAI en 50 secondes" : "SlideAI in 50 seconds"}
          </h2>
          <p className="mt-2 text-base md:text-lg text-foreground/60">
            {isFr
              ? "Du brief importé au PowerPoint éditable. Tout le workflow en une seule prise."
              : "From imported brief to editable PowerPoint. The full workflow in one take."}
          </p>
        </div>
        <DemoFlowSection />
      </section>

      {/* 4. How it works (3 steps + isometric SVG illustrations) */}
      <div id="creer-powerpoint-avec-ia" className="lp-defer">
        <HowItWorks />
      </div>

      {/* 5. Bento outputs — 6 real deck use cases */}
      <div id="generer-presentation-automatiquement" className="lp-defer">
        <BentoOutputs />
      </div>

      {/* 6. Before / After comparison */}
      <div className="lp-defer">
        <BeforeAfterSection />
      </div>

      {/* 7. Single dark testimonial — visual break */}
      <div className="lp-defer">
        <TestimonialBand />
      </div>

      {/* 8. Unified pricing (launch offer + tiers) */}
      <div id="creer-premiere-presentation-30-secondes" className="lp-defer">
        <PricingSection />
      </div>

      {/* 9. FAQ */}
      <div className="lp-defer">
        <FaqSection />
      </div>

      {/* SEO footer block — low visual prominence, useful for crawlers */}
      <div id="pourquoi-outil-ia-presentation" className="lp-defer">
        <BusinessSeoSection />
      </div>

      <StickyTrialCta />
    </div>
  );
}
