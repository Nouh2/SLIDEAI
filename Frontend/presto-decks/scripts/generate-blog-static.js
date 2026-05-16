import fs from "fs";
import path from "path";
import matter from "gray-matter";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = "https://www.slideai.fr";
const CONTENT_DIR = path.join(__dirname, "../src/content/blog");
const DIST_DIR = path.join(__dirname, "../dist");
const DEFAULT_OG_IMAGE = `${DOMAIN}/og-image.png`;

const CATEGORY_LABELS = {
  consulting: { fr: "Conseil", en: "Consulting" },
  marketing: { fr: "Marketing", en: "Marketing" },
  sales: { fr: "Commercial", en: "Sales" },
  finance: { fr: "Finance", en: "Finance" },
  hr: { fr: "RH", en: "HR" },
  "powerpoint-ia": { fr: "PowerPoint IA", en: "AI PowerPoint" },
  "pitch-deck": { fr: "Pitch deck", en: "Pitch deck" },
  competitive: { fr: "Alternatives et comparatifs", en: "Alternatives and comparisons" },
  productivity: { fr: "Productivite", en: "Productivity" },
  tutorials: { fr: "Tutoriels", en: "Tutorials" },
  tutoriels: { fr: "Tutoriels", en: "Tutorials" },
};

const PERSONA_LABELS = {
  "consultant-rh": { fr: "Consultant RH", en: "HR consultant" },
  "consultant-seo": { fr: "Consultant SEO", en: "SEO consultant" },
  "consultant-strategie": { fr: "Consultant strategie", en: "Strategy consultant" },
  "directeur-marketing": { fr: "Directeur marketing", en: "Marketing director" },
  "directeur-commercial": { fr: "Directeur commercial", en: "Sales director" },
  "analyste-financier": { fr: "Analyste financier", en: "Financial analyst" },
  "analyste-credit-bancaire": { fr: "Analyste credit bancaire", en: "Credit risk analyst" },
  "controleur-de-gestion": { fr: "Controleur de gestion", en: "Financial controller" },
  "consultant-erp": { fr: "Consultant ERP", en: "ERP consultant" },
  "consultant-transformation-organisationnelle": { fr: "Consultant transformation organisationnelle", en: "Organizational transformation consultant" },
  "responsable-marketing-produit": { fr: "Responsable marketing produit", en: "Product marketing manager" },
  "responsable-marketing-retail": { fr: "Responsable marketing retail", en: "Retail marketing manager" },
  "responsable-communication": { fr: "Responsable communication", en: "Communications manager" },
  recruteur: { fr: "Recruteur", en: "Recruiter" },
  freelance: { fr: "Freelance", en: "Freelancer" },
  "product-manager": { fr: "Product manager", en: "Product manager" },
  "sales-manager": { fr: "Sales manager", en: "Sales manager" },
  "agence-communication": { fr: "Agence de communication", en: "Communications agency" },
};

function normalizeLocale(value) {
  return String(value || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
}

function localizePath(routePath, locale) {
  return locale === "en" ? (routePath === "/" ? "/en" : `/en${routePath}`) : routePath;
}

function toAbsoluteUrl(routePath, locale) {
  return `${DOMAIN}${localizePath(routePath, locale)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatDate(dateValue, locale) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function deriveExcerpt(content, fallback = "SlideAI blog article.") {
  const cleaned = String(content)
    .replace(/^---[\s\S]*?---/, "")
    .replace(/^# .+$/m, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return fallback;
  }

  return cleaned.slice(0, 180).trim();
}

function stripLeadingHeading(content) {
  return String(content).replace(/^# .+\n+/, "").trim();
}

function getCategoryLabel(slug, locale) {
  return CATEGORY_LABELS[slug]?.[locale] || slug;
}

function getPersonaLabel(slug, locale) {
  return PERSONA_LABELS[slug]?.[locale] || slug;
}

function getPersonaDescription(slug, locale) {
  const label = getPersonaLabel(slug, locale);
  return locale === "en"
    ? `SlideAI guides for ${label.toLowerCase()} creating PowerPoint presentations in a B2B context.`
    : `Guides SlideAI pour ${label.toLowerCase()} qui cree des presentations PowerPoint dans un contexte B2B.`;
}

function getLocaleCopy(locale) {
  return locale === "en"
    ? {
        home: "Home",
        blog: "Blog",
        pricing: "Pricing",
        generator: "AI PowerPoint Generator",
        footer: "Static page optimized for Google indexing.",
        blogTitle: "SlideAI Blog",
        blogDescription: "Guides, comparisons, and practical advice to create better presentations with AI.",
        personas: "Job hubs",
        categories: "Categories",
        articles: "Articles",
        related: "Related articles",
      }
    : {
        home: "Accueil",
        blog: "Blog",
        pricing: "Tarifs",
        generator: "Generateur PowerPoint IA",
        footer: "Page statique optimisee pour l'indexation Google.",
        blogTitle: "Blog SlideAI",
        blogDescription: "Guides, comparatifs et conseils concrets pour creer des presentations PowerPoint plus vite avec l'IA.",
        personas: "Pages metier",
        categories: "Categories",
        articles: "Articles",
        related: "Articles lies",
      };
}

function parsePosts() {
  const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".md"));

  const posts = files.map((file) => {
    const slug = file.replace(".md", "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const locale = normalizeLocale(data.language);
    const categorySlug = data.category ? slugify(data.category) : "powerpoint-ia";
    const personaSlug = data.persona ? slugify(data.persona) : "";

    return {
      slug,
      title: data.title || slug,
      date: data.date || "",
      author: data.author || "SlideAI",
      excerpt: data.excerpt || deriveExcerpt(content, locale === "en" ? "SlideAI blog article." : "Article du blog SlideAI."),
      coverImage: data.coverImage || "",
      language: locale,
      category: categorySlug,
      persona: personaSlug,
      content: stripLeadingHeading(content),
    };
  });

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

function renderMarkdown(content) {
  const element = React.createElement(ReactMarkdown, null, content);
  return renderToStaticMarkup(element);
}

function splitContentForProductCta(content) {
  const headingMarker = "\n## ";
  const firstHeadingIndex = content.indexOf(headingMarker);

  if (firstHeadingIndex === -1) {
    return { beforeCta: content, afterCta: "" };
  }

  const secondHeadingIndex = content.indexOf(headingMarker, firstHeadingIndex + headingMarker.length);
  const splitIndex = secondHeadingIndex === -1 ? firstHeadingIndex : secondHeadingIndex;

  return {
    beforeCta: content.slice(0, splitIndex).trim(),
    afterCta: content.slice(splitIndex).trim(),
  };
}

function buildBlogCreateHref(postSlug, placement) {
  const params = new URLSearchParams({
    utm_source: "blog",
    utm_medium: "seo",
    utm_campaign: "blog_article_cta",
    utm_content: `${postSlug}_${placement}`,
  });

  return `/create?${params.toString()}`;
}

function renderBlogProductCta(post, locale, placement) {
  const isFr = locale === "fr";
  const createHref = buildBlogCreateHref(post.slug, placement);
  const examplesHref = localizePath("/examples", locale);

  return `<aside class="product-cta" data-analytics-event="blog_cta_click" data-post-slug="${escapeHtml(post.slug)}" data-placement="${escapeHtml(placement)}">
  <div>
    <span class="cta-eyebrow">${isFr ? "Essai gratuit 7 jours" : "7-day free trial"}</span>
    <h2>${isFr ? "Transformez ce guide en presentation" : "Turn this guide into a presentation"}</h2>
    <p>${isFr
      ? "Collez votre sujet ou importez un document. SlideAI structure les slides, applique un rendu professionnel et vous laisse exporter."
      : "Paste your topic or import a document. SlideAI structures the slides, designs the deck, and lets you export it."}</p>
  </div>
  <div class="product-cta-actions">
    <a class="product-cta-primary" href="${escapeHtml(createHref)}">${isFr ? "Tester avec mon sujet" : "Try with my topic"}</a>
    <a class="product-cta-secondary" href="${escapeHtml(examplesHref)}">${isFr ? "Voir des exemples" : "See examples"}</a>
  </div>
</aside>`;
}

function buildJsonLd(value) {
  return `<script type="application/ld+json">${JSON.stringify(value)}</script>`;
}

function buildAlternateLinks(alternates) {
  if (!alternates?.length) {
    return "";
  }

  return alternates
    .map((alternate) => `<link rel="alternate" hrefLang="${alternate.hrefLang}" href="${escapeHtml(alternate.href)}" />`)
    .join("\n  ");
}

function buildDocument({
  lang,
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  type = "website",
  body,
  jsonLd = [],
  alternates = [],
}) {
  const jsonLdMarkup = jsonLd.join("\n  ");
  const alternateMarkup = buildAlternateLinks(alternates);
  const localeCopy = getLocaleCopy(lang);

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
  <meta property="og:type" content="${escapeHtml(type)}" />
  <meta property="og:title" content="${escapeHtml(title)} | SlideAI" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)} | SlideAI" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 220px); color: #0f172a; }
    a { color: #0f766e; text-decoration: none; }
    a:hover { text-decoration: underline; }
    img { max-width: 100%; display: block; }
    .shell { max-width: 1040px; margin: 0 auto; padding: 24px 20px 72px; }
    .topbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .brand { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.02em; color: #0f172a; }
    .nav { display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.95rem; }
    .hero { padding: 28px; border: 1px solid #e2e8f0; border-radius: 24px; background: rgba(255,255,255,0.92); box-shadow: 0 20px 45px rgba(15, 23, 42, 0.06); margin-bottom: 28px; }
    .hero h1 { margin: 0 0 12px; font-size: clamp(2rem, 4vw, 3.4rem); line-height: 1.05; letter-spacing: -0.04em; }
    .hero p { margin: 0; font-size: 1.05rem; line-height: 1.7; color: #334155; max-width: 760px; }
    .meta { display: flex; flex-wrap: wrap; gap: 10px 18px; margin: 14px 0 0; color: #475569; font-size: 0.95rem; }
    .pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #ecfeff; color: #115e59; font-size: 0.82rem; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
    .card { height: 100%; padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px; background: rgba(255,255,255,0.94); box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05); }
    .card h2, .card h3 { margin: 0 0 10px; line-height: 1.2; letter-spacing: -0.03em; }
    .card p { margin: 0; color: #475569; line-height: 1.7; }
    .list { display: grid; gap: 18px; }
    .article-card { padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px; background: rgba(255,255,255,0.94); box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05); }
    .article-card img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 16px; margin-bottom: 16px; }
    .article-card h2 { margin: 0 0 10px; font-size: 1.45rem; letter-spacing: -0.03em; }
    .article-card p { margin: 0; color: #475569; line-height: 1.7; }
    .prose { padding: 28px; border: 1px solid #e2e8f0; border-radius: 24px; background: rgba(255,255,255,0.96); box-shadow: 0 20px 45px rgba(15, 23, 42, 0.06); }
    .prose h2, .prose h3, .prose h4 { margin-top: 1.6em; margin-bottom: 0.55em; line-height: 1.2; letter-spacing: -0.03em; }
    .prose p, .prose li, .prose blockquote { color: #1e293b; line-height: 1.85; font-size: 1.02rem; }
    .prose ul, .prose ol { padding-left: 1.4rem; }
    .prose code { padding: 0.1rem 0.35rem; border-radius: 6px; background: #f1f5f9; font-size: 0.95em; }
    .prose pre { overflow-x: auto; padding: 16px; border-radius: 16px; background: #0f172a; color: #e2e8f0; }
    .prose blockquote { margin: 1.5rem 0; padding-left: 1rem; border-left: 4px solid #99f6e4; color: #334155; }
    .product-cta { margin: 32px 0; padding: 22px; border: 1px solid #bae6fd; border-radius: 8px; background: #eff6ff; display: grid; gap: 18px; }
    .product-cta h2 { margin: 10px 0 8px; font-size: 1.35rem; letter-spacing: -0.03em; color: #0f172a; }
    .product-cta p { margin: 0; max-width: 660px; color: #334155; line-height: 1.7; }
    .cta-eyebrow { display: inline-flex; padding: 6px 10px; border: 1px solid #bae6fd; border-radius: 999px; background: #ffffff; color: #0284c7; font-size: 0.78rem; font-weight: 800; }
    .product-cta-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
    .product-cta-primary, .product-cta-secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 16px; border-radius: 8px; font-weight: 800; }
    .product-cta-primary { background: #0f172a; color: #ffffff; }
    .product-cta-secondary { border: 1px solid #cbd5e1; background: #ffffff; color: #0f172a; }
    .section-title { margin: 34px 0 14px; font-size: 1.5rem; letter-spacing: -0.03em; }
    .footer { margin-top: 34px; color: #64748b; font-size: 0.92rem; }
    @media (max-width: 640px) {
      .shell { padding-left: 16px; padding-right: 16px; }
      .hero, .prose, .article-card, .card { padding: 18px; border-radius: 18px; }
    }
  </style>
  ${jsonLdMarkup}
</head>
<body>
  <div class="shell">
    <div class="topbar">
      <a class="brand" href="${toAbsoluteUrl("/", lang)}">SlideAI</a>
      <nav class="nav">
        <a href="${toAbsoluteUrl("/", lang)}">${localeCopy.home}</a>
        <a href="${toAbsoluteUrl("/blog", lang)}">${localeCopy.blog}</a>
        <a href="${toAbsoluteUrl("/pricing", lang)}">${localeCopy.pricing}</a>
        <a href="${toAbsoluteUrl("/generateur-powerpoint-ia", "fr")}">${localeCopy.generator}</a>
      </nav>
    </div>
    ${body}
    <p class="footer">${localeCopy.footer}</p>
  </div>
</body>
</html>`;
}

function renderHubCards(items, prefix, locale) {
  if (items.length === 0) {
    return "";
  }

  return `<div class="grid">${items
    .map(
      (item) => `<a class="card" href="${toAbsoluteUrl(`${prefix}/${item.slug}`, locale)}">
  <h3>${escapeHtml(item.label)}</h3>
  <p>${escapeHtml(item.description)}</p>
</a>`
    )
    .join("\n")}</div>`;
}

function renderPostCards(posts, locale) {
  return `<div class="list">${posts
    .map((post) => {
      const image = post.coverImage
        ? `<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" />`
        : "";
      const personaPill = post.persona
        ? `<a class="pill" href="${toAbsoluteUrl(`/blog/metier/${post.persona}`, locale)}">${escapeHtml(getPersonaLabel(post.persona, locale))}</a>`
        : "";
      const categoryPill = post.category
        ? `<a class="pill" href="${toAbsoluteUrl(`/blog/c/${post.category}`, locale)}">${escapeHtml(getCategoryLabel(post.category, locale))}</a>`
        : "";

      return `<article class="article-card">
  ${image}
  <div class="meta">
    <span>${escapeHtml(formatDate(post.date, locale))}</span>
    <span>${escapeHtml(post.author)}</span>
    ${categoryPill}
    ${personaPill}
  </div>
  <h2><a href="${toAbsoluteUrl(`/blog/${post.slug}`, locale)}">${escapeHtml(post.title)}</a></h2>
  <p>${escapeHtml(post.excerpt)}</p>
</article>`;
    })
    .join("\n")}</div>`;
}

function buildDefaultAlternates(routePath, includeEnglish = true) {
  const alternates = [
    { hrefLang: "fr", href: toAbsoluteUrl(routePath, "fr") },
    { hrefLang: "x-default", href: toAbsoluteUrl(routePath, "fr") },
  ];

  if (includeEnglish) {
    alternates.splice(1, 0, { hrefLang: "en", href: toAbsoluteUrl(routePath, "en") });
  }

  return alternates;
}

function renderBlogIndex(posts, locale) {
  const localeCopy = getLocaleCopy(locale);
  const categories = [];
  const personas = [];
  const categoryMap = new Map();
  const personaMap = new Map();

  for (const post of posts) {
    if (post.category && !categoryMap.has(post.category)) {
      const categoryLabel = getCategoryLabel(post.category, locale);
      categoryMap.set(post.category, {
        slug: post.category,
        label: categoryLabel,
        description:
          locale === "en"
            ? `Browse all articles about ${categoryLabel.toLowerCase()}.`
            : `Voir tous les articles sur ${categoryLabel.toLowerCase()}.`,
      });
    }

    if (post.persona && !personaMap.has(post.persona)) {
      const personaLabel = getPersonaLabel(post.persona, locale);
      personaMap.set(post.persona, {
        slug: post.persona,
        label: personaLabel,
        description:
          locale === "en"
            ? `Browse all guides for ${personaLabel.toLowerCase()}.`
            : `Voir les guides pour ${personaLabel.toLowerCase()}.`,
      });
    }
  }

  categories.push(...categoryMap.values());
  personas.push(...personaMap.values());

  const body = `<section class="hero">
  <h1>${escapeHtml(localeCopy.blogTitle)}</h1>
  <p>${escapeHtml(localeCopy.blogDescription)}</p>
</section>
<section>
  <h2 class="section-title">${escapeHtml(localeCopy.personas)}</h2>
  ${renderHubCards(personas, "/blog/metier", locale)}
</section>
<section>
  <h2 class="section-title">${escapeHtml(localeCopy.categories)}</h2>
  ${renderHubCards(categories, "/blog/c", locale)}
</section>
<section>
  <h2 class="section-title">${escapeHtml(localeCopy.articles)}</h2>
  ${renderPostCards(posts, locale)}
</section>`;

  return buildDocument({
    lang: locale,
    title: localeCopy.blogTitle,
    description: localeCopy.blogDescription,
    canonicalUrl: toAbsoluteUrl("/blog", locale),
    body,
    jsonLd: [
      buildJsonLd({
        "@context": "https://schema.org",
        "@type": "Blog",
        name: localeCopy.blogTitle,
        url: toAbsoluteUrl("/blog", locale),
      }),
    ],
    alternates: buildDefaultAlternates("/blog"),
  });
}

function renderCategoryPage(categorySlug, posts, locale, hasEnglishEquivalent) {
  const label = getCategoryLabel(categorySlug, locale);
  const description =
    locale === "en"
      ? `SlideAI articles about ${label.toLowerCase()} to structure your presentations and strengthen internal linking.`
      : `Articles SlideAI sur ${label.toLowerCase()} pour structurer vos presentations et renforcer le maillage interne.`;

  const body = `<section class="hero">
  <h1>${escapeHtml(label)}</h1>
  <p>${escapeHtml(description)}</p>
</section>
<section>
  <h2 class="section-title">${escapeHtml(getLocaleCopy(locale).articles)}</h2>
  ${renderPostCards(posts, locale)}
</section>`;

  return buildDocument({
    lang: locale,
    title: `Blog ${label}`,
    description,
    canonicalUrl: toAbsoluteUrl(`/blog/c/${categorySlug}`, locale),
    body,
    jsonLd: [
      buildJsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `Blog ${label}`,
        url: toAbsoluteUrl(`/blog/c/${categorySlug}`, locale),
      }),
    ],
    alternates: buildDefaultAlternates(`/blog/c/${categorySlug}`, hasEnglishEquivalent),
  });
}

function renderPersonaPage(personaSlug, posts, locale, hasEnglishEquivalent) {
  const label = getPersonaLabel(personaSlug, locale);
  const description = getPersonaDescription(personaSlug, locale);

  const body = `<section class="hero">
  <h1>${escapeHtml(label)}</h1>
  <p>${escapeHtml(description)}</p>
</section>
<section>
  <h2 class="section-title">${escapeHtml(getLocaleCopy(locale).articles)}</h2>
  ${renderPostCards(posts, locale)}
</section>`;

  return buildDocument({
    lang: locale,
    title: `${label} PowerPoint IA`,
    description,
    canonicalUrl: toAbsoluteUrl(`/blog/metier/${personaSlug}`, locale),
    body,
    jsonLd: [
      buildJsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${label} PowerPoint IA`,
        url: toAbsoluteUrl(`/blog/metier/${personaSlug}`, locale),
      }),
    ],
    alternates: buildDefaultAlternates(`/blog/metier/${personaSlug}`, hasEnglishEquivalent),
  });
}

function renderPostPage(post, posts, locale, hasEnglishEquivalent) {
  const coverImage = post.coverImage
    ? `<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" />`
    : "";
  const categoryPill = post.category
    ? `<a class="pill" href="${toAbsoluteUrl(`/blog/c/${post.category}`, locale)}">${escapeHtml(getCategoryLabel(post.category, locale))}</a>`
    : "";
  const personaPill = post.persona
    ? `<a class="pill" href="${toAbsoluteUrl(`/blog/metier/${post.persona}`, locale)}">${escapeHtml(getPersonaLabel(post.persona, locale))}</a>`
    : "";

  const relatedPosts = posts
    .filter((candidate) => candidate.slug !== post.slug)
    .filter((candidate) => {
      if (post.persona && candidate.persona === post.persona) {
        return true;
      }

      return candidate.category === post.category;
    })
    .slice(0, 3);

  const relatedSection = relatedPosts.length
    ? `<section>
  <h2 class="section-title">${escapeHtml(getLocaleCopy(locale).related)}</h2>
  ${renderPostCards(relatedPosts, locale)}
</section>`
    : "";
  const splitContent = splitContentForProductCta(post.content);

  const body = `<section class="hero">
  <h1>${escapeHtml(post.title)}</h1>
  <p>${escapeHtml(post.excerpt)}</p>
  <div class="meta">
    <span>${escapeHtml(formatDate(post.date, locale))}</span>
    <span>${escapeHtml(post.author)}</span>
    ${categoryPill}
    ${personaPill}
  </div>
</section>
<section class="prose">
  ${coverImage}
  ${renderMarkdown(splitContent.beforeCta)}
  ${renderBlogProductCta(post, locale, "inline")}
  ${splitContent.afterCta ? renderMarkdown(splitContent.afterCta) : ""}
</section>
${relatedSection}
${renderBlogProductCta(post, locale, "bottom")}`;

  return buildDocument({
    lang: locale,
    title: post.title,
    description: post.excerpt,
    canonicalUrl: toAbsoluteUrl(`/blog/${post.slug}`, locale),
    ogImage: post.coverImage || DEFAULT_OG_IMAGE,
    type: "article",
    body,
    jsonLd: [
      buildJsonLd({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        dateModified: post.date,
        author: {
          "@type": "Organization",
          name: post.author,
        },
        publisher: {
          "@type": "Organization",
          name: "SlideAI",
          logo: {
            "@type": "ImageObject",
            url: `${DOMAIN}/logo.png`,
          },
        },
        image: post.coverImage ? [post.coverImage] : [DEFAULT_OG_IMAGE],
        mainEntityOfPage: toAbsoluteUrl(`/blog/${post.slug}`, locale),
      }),
    ],
    alternates: buildDefaultAlternates(`/blog/${post.slug}`, hasEnglishEquivalent),
  });
}

function writeFile(relativePath, content) {
  const outputPath = path.join(DIST_DIR, relativePath);
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, content, "utf-8");
}

function generateStaticBlog() {
  console.log("Generating fully static blog HTML...");

  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`Blog content directory not found: ${CONTENT_DIR}`);
    return;
  }

  const posts = parsePosts();
  const postsByLocale = {
    fr: posts.filter((post) => post.language === "fr"),
    en: posts.filter((post) => post.language === "en"),
  };

  for (const locale of ["fr", "en"]) {
    const localePosts = postsByLocale[locale];
    const alternatePosts = postsByLocale[locale === "fr" ? "en" : "fr"];
    const categories = new Map();
    const personas = new Map();

    writeFile(localizePath("/blog", locale).replace(/^\//, "") + "/index.html", renderBlogIndex(localePosts, locale));

    for (const post of localePosts) {
      if (post.category) {
        if (!categories.has(post.category)) {
          categories.set(post.category, []);
        }
        categories.get(post.category).push(post);
      }

      if (post.persona) {
        if (!personas.has(post.persona)) {
          personas.set(post.persona, []);
        }
        personas.get(post.persona).push(post);
      }

      writeFile(
        localizePath(`/blog/${post.slug}`, locale).replace(/^\//, "") + "/index.html",
        renderPostPage(post, localePosts, locale, alternatePosts.some((candidate) => candidate.slug === post.slug))
      );
    }

    for (const [categorySlug, categoryPosts] of categories.entries()) {
      writeFile(
        localizePath(`/blog/c/${categorySlug}`, locale).replace(/^\//, "") + "/index.html",
        renderCategoryPage(categorySlug, categoryPosts, locale, alternatePosts.some((post) => post.category === categorySlug))
      );
    }

    for (const [personaSlug, personaPosts] of personas.entries()) {
      writeFile(
        localizePath(`/blog/metier/${personaSlug}`, locale).replace(/^\//, "") + "/index.html",
        renderPersonaPage(personaSlug, personaPosts, locale, alternatePosts.some((post) => post.persona === personaSlug))
      );
    }
  }

  console.log(
    `Generated ${posts.length} post pages, ${
      new Set(posts.map((post) => `${post.language}:${post.category}`)).size
    } category pages and ${new Set(posts.filter((post) => post.persona).map((post) => `${post.language}:${post.persona}`)).size} persona pages.`
  );
}

generateStaticBlog();
