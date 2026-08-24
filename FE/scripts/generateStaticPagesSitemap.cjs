const fs = require('fs');
const path = require('path');

// The SSG crawler only discovers routes listed in a sitemap (see scripts/ssg-crawler/components/sitemap.cjs),
// so the standalone content pages need their own sub-sitemap to get prerendered into dist/<slug>/index.html.
// NOTE: keep this list in sync with src/services/url/staticPages.ts.
const staticPageSlugs = ['about', 'missing', 'partners', 'contact'];

const sitemapFolder = path.join(__dirname, "../public/sitemap");
if (!fs.existsSync(sitemapFolder)) {
    fs.mkdirSync(sitemapFolder, { recursive: true });
}

const env = process.env.ENVIRONMENT || 'local';

const envConfigPath = path.join(__dirname, `../public/configs/${env}.json`);
const sitemapPath = path.join(sitemapFolder, 'staticpages.xml');

const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf-8'));
const baseUrl = envConfig.currentURL.replace(/\/$/, '');
const lastMod = envConfig.sitemapsDefaultLastModified;

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

staticPageSlugs.forEach(slug => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/${slug}</loc>\n`;
    if (lastMod) xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `  </url>\n`;
});

xml += `</urlset>\n`;

fs.writeFileSync(sitemapPath, xml, 'utf-8');
console.log(`✅ Static pages sitemap generated at: ${sitemapPath} \n on environment: ${env}`);
