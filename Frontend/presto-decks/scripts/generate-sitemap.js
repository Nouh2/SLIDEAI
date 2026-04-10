import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = "https://www.slideai.fr";
const CONTENT_DIR = path.join(__dirname, "../src/content/blog");
const PUBLIC_DIR = path.join(__dirname, "../public");
const DIST_DIR = path.join(__dirname, "../dist");
const SITEMAP_PATH = path.join(PUBLIC_DIR, "sitemap.xml");
const DIST_SITEMAP_PATH = path.join(DIST_DIR, "sitemap.xml");
const MIN_CATEGORY_POSTS = 2;
const MIN_PERSONA_POSTS = 2;

const STATIC_ROUTES = [
  { path: "/", changefreq: "weekly", priority: 1.0, locales: ["fr", "en"] },
  { path: "/pricing", changefreq: "monthly", priority: 0.8, locales: ["fr", "en"] },
  { path: "/examples", changefreq: "weekly", priority: 0.8, locales: ["fr", "en"] },
  { path: "/blog", changefreq: "daily", priority: 0.9, locales: ["fr", "en"] },
  { path: "/pdf-to-powerpoint", changefreq: "weekly", priority: 0.9, locales: ["fr"] },
  { path: "/generateur-powerpoint-ia", changefreq: "weekly", priority: 0.9, locales: ["fr"] },
  { path: "/creer-powerpoint-avec-ia", changefreq: "weekly", priority: 0.9, locales: ["fr"] },
  { path: "/outil-ia-presentation", changefreq: "weekly", priority: 0.9, locales: ["fr"] },
];

function normalizeLocale(value) {
  return String(value || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
}

function localizePath(routePath, locale) {
  if (locale === "en") {
    return routePath === "/" ? "/en" : `/en${routePath}`;
  }

  return routePath;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pushRoute(urls, routePath, locale, changefreq, priority, lastmod) {
  urls.push({
    url: localizePath(routePath, locale),
    changefreq,
    priority,
    lastmod,
  });
}

async function generateSitemap() {
  console.log("Generating sitemap...");

  const urls = [];
  const categoryCounts = { fr: new Map(), en: new Map() };
  const personaCounts = { fr: new Map(), en: new Map() };

  for (const route of STATIC_ROUTES) {
    for (const locale of route.locales) {
      pushRoute(urls, route.path, locale, route.changefreq, route.priority);
    }
  }

  try {
    if (fs.existsSync(CONTENT_DIR)) {
      const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".md"));

      for (const file of files) {
        const content = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
        const { data } = matter(content);
        const slug = file.replace(".md", "");
        const locale = normalizeLocale(data.language);
        const lastmod = data.date ? new Date(data.date).toISOString() : new Date().toISOString();

        pushRoute(urls, `/blog/${slug}`, locale, "monthly", 0.8, lastmod);

        if (data.category) {
          const categorySlug = slugify(data.category);
          categoryCounts[locale].set(categorySlug, (categoryCounts[locale].get(categorySlug) || 0) + 1);
        }

        if (data.persona) {
          const personaSlug = slugify(data.persona);
          personaCounts[locale].set(personaSlug, (personaCounts[locale].get(personaSlug) || 0) + 1);
        }
      }

      console.log(`Found ${fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith(".md")).length} blog posts.`);
    } else {
      console.warn(`Content directory not found: ${CONTENT_DIR}`);
    }
  } catch (error) {
    console.error("Error reading blog posts:", error);
  }

  for (const locale of ["fr", "en"]) {
    for (const [categorySlug, count] of categoryCounts[locale].entries()) {
      if (count >= MIN_CATEGORY_POSTS) {
        pushRoute(urls, `/blog/c/${categorySlug}`, locale, "weekly", 0.7);
      }
    }

    for (const [personaSlug, count] of personaCounts[locale].entries()) {
      if (count >= MIN_PERSONA_POSTS) {
        pushRoute(urls, `/blog/metier/${personaSlug}`, locale, "weekly", 0.8);
      }
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (route) => `  <url>
    <loc>${DOMAIN}${route.url}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>${route.lastmod ? `\n    <lastmod>${route.lastmod.split("T")[0]}</lastmod>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;

  fs.writeFileSync(SITEMAP_PATH, sitemap, "utf-8");
  fs.writeFileSync(DIST_SITEMAP_PATH, sitemap, "utf-8");
  console.log(`Sitemap generated at ${SITEMAP_PATH}`);
}

generateSitemap();
