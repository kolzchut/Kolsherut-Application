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


// Helper to XML-escape URL text content for <loc>
const xmlEscape = (str) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

data.forEach(group => {
    if (!group.labels) return;

    // Generate group-level link from group's situation_id / response_id
    const groupCategories = [];
    if (group.situation_id) groupCategories.push(group.situation_id.split(':').slice(-1)[0]);
    if (group.response_id) groupCategories.push(group.response_id.split(':').slice(-1)[0]);
    if (groupCategories.length > 0) {
        const groupRawUrl = `${baseUrl.replace(/\/$/, '')}/${groupCategories.join('/')}`;
        const groupLoc = xmlEscape(groupRawUrl);
        xml += `  <url>\n`;
        xml += `    <loc>${groupLoc}</loc>\n`;
        xml += `  </url>\n`;
    }

    group.labels.forEach(label => {
        const categories = [];
        if (label.situation_id) categories.push(label.situation_id.split(':').slice(-1)[0]);
        if (label.response_id) categories.push(label.response_id.split(':').slice(-1)[0]);
        if (categories.length === 0) return;

        const rawUrl = `${baseUrl.replace(/\/$/, '')}/${categories.join('/')}`;
        const loc = xmlEscape(rawUrl);

        xml += `  <url>\n`;
        xml += `    <loc>${loc}</loc>\n`;
        xml += `  </url>\n`;
    });
});

xml += `</urlset>\n`;

fs.writeFileSync(sitemapPath, xml, 'utf-8');
console.log(`✅ Sitemap generated at: ${sitemapPath} \n on environment: ${env}`);
