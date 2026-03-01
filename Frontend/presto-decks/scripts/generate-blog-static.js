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
      content,
    };
  });

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

// Function to inject SEO tags into Vite's dist/index.html
function injectSeoIntoHtml(baseHtml, { canonicalUrl, title, description, ogImage, type = "website", hreflangs = [] }) {
  // We want to replace the current <title> and <meta name="description"> etc
  // Or just append them right before </head> to override

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

  // Hreflang Tags (ex: <link rel="alternate" hreflang="en" href="..." />)
  const hreflangTags = hreflangs.map(hf =>
    `<link rel="alternate" hreflang="${escapeHtml(hf.lang)}" href="${escapeHtml(hf.url)}" />`
  ).join("\n  ");

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

  // Instead of complex parsing, we find </head> and insert our block right before it.
  // The last tags placed in <head> usually win (or React Helmet will properly override, but these are for the crawlers)
  // We also remove the default <title> tag to prevent duplicates
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

  // Define paths to Vite's output
  const baseIndexHtmlPath = path.join(DIST_DIR, "index.html");

  if (!fs.existsSync(baseIndexHtmlPath)) {
    console.error("❌ ERROR: dist/index.html not found! Ensure `vite build` runs before this script.");
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(baseIndexHtmlPath, "utf-8");
  const posts = parsePosts();

  // Create dist/blog/ folder
  ensureDir(BLOG_DIST_DIR);

  // 1. Generate Blog Index Page in dist/blog/index.html
  const blogIndexCanonical = `${DOMAIN}/blog`;
  const blogIndexHtml = injectSeoIntoHtml(baseHtml, {
    canonicalUrl: blogIndexCanonical,
    title: "Blog SlideAI - Conseils et Astuces pour vos présentations",
    description: "Découvrez nos guides, tutoriels et articles sur l'intelligence artificielle et la création de présentations impactantes.",
    ogImage: `${DOMAIN}/og-image.png`,
    type: "website"
  });

  fs.writeFileSync(path.join(BLOG_DIST_DIR, "index.html"), blogIndexHtml, "utf-8");
  console.log(`✅ SEO HTML injected for /blog`);

  // 2. Map multilang alternatives for Hreflang
  // Some posts might be variations in EN vs FR. We build a dictionary to link them.
  // We assume english posts might have "-en" suffix or "en" language attribute.
  // NOTE: A more complex hreflang strategy could be implemented here as needed

  // 3. Generate Individual Post Pages in dist/blog/[slug]/index.html
  posts.forEach((post) => {
    const postDir = path.join(BLOG_DIST_DIR, post.slug);
    ensureDir(postDir);

    const postCanonicalUrl = `${DOMAIN}/blog/${post.slug}`;
    const postOgImage = post.coverImage ? post.coverImage : `${DOMAIN}/og-image.png`;

    const hreflangs = [];
    const langPrefix = post.language.toLowerCase().startsWith('en') ? 'en' : 'fr';
    hreflangs.push({ lang: langPrefix, url: postCanonicalUrl });
    hreflangs.push({ lang: 'x-default', url: postCanonicalUrl }); // Fallback

    const postHtml = injectSeoIntoHtml(baseHtml, {
      canonicalUrl: postCanonicalUrl,
      title: post.title,
      description: post.excerpt || "Article du blog SlideAI.",
      ogImage: postOgImage,
      type: "article",
      hreflangs: hreflangs
    });

    fs.writeFileSync(path.join(postDir, "index.html"), postHtml, "utf-8");
  });

  console.log(`✅ Generated SEO HTML for ${posts.length} blog posts in dist/blog/`);
}

generateStaticBlog();
