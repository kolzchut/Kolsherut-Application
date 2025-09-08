const fs = require("fs");
const path = require("path");

// Ensure the public folder exists
const publicFolder = path.join(__dirname, "../public"); // adjust relative path
if (!fs.existsSync(publicFolder)) {
    fs.mkdirSync(publicFolder, { recursive: true });
}

// List of sitemap URLs
const sitemaps = [
    "https://api.kolsherut.org.il/sitemap/cards.xml",
    "https://api.kolsherut.org.il/sitemap/taxonomy.xml",
    "https://api.kolsherut.org.il/sitemap/mixedtaxonomy.xml"
];

// Get current date in ISO format
const getCurrentISODate = () => new Date().toISOString();

// Build sitemap index XML
const buildSitemapIndexXML = () => {
    const lastmod = getCurrentISODate();
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    sitemaps.forEach((loc) => {
        xml += `  <sitemap>\n`;
        xml += `    <loc>${loc}</loc>\n`;
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
        xml += `  </sitemap>\n`;
    });

    xml += `</sitemapindex>\n`;
    return xml;
};

// Write the sitemap.xml to the public folder (overwrites if exists)
const sitemapPath = path.join(publicFolder, "sitemap.xml");
fs.writeFileSync(sitemapPath, buildSitemapIndexXML(), "utf-8");

console.log(`✅ sitemap.xml generated and overwritten at: ${sitemapPath}`);
