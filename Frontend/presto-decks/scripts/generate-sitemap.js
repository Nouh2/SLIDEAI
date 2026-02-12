import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://www.slideai.fr';
const CONTENT_DIR = path.join(__dirname, '../src/content/blog');
const PUBLIC_DIR = path.join(__dirname, '../public');
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml');

const STATIC_ROUTES = [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/pdf-to-powerpoint', changefreq: 'weekly', priority: 0.9 },
    { url: '/pricing', changefreq: 'monthly', priority: 0.8 },
    { url: '/examples', changefreq: 'weekly', priority: 0.8 },
    { url: '/blog', changefreq: 'daily', priority: 0.9 },
    { url: '/auth', changefreq: 'monthly', priority: 0.5 },
    { url: '/privacy', changefreq: 'monthly', priority: 0.3 },
    { url: '/terms', changefreq: 'monthly', priority: 0.3 },
    { url: '/gdpr', changefreq: 'monthly', priority: 0.3 },
];

async function generateSitemap() {
    console.log('Generating sitemap...');

    let urls = [...STATIC_ROUTES];

    // Read blog posts
    try {
        if (fs.existsSync(CONTENT_DIR)) {
            const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));

            for (const file of files) {
                const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
                const { data } = matter(content);
                const slug = file.replace('.md', '');

                // Use date from frontmatter or file mtime if not available
                let lastmod = new Date().toISOString();
                if (data.date) {
                    lastmod = new Date(data.date).toISOString();
                }

                urls.push({
                    url: `/blog/${slug}`,
                    changefreq: 'monthly',
                    priority: 0.8,
                    lastmod: lastmod
                });
            }
            console.log(`Found ${files.length} blog posts.`);
        } else {
            console.warn(`Content directory not found: ${CONTENT_DIR}`);
        }
    } catch (error) {
        console.error('Error reading blog posts:', error);
    }

    // Generate XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(route => `  <url>
    <loc>${DOMAIN}${route.url}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>${route.lastmod ? `\n    <lastmod>${route.lastmod.split('T')[0]}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

    // Write to file
    fs.writeFileSync(SITEMAP_PATH, sitemap, 'utf-8');
    console.log(`Sitemap generated at ${SITEMAP_PATH}`);
}

generateSitemap();
