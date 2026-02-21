import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = "https://www.slideai.fr";
const CONTENT_DIR = path.join(__dirname, "../src/content/blog");
const PUBLIC_DIR = path.join(__dirname, "../public");
const BLOG_PUBLIC_DIR = path.join(PUBLIC_DIR, "blog");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  return html;
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let inUl = false;
  let inOl = false;
  let inCode = false;

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      closeLists();
      if (!inCode) {
        html.push("<pre><code>");
        inCode = true;
      } else {
        html.push("</code></pre>");
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      html.push(`${escapeHtml(line)}\n`);
      continue;
    }

    if (!line.trim()) {
      closeLists();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeLists();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const blockquoteMatch = line.match(/^>\s+(.*)$/);
    if (blockquoteMatch) {
      closeLists();
      html.push(`<blockquote>${renderInline(blockquoteMatch[1])}</blockquote>`);
      continue;
    }

    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!inUl) {
        if (inOl) {
          html.push("</ol>");
          inOl = false;
        }
        html.push("<ul>");
        inUl = true;
      }
      html.push(`<li>${renderInline(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!inOl) {
        if (inUl) {
          html.push("</ul>");
          inUl = false;
        }
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${renderInline(olMatch[1])}</li>`);
      continue;
    }

    closeLists();
    html.push(`<p>${renderInline(line)}</p>`);
  }

  closeLists();
  if (inCode) {
    html.push("</code></pre>");
  }

  return html.join("\n");
}

function pageTemplate({ title, description, canonical, bodyHtml, coverImage }) {
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description || "");
  const ogImage = coverImage || `${DOMAIN}/og-image.png`;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapedTitle} | SlideAI</title>
  <meta name="description" content="${escapedDescription}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapedTitle} | SlideAI" />
  <meta property="og:description" content="${escapedDescription}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <style>
    :root { color-scheme: light; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background: #f8fafc; color: #0f172a; }
    main { max-width: 820px; margin: 0 auto; padding: 32px 20px 64px; }
    a { color: #0369a1; }
    h1, h2, h3 { line-height: 1.2; margin-top: 1.25em; }
    h1 { font-size: 2rem; margin-top: 0.5em; }
    p, li, blockquote { line-height: 1.75; font-size: 1.05rem; }
    blockquote { border-left: 4px solid #cbd5e1; padding-left: 12px; margin-left: 0; color: #334155; }
    img { max-width: 100%; border-radius: 12px; }
    header p { color: #334155; margin-top: 8px; }
    .back { display: inline-block; margin-top: 8px; margin-bottom: 8px; }
    .cover { margin: 18px 0 24px; border-radius: 14px; width: 100%; object-fit: cover; max-height: 420px; }
  </style>
</head>
<body>
  <main>${bodyHtml}</main>
</body>
</html>`;
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
      content,
    };
  });

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

function renderBlogIndex(posts) {
  const items = posts
    .map(
      (post) => `<article>
  <h2><a href="/blog/${post.slug}">${escapeHtml(post.title)}</a></h2>
  <p>${escapeHtml(post.excerpt)}</p>
  <p><small>${escapeHtml(post.date)} - ${escapeHtml(post.author)}</small></p>
</article>`
    )
    .join("\n");

  const bodyHtml = `<header>
  <a class="back" href="/">Retour au site SlideAI</a>
  <h1>Blog SlideAI</h1>
  <p>Guides et conseils pour creer des presentations avec l'IA.</p>
</header>
${items}`;

  const html = pageTemplate({
    title: "Blog SlideAI",
    description: "Guides et conseils pour creer des presentations avec l'IA.",
    canonical: `${DOMAIN}/blog`,
    bodyHtml,
    coverImage: `${DOMAIN}/og-image.png`,
  });

  ensureDir(BLOG_PUBLIC_DIR);
  fs.writeFileSync(path.join(BLOG_PUBLIC_DIR, "index.html"), html, "utf-8");
}

function renderPost(post) {
  const postDir = path.join(BLOG_PUBLIC_DIR, post.slug);
  ensureDir(postDir);

  const articleHtml = markdownToHtml(post.content);
  const coverHtml = post.coverImage
    ? `<img class="cover" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}" />`
    : "";

  const bodyHtml = `<header>
  <a class="back" href="/blog">← Retour au blog</a>
  <h1>${escapeHtml(post.title)}</h1>
  <p><small>${escapeHtml(post.date)} - ${escapeHtml(post.author)}</small></p>
  ${coverHtml}
</header>
<article>
${articleHtml}
</article>`;

  const html = pageTemplate({
    title: post.title,
    description: post.excerpt,
    canonical: `${DOMAIN}/blog/${post.slug}`,
    bodyHtml,
    coverImage: post.coverImage,
  });

  fs.writeFileSync(path.join(postDir, "index.html"), html, "utf-8");
}

function generateStaticBlog() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn(`Blog content directory not found: ${CONTENT_DIR}`);
    return;
  }

  const posts = parsePosts();
  renderBlogIndex(posts);
  posts.forEach(renderPost);
  console.log(`Generated static HTML for ${posts.length} blog posts.`);
}

generateStaticBlog();
