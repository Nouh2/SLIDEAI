import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  homePageContent,
  businessSeoPages,
  pdfToPowerPointPageContent,
  seoLandingLinks,
} from "../src/content/seo/marketingPages.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = "https://www.slideai.fr";
const DIST_DIR = path.join(__dirname, "../dist");
const INDEX_PATH = path.join(DIST_DIR, "index.html");
const BUILD_DATE = new Date().toISOString().split("T")[0];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function extractAssetTags(indexHtml) {
  const matches = indexHtml.match(
    /<link rel="shortcut icon"[^>]+>|<link rel="icon"[^>]+>|<link rel="apple-touch-icon"[^>]+>|<link rel="preconnect"[^>]+>|<link href="https:\/\/fonts\.googleapis\.com[^>]+>|<script type="module"[^>]+><\/script>|<link rel="modulepreload"[^>]+>|<link rel="stylesheet"[^>]+>/g
  );

  return matches?.join("\n  ") ?? "";
}

function buildAlternateLinks(alternates = []) {
  return alternates
    .map((alternate) => `<link rel="alternate" hrefLang="${escapeHtml(alternate.hrefLang)}" href="${escapeHtml(alternate.href)}" />`)
    .join("\n  ");
}

function buildFaqJsonLd(faqs) {
  if (!faqs?.length) {
    return "";
  }

  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  })}</script>`;
}

function buildWebPageJsonLd({ title, canonicalUrl, description }) {
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: canonicalUrl,
    description,
  })}</script>`;
}

function renderHero(title, description, ctaLabel, ctaHref, secondaryLabel, secondaryHref, eyebrow) {
  const secondaryCta = secondaryLabel && secondaryHref
    ? `<a class="cta cta-secondary" href="${escapeHtml(secondaryHref)}">${escapeHtml(secondaryLabel)}</a>`
    : "";

  return `<section class="hero">
  <span class="eyebrow">${escapeHtml(eyebrow)}</span>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(description)}</p>
  <div class="cta-row">
    <a class="cta" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaLabel)}</a>
    ${secondaryCta}
  </div>
</section>`;
}

function renderFeatureGrid(items, title = "Highlights") {
  return `<section>
  <h2 class="section-title">${escapeHtml(title)}</h2>
  <div class="grid">${items
    .map(
      (item) => `<article class="card">
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.description)}</p>
  </article>`
    )
    .join("\n")}</div>
</section>`;
}

function renderSectionList(title, items) {
  return `<section>
  <h2 class="section-title">${escapeHtml(title)}</h2>
  <div class="stack">${items
    .map(
      (item) => `<article class="panel">
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.body)}</p>
  </article>`
    )
    .join("\n")}</div>
</section>`;
}

function renderFaqs(title, faqs) {
  if (!faqs?.length) {
    return "";
  }

  return `<section>
  <h2 class="section-title">${escapeHtml(title)}</h2>
  <div class="faq-list">${faqs
    .map(
      (faq) => `<article class="faq-item">
    <h3>${escapeHtml(faq.question)}</h3>
    <p>${escapeHtml(faq.answer)}</p>
  </article>`
    )
    .join("\n")}</div>
</section>`;
}

function renderLinkGrid(title, items) {
  return `<section>
  <h2 class="section-title">${escapeHtml(title)}</h2>
  <div class="grid">${items
    .map(
      (item) => `<a class="card" href="${escapeHtml(item.href)}">
    <h3>${escapeHtml(item.title)}</h3>
    <p>${escapeHtml(item.description)}</p>
  </a>`
    )
    .join("\n")}</div>
</section>`;
}

function buildDocument({ lang, title, description, canonicalUrl, alternates = [], body, jsonLd = [] }, assetTags) {
  const alternateMarkup = buildAlternateLinks(alternates);
  const jsonLdMarkup = jsonLd.filter(Boolean).join("\n  ");
  const homeUrl = lang === "en" ? `${DOMAIN}/en` : DOMAIN;
  const pricingUrl = lang === "en" ? `${DOMAIN}/en/pricing` : `${DOMAIN}/pricing`;
  const blogUrl = lang === "en" ? `${DOMAIN}/en/blog` : `${DOMAIN}/blog`;

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | SlideAI</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  ${alternateMarkup}
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)} | SlideAI" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${DOMAIN}/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)} | SlideAI" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${DOMAIN}/og-image.png" />
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Pretendard, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: linear-gradient(180deg, #fffdf8 0%, #f7fafc 220px); color: #0f172a; }
    a { text-decoration: none; color: inherit; }
    .shell { max-width: 1080px; margin: 0 auto; padding: 28px 20px 72px; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 28px; }
    .brand { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.03em; color: #111827; }
    .nav { display: flex; flex-wrap: wrap; gap: 14px; }
    .nav a { color: #475569; font-size: 0.95rem; }
    .hero { padding: 30px; border: 1px solid #e2e8f0; border-radius: 28px; background: rgba(255,255,255,0.92); box-shadow: 0 22px 48px rgba(15, 23, 42, 0.06); margin-bottom: 28px; }
    .eyebrow { display: inline-flex; margin-bottom: 14px; padding: 7px 12px; border-radius: 999px; background: #ecfeff; color: #155e75; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.02em; }
    .hero h1 { margin: 0 0 14px; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1.02; letter-spacing: -0.05em; }
    .hero p { margin: 0; max-width: 760px; color: #334155; font-size: 1.05rem; line-height: 1.8; }
    .cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
    .cta { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 18px; border-radius: 999px; background: #0f172a; color: #ffffff; font-weight: 700; }
    .cta-secondary { background: #e2e8f0; color: #0f172a; }
    .section-title { margin: 34px 0 14px; font-size: 1.45rem; letter-spacing: -0.03em; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }
    .card, .panel, .faq-item { padding: 22px; border: 1px solid #e2e8f0; border-radius: 22px; background: rgba(255,255,255,0.95); box-shadow: 0 18px 42px rgba(15, 23, 42, 0.05); }
    .card h3, .panel h3, .faq-item h3 { margin: 0 0 10px; font-size: 1.05rem; letter-spacing: -0.02em; }
    .card p, .panel p, .faq-item p { margin: 0; color: #475569; line-height: 1.75; }
    .stack, .faq-list { display: grid; gap: 16px; }
    .meta { margin-top: 28px; color: #64748b; font-size: 0.9rem; }
    @media (max-width: 640px) {
      .shell { padding-left: 16px; padding-right: 16px; }
      .hero, .card, .panel, .faq-item { padding: 18px; border-radius: 18px; }
    }
  </style>
  ${jsonLdMarkup}
  ${assetTags}
</head>
<body>
  <div id="root">
    <div class="shell">
      <div class="topbar">
        <a class="brand" href="${homeUrl}">SlideAI</a>
        <nav class="nav">
          <a href="${homeUrl}">${lang === "en" ? "Home" : "Accueil"}</a>
          <a href="${pricingUrl}">${lang === "en" ? "Pricing" : "Tarifs"}</a>
          <a href="${blogUrl}">Blog</a>
        </nav>
      </div>
      ${body}
      <p class="meta">Static SEO snapshot generated on ${BUILD_DATE}. The React app replaces this content after load.</p>
    </div>
  </div>
</body>
</html>`;
}

function getHomeLinkCards(locale) {
  if (locale === "en") {
    return [
      {
        href: `${DOMAIN}/pdf-to-powerpoint`,
        title: "Convert PDF to PowerPoint",
        description: "Capture direct intent from visitors who already have source material.",
      },
      {
        href: `${DOMAIN}/generateur-powerpoint-ia`,
        title: "French AI PowerPoint generator page",
        description: "Own the broad French query around AI-powered slide creation.",
      },
      {
        href: `${DOMAIN}/creer-powerpoint-avec-ia`,
        title: "How to create a PowerPoint with AI",
        description: "Answer the how-to intent with a tighter educational promise.",
      },
      {
        href: `${DOMAIN}/outil-ia-presentation`,
        title: "AI presentation tool",
        description: "Capture broader tool-discovery intent with internal links to the product pages.",
      },
    ];
  }

  return seoLandingLinks.map((item) => ({
    href: `${DOMAIN}${item.href}`,
    title: item.title,
    description: item.description,
  }));
}

function getPricingPages() {
  const pricingFaqFr = [
    { question: "Puis-je essayer SlideAI sans carte bancaire ?", answer: "Oui. SlideAI propose un essai Pro de 7 jours sans carte bancaire." },
    { question: "Quelle formule choisir ?", answer: "Pack Mission pour un besoin ponctuel, Pro pour un usage regulier, Business pour les equipes." },
    { question: "Les exports restent-ils modifiables ?", answer: "Oui. Les presentations exportees restent editables dans PowerPoint." },
  ];

  const pricingFaqEn = [
    { question: "Can I try SlideAI without a credit card?", answer: "Yes. SlideAI offers a 7-day Pro trial with no credit card required." },
    { question: "Which plan should I choose?", answer: "Pack Mission fits one-off needs, Pro fits recurring usage, Business fits team workflows." },
    { question: "Are exports editable in PowerPoint?", answer: "Yes. Generated presentations remain editable after export." },
  ];

  return [
    {
      outputPath: "pricing/index.html",
      lang: "fr",
      title: "Tarifs SlideAI",
      description: "Comparez les offres SlideAI pour generer des presentations PowerPoint avec l'IA selon votre rythme et votre volume.",
      canonicalUrl: `${DOMAIN}/pricing`,
      alternates: [
        { hrefLang: "fr", href: `${DOMAIN}/pricing` },
        { hrefLang: "en", href: `${DOMAIN}/en/pricing` },
        { hrefLang: "x-default", href: `${DOMAIN}/pricing` },
      ],
      body: [
        renderHero(
          "Des tarifs adaptes a la creation de presentations IA",
          "Choisissez une formule simple pour creer des slides plus vite, tester le produit sans carte, puis monter en puissance quand votre volume augmente.",
          "Demarrer l'essai 7 jours",
          "/auth?returnTo=%2Fpricing",
          "Voir le blog",
          "/blog",
          "Page tarifaire indexable"
        ),
        renderFeatureGrid([
          { title: "Pack Mission", description: "19 EUR pour un besoin ponctuel, sans abonnement." },
          { title: "Pack Trimestre", description: "39 EUR pour un besoin court avec plusieurs livrables." },
          { title: "Pro", description: "A partir de 14 EUR par mois en annuel ou 19 EUR au mois." },
          { title: "Business", description: "A partir de 24 EUR par mois en annuel ou 29 EUR au mois pour les equipes." },
        ], "Offres"),
        renderSectionList("Ce que vous obtenez", [
          { title: "Generation rapide", body: "Transformez du texte, des documents et des idees en slides structurees en quelques minutes." },
          { title: "Export modifiable", body: "Recuperez un PowerPoint editable pour finaliser votre message et votre design." },
          { title: "Essai sans friction", body: "Le parcours d'essai est concu pour permettre un premier usage sans carte bancaire." },
        ]),
        renderFaqs("Questions frequentes", pricingFaqFr),
      ].join("\n"),
      jsonLd: [
        buildWebPageJsonLd({ title: "Tarifs SlideAI", canonicalUrl: `${DOMAIN}/pricing`, description: "Page tarifaire SlideAI." }),
        buildFaqJsonLd(pricingFaqFr),
      ],
    },
    {
      outputPath: "en/pricing/index.html",
      lang: "en",
      title: "SlideAI Pricing",
      description: "Compare SlideAI plans for AI-powered PowerPoint generation, from one-off packs to recurring team usage.",
      canonicalUrl: `${DOMAIN}/en/pricing`,
      alternates: [
        { hrefLang: "fr", href: `${DOMAIN}/pricing` },
        { hrefLang: "en", href: `${DOMAIN}/en/pricing` },
        { hrefLang: "x-default", href: `${DOMAIN}/pricing` },
      ],
      body: [
        renderHero(
          "Pricing built for AI presentation workflows",
          "Choose a simple offer to generate better slides faster, start with a no-card trial, then upgrade when your workflow grows.",
          "Start 7-day trial",
          "/auth?returnTo=%2Fen%2Fpricing",
          "Read the blog",
          "/en/blog",
          "Indexable pricing page"
        ),
        renderFeatureGrid([
          { title: "Pack Mission", description: "EUR 19 for one-off presentation needs." },
          { title: "Pack Trimestre", description: "EUR 39 for a short burst of heavier usage." },
          { title: "Pro", description: "From EUR 14 monthly on annual billing or EUR 19 month-to-month." },
          { title: "Business", description: "From EUR 24 monthly on annual billing or EUR 29 month-to-month." },
        ], "Plans"),
        renderSectionList("What is included", [
          { title: "Fast generation", body: "Turn text, documents, and notes into structured slides in minutes." },
          { title: "Editable export", body: "Export a PowerPoint file your team can still edit after generation." },
          { title: "Low-friction trial", body: "The entry path helps users test value before committing." },
        ]),
        renderFaqs("Frequently asked questions", pricingFaqEn),
      ].join("\n"),
      jsonLd: [
        buildWebPageJsonLd({ title: "SlideAI Pricing", canonicalUrl: `${DOMAIN}/en/pricing`, description: "SlideAI pricing page." }),
        buildFaqJsonLd(pricingFaqEn),
      ],
    },
  ];
}

function getHomePages() {
  return [
    {
      outputPath: "index.html",
      lang: "fr",
      title: homePageContent.fr.title,
      description: homePageContent.fr.description,
      canonicalUrl: `${DOMAIN}/`,
      alternates: [
        { hrefLang: "fr", href: `${DOMAIN}/` },
        { hrefLang: "en", href: `${DOMAIN}/en` },
        { hrefLang: "x-default", href: `${DOMAIN}/` },
      ],
      body: [
        renderHero(
          homePageContent.fr.hero.headline,
          homePageContent.fr.hero.subtitle,
          homePageContent.fr.hero.primaryCta,
          "/auth?returnTo=%2Fcreate",
          homePageContent.fr.hero.secondaryCta,
          "/examples",
          homePageContent.fr.staticSections.eyebrow
        ),
        renderFeatureGrid(homePageContent.fr.staticSections.highlights, "Pourquoi SlideAI"),
        renderLinkGrid("Pages SEO prioritaires", getHomeLinkCards("fr")),
        renderFaqs(homePageContent.fr.staticSections.faqTitle, homePageContent.fr.staticSections.faqs),
      ].join("\n"),
      jsonLd: [
        buildWebPageJsonLd({ title: homePageContent.fr.title, canonicalUrl: `${DOMAIN}/`, description: homePageContent.fr.description }),
        buildFaqJsonLd(homePageContent.fr.staticSections.faqs),
      ],
    },
    {
      outputPath: "en/index.html",
      lang: "en",
      title: homePageContent.en.title,
      description: homePageContent.en.description,
      canonicalUrl: `${DOMAIN}/en`,
      alternates: [
        { hrefLang: "fr", href: `${DOMAIN}/` },
        { hrefLang: "en", href: `${DOMAIN}/en` },
        { hrefLang: "x-default", href: `${DOMAIN}/` },
      ],
      body: [
        renderHero(
          homePageContent.en.hero.headline,
          homePageContent.en.hero.subtitle,
          homePageContent.en.hero.primaryCta,
          "/auth?returnTo=%2Fcreate",
          homePageContent.en.hero.secondaryCta,
          "/en/examples",
          homePageContent.en.staticSections.eyebrow
        ),
        renderFeatureGrid(homePageContent.en.staticSections.highlights, "Why SlideAI"),
        renderLinkGrid("High-intent pages", getHomeLinkCards("en")),
        renderFaqs(homePageContent.en.staticSections.faqTitle, homePageContent.en.staticSections.faqs),
      ].join("\n"),
      jsonLd: [
        buildWebPageJsonLd({ title: homePageContent.en.title, canonicalUrl: `${DOMAIN}/en`, description: homePageContent.en.description }),
        buildFaqJsonLd(homePageContent.en.staticSections.faqs),
      ],
    },
  ];
}

function getBusinessPages() {
  return Object.values(businessSeoPages).map((page) => ({
    outputPath: `${page.url.replace(/^\//, "")}/index.html`,
    lang: "fr",
    title: page.title,
    description: page.description,
    canonicalUrl: `${DOMAIN}${page.url}`,
    alternates: [
      { hrefLang: "fr", href: `${DOMAIN}${page.url}` },
      { hrefLang: "x-default", href: `${DOMAIN}${page.url}` },
    ],
    body: [
      renderHero(
        page.h1,
        page.intro,
        "Demarrer l'essai 7 jours",
        "/auth?returnTo=%2Fcreate",
        "Voir les tarifs",
        "/pricing",
        page.keyword
      ),
      renderFeatureGrid(page.useCases.map((item, index) => ({ title: item, description: getUseCaseDescription(page, item, index) })), "Pour qui"),
      renderSectionList("Benefices", page.benefits.map((item, index) => ({ title: item, body: getBenefitDescription(page, item, index) }))),
      renderSectionList("Comment ca marche", page.howItWorks.map((item, index) => ({ title: `Etape ${index + 1}`, body: item }))),
      renderFaqs("Questions frequentes", page.faqs),
      renderLinkGrid("Pages et guides lies", seoLandingLinks
        .filter((item) => item.href !== page.url)
        .map((item) => ({
          href: `${DOMAIN}${item.href}`,
          title: item.title,
          description: item.description,
        }))),
    ].join("\n"),
    jsonLd: [
      buildWebPageJsonLd({ title: page.title, canonicalUrl: `${DOMAIN}${page.url}`, description: page.description }),
      buildFaqJsonLd(page.faqs),
    ],
  }));
}

function getUseCaseDescription(page, item, index) {
  const pageKeyword = (page.keyword || "presentation").toLowerCase();
  const templates = [
    `Transformez vos notes, briefs ou documents en deck ${pageKeyword} pret a finaliser pour un client ou une equipe.`,
    `Gagnez du temps sur la structuration et gardez la main sur les messages importants avant l'export.`,
    `Produisez une premiere version plus claire quand le fond existe deja mais que la mise en slides bloque encore.`,
    `Standardisez vos supports recurrents sans repartir d'une page blanche a chaque nouvelle mission.`,
  ];

  if (/consult|audit|strategie|seo|rh/i.test(item)) {
    return "Passez plus vite du diagnostic ou du rapport client a une presentation exploitable pour une restitution.";
  }

  if (/marketing|growth|business|direction/i.test(item)) {
    return "Structurez plus rapidement vos revues, plans d'action et supports de pilotage sans perdre le niveau de finition.";
  }

  if (/freelance|independant|recommandation/i.test(item)) {
    return "Livrez un premier jet professionnel plus vite, puis personnalisez les slides avant l'envoi au client.";
  }

  if (/equipe|B2B|deck|semaine/i.test(item)) {
    return "Gardez un rythme de production regulier avec des supports plus homogenes d'une semaine a l'autre.";
  }

  return templates[index % templates.length];
}

function getBenefitDescription(page, item, index) {
  if (/heures|temps|PowerPoint/i.test(item)) {
    return "SlideAI reduit le temps passe sur la structure initiale, le copier-coller et la mise en forme repetitive.";
  }

  if (/structure|message|depart|premier jet/i.test(item)) {
    return "Vous obtenez une base organisee avec des titres, sections et points cles que vous pouvez ajuster ensuite.";
  }

  if (/qualite|homogene|uniformiser|professionnel/i.test(item)) {
    return "Les decks gardent une logique de presentation claire, utile pour les livrables clients et les supports internes.";
  }

  if (/export|PPTX|PDF|PowerPoint/i.test(item)) {
    return "Une fois les slides finalisees dans SlideAI, vous pouvez exporter un fichier PowerPoint ou PDF pret a partager.";
  }

  const templates = [
    "La valeur vient du premier jet : une base claire a relire, enrichir et finaliser au lieu de partir de zero.",
    "Le workflow aide a passer plus vite de la matiere brute a un support presentable.",
    "Vous gardez le controle sur le fond tout en accelerant la mise en forme initiale.",
    "L'objectif est de produire plus regulierement des presentations exploitables en contexte professionnel.",
  ];

  return templates[index % templates.length];
}

function getPdfPage() {
  const page = pdfToPowerPointPageContent;

  return {
    outputPath: "pdf-to-powerpoint/index.html",
    lang: "fr",
    title: page.title,
    description: page.description,
    canonicalUrl: `${DOMAIN}${page.url}`,
    alternates: [
      { hrefLang: "fr", href: `${DOMAIN}${page.url}` },
      { hrefLang: "x-default", href: `${DOMAIN}${page.url}` },
    ],
    body: [
      renderHero(
        page.h1,
        page.intro,
        page.primaryCta,
        "/auth?returnTo=%2Fcreate",
        page.secondaryCta,
        "/examples",
        page.eyebrow
      ),
      renderFeatureGrid(page.highlights, "Pourquoi cette page est prioritaire"),
      renderSectionList("Comment ca marche", page.howItWorks.map((step, index) => ({ title: `Etape ${index + 1}`, body: step }))),
      renderSectionList("Cas d'usage", page.useCases.map((item) => ({ title: item.title, body: item.description }))),
      renderFaqs("Questions frequentes", page.faqs),
      renderLinkGrid("Pages et guides lies", seoLandingLinks
        .filter((item) => item.href !== page.url)
        .map((item) => ({
          href: `${DOMAIN}${item.href}`,
          title: item.title,
          description: item.description,
        }))),
    ].join("\n"),
    jsonLd: [
      buildWebPageJsonLd({ title: page.title, canonicalUrl: `${DOMAIN}${page.url}`, description: page.description }),
      buildFaqJsonLd(page.faqs),
    ],
  };
}

function getLegalPages() {
  return [
    {
      outputPath: "privacy/index.html",
      lang: "fr",
      title: "Politique de confidentialite",
      description: "Consultez la politique de confidentialite de SlideAI et le traitement des donnees utilisees par la plateforme.",
      canonicalUrl: `${DOMAIN}/privacy`,
      body: [
        renderHero(
          "Politique de confidentialite",
          "Presentation claire des donnees collectees, de leur usage et des garanties apportees par SlideAI.",
          "Contacter SlideAI",
          "mailto:contact@slideai.fr",
          "",
          "",
          "Legal page"
        ),
        renderSectionList("Principes essentiels", [
          { title: "Collecte", body: "SlideAI traite les informations de compte, les contenus importes, les prompts et certaines donnees techniques necessaires au service." },
          { title: "Usage", body: "Ces donnees servent a fournir le service, gerer le compte, assurer le support et executer les workflows de generation." },
          { title: "Sous-traitance IA", body: "Les contenus utilises pour la generation peuvent etre transmis a des fournisseurs techniques pour produire le resultat demande." },
          { title: "Droits", body: "Les utilisateurs peuvent demander l'acces, la rectification ou la suppression de leurs donnees selon la reglementation applicable." },
        ]),
      ].join("\n"),
      jsonLd: [buildWebPageJsonLd({ title: "Politique de confidentialite", canonicalUrl: `${DOMAIN}/privacy`, description: "Politique de confidentialite SlideAI." })],
    },
    {
      outputPath: "terms/index.html",
      lang: "fr",
      title: "Conditions generales d'utilisation",
      description: "Consultez les conditions generales d'utilisation de SlideAI et le cadre d'usage du service.",
      canonicalUrl: `${DOMAIN}/terms`,
      body: [
        renderHero(
          "Conditions generales d'utilisation",
          "Resume des conditions applicables a l'utilisation de SlideAI, de l'ouverture de compte a l'usage du service.",
          "Contacter SlideAI",
          "mailto:contact@slideai.fr",
          "",
          "",
          "Legal page"
        ),
        renderSectionList("Points cles", [
          { title: "Acces au service", body: "L'utilisateur doit fournir des informations exactes et garder ses acces securises." },
          { title: "Usage autorise", body: "SlideAI doit etre utilise dans le respect du droit applicable et sans contenu illicite ou abusif." },
          { title: "Facturation", body: "Les offres payantes sont regies par les tarifs affiches et les conditions de renouvellement associees." },
          { title: "Limites de responsabilite", body: "Le service est fourni pour accelerer la production de presentations, avec une verification finale qui reste sous controle utilisateur." },
        ]),
      ].join("\n"),
      jsonLd: [buildWebPageJsonLd({ title: "Conditions generales d'utilisation", canonicalUrl: `${DOMAIN}/terms`, description: "Conditions d'utilisation SlideAI." })],
    },
    {
      outputPath: "gdpr/index.html",
      lang: "fr",
      title: "Conformite RGPD",
      description: "Consultez les engagements SlideAI en matiere de protection des donnees personnelles et de conformite RGPD.",
      canonicalUrl: `${DOMAIN}/gdpr`,
      body: [
        renderHero(
          "Conformite RGPD",
          "Vue d'ensemble des engagements SlideAI sur la gestion des donnees personnelles dans un contexte europeen.",
          "Contacter SlideAI",
          "mailto:contact@slideai.fr",
          "",
          "",
          "Legal page"
        ),
        renderSectionList("Engagements", [
          { title: "Base legale", body: "Les traitements sont relies a la fourniture du service, a la gestion du compte et au support utilisateur." },
          { title: "Conservation", body: "Les donnees sont conservees selon la duree necessaire au service et aux obligations legales applicables." },
          { title: "Sous-traitants", body: "SlideAI s'appuie sur des prestataires techniques pour l'hebergement, l'authentification et certains workflows IA." },
          { title: "Droits des personnes", body: "Acces, rectification, suppression et opposition peuvent etre demandes selon le cadre RGPD." },
        ]),
      ].join("\n"),
      jsonLd: [buildWebPageJsonLd({ title: "Conformite RGPD", canonicalUrl: `${DOMAIN}/gdpr`, description: "Page RGPD SlideAI." })],
    },
  ];
}

function writePage(page, assetTags) {
  const outputPath = path.join(DIST_DIR, page.outputPath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, buildDocument(page, assetTags), "utf-8");
}

function generateStaticPages() {
  if (!fs.existsSync(INDEX_PATH)) {
    throw new Error(`Base Vite build not found: ${INDEX_PATH}`);
  }

  const baseIndexHtml = fs.readFileSync(INDEX_PATH, "utf-8");
  const assetTags = extractAssetTags(baseIndexHtml);
  const pages = [
    ...getHomePages(),
    ...getPricingPages(),
    getPdfPage(),
    ...getBusinessPages(),
    ...getLegalPages(),
  ];

  pages.forEach((page) => writePage(page, assetTags));
  console.log(`Generated ${pages.length} static SEO pages.`);
}

generateStaticPages();
