import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = "https://www.slideai.fr";
const CONTENT_DIR = path.join(__dirname, "../src/content/blog");
const DIST_DIR = path.join(__dirname, "../dist");
const BLOG_DIST_DIR = path.join(DIST_DIR, "blog");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slugifyCategory(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugifyPersona(value) {
  return slugifyCategory(value);
}

function parsePosts() {
  const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".md"));
  const posts = files.map((file) => {
    const slug = file.replace(".md", "");
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: data.title || slug,
      date: data.date || "",
      author: data.author || "SlideAI",
      excerpt: data.excerpt || "",
      coverImage: data.coverImage || "",
      language: data.language || "fr",
      category: data.category || "PowerPoint IA",
      persona: data.persona || "",
      content,
    };
  });

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

function injectSeoIntoHtml(baseHtml, { canonicalUrl, title, description, ogImage, type = "website", hreflangs = [] }) {
  const tagTitle = `<title>${escapeHtml(title)} | SlideAI</title>`;
  const tagDesc = `<meta name="description" content="${escapeHtml(description)}">`;
  const tagCanonical = `<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`;
  const tagOgTitle = `<meta property="og:title" content="${escapeHtml(title)} | SlideAI">`;
  const tagOgDesc = `<meta property="og:description" content="${escapeHtml(description)}">`;
  const tagOgUrl = `<meta property="og:url" content="${escapeHtml(canonicalUrl)}">`;
  const tagOgImage = `<meta property="og:image" content="${escapeHtml(ogImage)}">`;
  const tagOgType = `<meta property="og:type" content="${type}">`;
  const tagTwitterTitle = `<meta name="twitter:title" content="${escapeHtml(title)} | SlideAI">`;
  const tagTwitterDesc = `<meta name="twitter:description" content="${escapeHtml(description)}">`;
  const tagTwitterImage = `<meta name="twitter:image" content="${escapeHtml(ogImage)}">`;
  const hreflangTags = hreflangs
    .map((hf) => `<link rel="alternate" hreflang="${escapeHtml(hf.lang)}" href="${escapeHtml(hf.url)}" />`)
    .join("\n  ");

  const seoBlock = `
  <!-- Injected Blog SEO Tags -->
  ${tagTitle}
  ${tagDesc}
  ${tagCanonical}
  ${tagOgTitle}
  ${tagOgDesc}
  ${tagOgUrl}
  ${tagOgImage}
  ${tagOgType}
  ${tagTwitterTitle}
  ${tagTwitterDesc}
  ${tagTwitterImage}
  ${hreflangTags}
  <!-- End Injected SEO -->
</head>`;

  let newHtml = baseHtml.replace(/<title>.*?<\/title>/gi, "");
  newHtml = newHtml.replace(/<meta name="description" content=".*?">/gi, "");
  newHtml = newHtml.replace("</head>", seoBlock);
  return newHtml;
}

function generateStaticBlog() {
  console.log("Starting static blog SEO generation...");

  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`Blog content directory not found: ${CONTENT_DIR}`);
    return;
  }

  const baseIndexHtmlPath = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(baseIndexHtmlPath)) {
    console.error("ERROR: dist/index.html not found. Ensure `vite build` runs before this script.");
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(baseIndexHtmlPath, "utf-8");
  const posts = parsePosts();

  ensureDir(BLOG_DIST_DIR);

  const blogIndexHtml = injectSeoIntoHtml(baseHtml, {
    canonicalUrl: `${DOMAIN}/blog`,
    title: "Blog SlideAI - Conseils et Astuces pour vos presentations",
    description: "Decouvrez nos guides, tutoriels et articles sur l'intelligence artificielle et la creation de presentations impactantes.",
    ogImage: `${DOMAIN}/og-image.png`,
    type: "website",
  });

  fs.writeFileSync(path.join(BLOG_DIST_DIR, "index.html"), blogIndexHtml, "utf-8");
  console.log("SEO HTML injected for /blog");

  const categoryBaseDir = path.join(BLOG_DIST_DIR, "c");
  ensureDir(categoryBaseDir);
  const personaBaseDir = path.join(BLOG_DIST_DIR, "metier");
  ensureDir(personaBaseDir);

  const categories = new Map();
  const personas = new Map();
  posts.forEach((post) => {
    const categorySlug = slugifyCategory(post.category || "PowerPoint IA");
    if (!categories.has(categorySlug)) {
      categories.set(categorySlug, post.category || "PowerPoint IA");
    }
    if (post.persona) {
      const personaSlug = slugifyPersona(post.persona);
      if (!personas.has(personaSlug)) {
        personas.set(personaSlug, post.persona);
      }
    }
  });

  categories.forEach((categoryLabel, categorySlug) => {
    const categoryDir = path.join(categoryBaseDir, categorySlug);
    ensureDir(categoryDir);

    const categoryHtml = injectSeoIntoHtml(baseHtml, {
      canonicalUrl: `${DOMAIN}/blog/c/${categorySlug}`,
      title: `Blog ${categoryLabel}`,
      description: `Articles SlideAI sur ${String(categoryLabel).toLowerCase()} pour structurer vos presentations et renforcer le maillage interne.`,
      ogImage: `${DOMAIN}/og-image.png`,
      type: "website",
    });

    fs.writeFileSync(path.join(categoryDir, "index.html"), categoryHtml, "utf-8");
  });

  personas.forEach((personaLabel, personaSlug) => {
    const personaDir = path.join(personaBaseDir, personaSlug);
    ensureDir(personaDir);

    const personaHtml = injectSeoIntoHtml(baseHtml, {
      canonicalUrl: `${DOMAIN}/blog/metier/${personaSlug}`,
      title: `${personaLabel} PowerPoint IA`,
      description: `Guides SlideAI pour ${String(personaLabel).toLowerCase()} qui cree des presentations PowerPoint toute la journee.`,
      ogImage: `${DOMAIN}/og-image.png`,
      type: "website",
    });

    fs.writeFileSync(path.join(personaDir, "index.html"), personaHtml, "utf-8");
  });

  posts.forEach((post) => {
    const postDir = path.join(BLOG_DIST_DIR, post.slug);
    ensureDir(postDir);

    const postCanonicalUrl = `${DOMAIN}/blog/${post.slug}`;
    const postOgImage = post.coverImage ? post.coverImage : `${DOMAIN}/og-image.png`;
    const hreflangs = [];
    const langPrefix = post.language.toLowerCase().startsWith("en") ? "en" : "fr";
    hreflangs.push({ lang: langPrefix, url: postCanonicalUrl });
    hreflangs.push({ lang: "x-default", url: postCanonicalUrl });

    const postHtml = injectSeoIntoHtml(baseHtml, {
      canonicalUrl: postCanonicalUrl,
      title: post.title,
      description: post.excerpt || "Article du blog SlideAI.",
      ogImage: postOgImage,
      type: "article",
      hreflangs,
    });

    fs.writeFileSync(path.join(postDir, "index.html"), postHtml, "utf-8");
  });

  console.log(`Generated SEO HTML for ${posts.length} blog posts in dist/blog/`);
}

generateStaticBlog();
