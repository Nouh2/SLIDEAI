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
const BLOG_DIST_DIR = path.join(DIST_DIR, "blog");
const DEFAULT_OG_IMAGE = `${DOMAIN}/og-image.png`;

const CATEGORY_LABELS = {
  consulting: "Conseil",
  marketing: "Marketing",
  sales: "Commercial",
  finance: "Finance",
  "powerpoint-ia": "PowerPoint IA",
  "pitch-deck": "Pitch deck",
  competitive: "Alternatives et comparatifs",
  productivity: "Productivite",
  tutorials: "Tutorials",
  tutoriels: "Tutoriels",
};

const PERSONA_LABELS = {
  "consultant-rh": "Consultant RH",
  "consultant-seo": "Consultant SEO",
  "consultant-strategie": "Consultant strategie",
  "directeur-marketing": "Directeur marketing",
  "directeur-commercial": "Directeur commercial",
  "analyste-financier": "Analyste financier",
  freelance: "Freelance",
  "product-manager": "Product manager",
  "sales-manager": "Sales manager",
};

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

function formatDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function deriveExcerpt(content, fallback = "Article du blog SlideAI.") {
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

function getCategoryLabel(slug) {
  return CATEGORY_LABELS[slug] || slug;
}

function getPersonaLabel(slug) {
  return PERSONA_LABELS[slug] || slug;
}

function getPersonaDescription(slug) {
  const label = getPersonaLabel(slug);
  return `Guides SlideAI pour ${label.toLowerCase()} qui cree des presentations PowerPoint dans un contexte B2B.`;
}

function parsePosts() {
  const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".md"));

  const posts = files.map((file) => {
    const slug = file.replace(".md", "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const categorySlug = data.category ? slugify(data.category) : "powerpoint-ia";
    const personaSlug = data.persona ? slugify(data.persona) : "";

    return {
      slug,
      title: data.title || slug,
      date: data.date || "",
      author: data.author || "SlideAI",
      excerpt: data.excerpt || deriveExcerpt(content),
      coverImage: data.coverImage || "",
      language: data.language || "fr",
      category: categorySlug,
      categoryLabel: getCategoryLabel(categorySlug),
      persona: personaSlug,
      personaLabel: personaSlug ? getPersonaLabel(personaSlug) : "",
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

function buildJsonLd(value) {
  return `<script type="application/ld+json">${JSON.stringify(value)}</script>`;
}

function buildDocument({
  lang = "fr",
  title,
  description,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  type = "website",
  body,
  jsonLd = [],
}) {
  const jsonLdMarkup = jsonLd.join("\n  ");

  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | SlideAI</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
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
      <a class="brand" href="${DOMAIN}/">SlideAI</a>
      <nav class="nav">
        <a href="${DOMAIN}/">Accueil</a>
        <a href="${DOMAIN}/blog">Blog</a>
        <a href="${DOMAIN}/pricing">Tarifs</a>
        <a href="${DOMAIN}/generateur-powerpoint-ia">Generateur PowerPoint IA</a>
      </nav>
    </div>
    ${body}
    <p class="footer">Page statique optimisee pour l'indexation Google.</p>
  </div>
</body>
</html>`;
}

function renderHubCards(items, prefix) {
  if (items.length === 0) {
    return "";
  }

  return `<div class="grid">${items
    .map(
      (item) => `<a class="card" href="${DOMAIN}${prefix}/${item.slug}">
  <h3>${escapeHtml(item.label)}</h3>
  <p>${escapeHtml(item.description)}</p>
</a>`
    )
    .join("\n")}</div>`;
}

function renderPostCards(posts) {
  return `<div class="list">${posts
    .map((post) => {
      const image = post.coverImage
        ? `<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" />`
        : "";
      const personaPill = post.persona
        ? `<a class="pill" href="${DOMAIN}/blog/metier/${post.persona}">${escapeHtml(post.personaLabel)}</a>`
        : "";
      const categoryPill = post.category
        ? `<a class="pill" href="${DOMAIN}/blog/c/${post.category}">${escapeHtml(post.categoryLabel)}</a>`
        : "";

      return `<article class="article-card">
  ${image}
  <div class="meta">
    <span>${escapeHtml(formatDate(post.date))}</span>
    <span>${escapeHtml(post.author)}</span>
    ${categoryPill}
    ${personaPill}
  </div>
  <h2><a href="${DOMAIN}/blog/${post.slug}">${escapeHtml(post.title)}</a></h2>
  <p>${escapeHtml(post.excerpt)}</p>
</article>`;
    })
    .join("\n")}</div>`;
}

function renderBlogIndex(posts) {
  const categories = [];
  const personas = [];
  const categoryMap = new Map();
  const personaMap = new Map();

  for (const post of posts) {
    if (post.category && !categoryMap.has(post.category)) {
      categoryMap.set(post.category, {
        slug: post.category,
        label: post.categoryLabel,
        description: `Voir tous les articles sur ${post.categoryLabel.toLowerCase()}.`,
      });
    }

    if (post.persona && !personaMap.has(post.persona)) {
      personaMap.set(post.persona, {
        slug: post.persona,
        label: post.personaLabel,
        description: `Voir les guides pour ${post.personaLabel.toLowerCase()}.`,
      });
    }
  }

  categories.push(...categoryMap.values());
  personas.push(...personaMap.values());

  const body = `<section class="hero">
  <h1>Blog SlideAI</h1>
  <p>Guides, comparatifs et conseils concrets pour creer des presentations PowerPoint plus vite avec l'IA.</p>
</section>
<section>
  <h2 class="section-title">Pages metier</h2>
  ${renderHubCards(personas, "/blog/metier")}
</section>
<section>
  <h2 class="section-title">Categories</h2>
  ${renderHubCards(categories, "/blog/c")}
</section>
<section>
  <h2 class="section-title">Articles</h2>
  ${renderPostCards(posts)}
</section>`;

  const jsonLd = buildJsonLd({
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog SlideAI",
    url: `${DOMAIN}/blog`,
  });

  return buildDocument({
    title: "Blog SlideAI",
    description: "Guides, comparatifs et conseils pour creer des presentations avec l'IA.",
    canonicalUrl: `${DOMAIN}/blog`,
    body,
    jsonLd: [jsonLd],
  });
}

function renderCategoryPage(categorySlug, posts) {
  const label = getCategoryLabel(categorySlug);
  const description = `Articles SlideAI sur ${label.toLowerCase()} pour structurer vos presentations et renforcer le maillage interne.`;
  const body = `<section class="hero">
  <h1>${escapeHtml(label)}</h1>
  <p>${escapeHtml(description)}</p>
</section>
<section>
  <h2 class="section-title">Articles</h2>
  ${renderPostCards(posts)}
</section>`;

  return buildDocument({
    title: `Blog ${label}`,
    description,
    canonicalUrl: `${DOMAIN}/blog/c/${categorySlug}`,
    body,
    jsonLd: [
      buildJsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `Blog ${label}`,
        url: `${DOMAIN}/blog/c/${categorySlug}`,
      }),
    ],
  });
}

function renderPersonaPage(personaSlug, posts) {
  const label = getPersonaLabel(personaSlug);
  const description = getPersonaDescription(personaSlug);
  const body = `<section class="hero">
  <h1>${escapeHtml(label)}</h1>
  <p>${escapeHtml(description)}</p>
</section>
<section>
  <h2 class="section-title">Articles</h2>
  ${renderPostCards(posts)}
</section>`;

  return buildDocument({
    title: `${label} PowerPoint IA`,
    description,
    canonicalUrl: `${DOMAIN}/blog/metier/${personaSlug}`,
    body,
    jsonLd: [
      buildJsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${label} PowerPoint IA`,
        url: `${DOMAIN}/blog/metier/${personaSlug}`,
      }),
    ],
  });
}

function renderPostPage(post, posts) {
  const coverImage = post.coverImage
    ? `<img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" />`
    : "";
  const categoryPill = post.category
    ? `<a class="pill" href="${DOMAIN}/blog/c/${post.category}">${escapeHtml(post.categoryLabel)}</a>`
    : "";
  const personaPill = post.persona
    ? `<a class="pill" href="${DOMAIN}/blog/metier/${post.persona}">${escapeHtml(post.personaLabel)}</a>`
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
  <h2 class="section-title">Articles lies</h2>
  ${renderPostCards(relatedPosts)}
</section>`
    : "";

  const body = `<section class="hero">
  <h1>${escapeHtml(post.title)}</h1>
  <p>${escapeHtml(post.excerpt)}</p>
  <div class="meta">
    <span>${escapeHtml(formatDate(post.date))}</span>
    <span>${escapeHtml(post.author)}</span>
    ${categoryPill}
    ${personaPill}
  </div>
</section>
<section class="prose">
  ${coverImage}
  ${renderMarkdown(post.content)}
</section>
${relatedSection}`;

  const jsonLd = buildJsonLd({
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
    mainEntityOfPage: `${DOMAIN}/blog/${post.slug}`,
  });

  return buildDocument({
    lang: post.language.toLowerCase().startsWith("en") ? "en" : "fr",
    title: post.title,
    description: post.excerpt,
    canonicalUrl: `${DOMAIN}/blog/${post.slug}`,
    ogImage: post.coverImage || DEFAULT_OG_IMAGE,
    type: "article",
    body,
    jsonLd: [jsonLd],
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

  ensureDir(BLOG_DIST_DIR);
  const posts = parsePosts();

  writeFile("blog/index.html", renderBlogIndex(posts));

  const categories = new Map();
  const personas = new Map();

  for (const post of posts) {
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

    writeFile(`blog/${post.slug}/index.html`, renderPostPage(post, posts));
  }

  for (const [categorySlug, categoryPosts] of categories.entries()) {
    writeFile(`blog/c/${categorySlug}/index.html`, renderCategoryPage(categorySlug, categoryPosts));
  }

  for (const [personaSlug, personaPosts] of personas.entries()) {
    writeFile(`blog/metier/${personaSlug}/index.html`, renderPersonaPage(personaSlug, personaPosts));
  }

  console.log(
    `Generated ${posts.length} post pages, ${categories.size} category pages and ${personas.size} persona pages.`
  );
}

generateStaticBlog();
