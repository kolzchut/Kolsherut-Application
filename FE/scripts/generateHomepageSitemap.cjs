const fs = require('fs');
const path = require('path');

// Ensure the sitemap folder exists
const sitemapFolder = path.join(__dirname, "../public/sitemap");
if (!fs.existsSync(sitemapFolder)) {
    fs.mkdirSync(sitemapFolder, { recursive: true });
}

const env = process.env.ENVIRONMENT || 'local';

const dataPath = path.join(__dirname, '../public/configs/homepage.json'); // main data
const envConfigPath = path.join(__dirname, `../public/configs/${env}.json`); // env-specific config
const sitemapPath = path.join(__dirname, '../public/sitemap/hpsitemap.xml'); // output XML

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf-8'));

const baseUrl = envConfig.currentURL;

const encodeParam = (str) => encodeURIComponent(str).replace(/%20/g, '+');

// Helper to XML-escape URL text content for <loc>
const xmlEscape = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

data.forEach(group => {
    if (!group.labels) return;

    group.labels.forEach(label => {
        if (!label.query) return;

        const params = [`sq=${encodeParam(label.query)}`];
        if (label.response_id) params.push(`brf=${encodeParam(label.response_id)}`);
        if (label.situation_id) params.push(`bsf=${encodeParam(label.situation_id)}`);

        const rawUrl = `${baseUrl.replace(/\/$/, '')}/?p=results&${params.join('&')}`; // ensure single slash
        const loc = xmlEscape(rawUrl); // escape special chars for XML

        xml += `  <url>\n`;
        xml += `    <loc>${loc}</loc>\n`;
        xml += `  </url>\n`;
    });
});

xml += `</urlset>\n`;

fs.writeFileSync(sitemapPath, xml, 'utf-8');
console.log(`✅ Sitemap generated at: ${sitemapPath} \n on environment: ${env}`);
