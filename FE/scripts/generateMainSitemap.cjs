const fs = require("fs");
const path = require("path");

const env = process.env.ENVIRONMENT || "local";
const envConfigPath = path.join(__dirname, `../public/configs/${env}.json`);
const envConfig = JSON.parse(fs.readFileSync(envConfigPath, "utf-8"));

const baseUrl = envConfig.currentURL;

// Ensure the public folder exists
const publicFolder = path.join(__dirname, "../public");
if (!fs.existsSync(publicFolder)) {
    fs.mkdirSync(publicFolder, { recursive: true });
}

// List of sitemap files (relative paths)
const sitemaps = [
    "/sitemap/cards.xml",
    "/sitemap/taxonomy.xml",
    "/sitemap/mixedtaxonomy.xml",
];

// Helper: join base + path safely (exactly one slash between them)
const joinUrl = (base, relativePath) =>
    base.replace(/\/+$/, "") + "/" + relativePath.replace(/^\/+/, "");

const getCurrentISODate = () => new Date().toISOString();

// Build sitemap index XML
const buildSitemapIndexXML = () => {
    const lastmod = getCurrentISODate();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    sitemaps.forEach((relativePath) => {
        xml += `  <sitemap>\n`;
        xml += `    <loc>${joinUrl(baseUrl, relativePath)}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `  </sitemap>\n`;
    });

    xml += `</sitemapindex>\n`;
    return xml;
};

// Write the sitemap.xml to the public folder (overwrites if exists)
const sitemapPath = path.join(publicFolder, "sitemap.xml");
fs.writeFileSync(sitemapPath, buildSitemapIndexXML(), "utf-8");

console.log(`✅ sitemap.xml generated at: ${sitemapPath} \n on environment: ${env}`);
