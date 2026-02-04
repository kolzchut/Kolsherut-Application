const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const handler = require('serve-handler');
const http = require('http');
const axios = require('axios');

// --- 1. SETUP ENVIRONMENT & CONFIGS ---
const env = process.env.ENVIRONMENT || 'local';
console.log(`🌍 Starting SSG for environment: ${env}`);

// Load the correct config file (e.g., stage.json, production.json)
const configPath = path.join(__dirname, `../public/configs/${env}.json`);
if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
}
const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const TARGET_DOMAIN = envConfig.currentURL; // e.g., "https://srm-staging.whiletrue.industries"

console.log(`🎯 Target Domain from config: ${TARGET_DOMAIN}`);

// --- CONFIGURATION ---
const DIST_DIR = path.join(__dirname, '../dist');
const PORT = 3000;
const LOCAL_BASE_URL = `http://localhost:${PORT}`;

// We fetch the sitemap from the LOCAL build server to ensure we build what we just compiled
// (Instead of fetching the potentially outdated 'live' sitemap)
const LOCAL_SITEMAP_URL = `${LOCAL_BASE_URL}/sitemap.xml`;

/**
 * Helper: Extract XML tags
 */
function extractTags(xml, tagName) {
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 'g');
    const matches = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

/**
 * 2. Fetch and Parse Sitemaps
 */
async function getRoutesFromSitemap() {
    console.log('🔍 Starting Sitemap Discovery...');
    const routes = new Set(['/']);

    try {
        console.log(`☁️  Fetching Local Index: ${LOCAL_SITEMAP_URL}`);
        const { data: indexXml } = await axios.get(LOCAL_SITEMAP_URL);

        // Find all sub-sitemaps
        const allLocs = extractTags(indexXml, 'loc');
        const subSitemaps = allLocs.filter(url => url.endsWith('.xml'));

        console.log(`📋 Found ${subSitemaps.length} sub-sitemaps.`);

        // Fetch sub-sitemaps in parallel
        await Promise.all(subSitemaps.map(async (subUrl) => {
            try {
                // The sitemap contains absolute URLs (e.g., https://stage.../sitemap/cards.xml)
                // We want to fetch the content from our LOCAL server to be safe.
                // Replace the configured domain with localhost
                const localSubUrl = subUrl.replace(TARGET_DOMAIN, LOCAL_BASE_URL);

                console.log(`   ⬇️  Fetching ${localSubUrl} (originally ${subUrl})...`);
                const { data: subXml } = await axios.get(localSubUrl);

                const urls = extractTags(subXml, 'loc');

                urls.forEach(fullUrl => {
                    // Check if URL belongs to the current environment
                    if (fullUrl.includes(TARGET_DOMAIN)) {
                        // Extract relative path by removing the domain
                        const relativePath = fullUrl.replace(TARGET_DOMAIN, '');
                        // Ensure it starts with /
                        const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
                        routes.add(normalizedPath);
                    }
                });
            } catch (err) {
                console.warn(`   ⚠️  Failed to fetch sub-sitemap: ${subUrl}`);
            }
        }));

    } catch (error) {
        console.error('❌ Critical Error fetching sitemap:', error.message);
        console.log('⚠️  Falling back to Homepage only.');
    }

    const finalRoutes = Array.from(routes);
    console.log(`✅ Total pages to generate for ${env}: ${finalRoutes.length}`);
    return finalRoutes;
}

/**
 * 3. Start Local File Server
 */
function startLocalServer() {
    const server = http.createServer((request, response) => {
        return handler(request, response, { public: DIST_DIR });
    });

    return new Promise((resolve) => {
        server.listen(PORT, () => {
            console.log(`🚀 Build server running at ${LOCAL_BASE_URL}`);
            resolve(server);
        });
    });
}

/**
 * 4. Crawl a Single Page
 */
async function crawlPage(page, route) {
    const url = `${LOCAL_BASE_URL}${route}`;
    const filePath = route === '/'
        ? path.join(DIST_DIR, 'index.html')
        : path.join(DIST_DIR, route, 'index.html');

    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

        await page.waitForSelector('#root', { timeout: 15000 });

        const html = await page.content();

        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, html);

    } catch (err) {
        console.error(`   ❌ Error generating ${route}: ${err.message}`);
    }
}

/**
 * Main Execution Flow
 */
(async () => {
    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ dist/ folder not found. Run npm run build first.');
        process.exit(1);
    }

    let server;
    let browser;

    try {
        server = await startLocalServer();
        const routes = await getRoutesFromSitemap();

        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        console.log(`🕷️  Starting Crawl for ${env}...`);
        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            if (i % 20 === 0) console.log(`[${i + 1}/${routes.length}] Processing...`);
            await crawlPage(page, route);
        }

        console.log('✨ SSG Generation Complete!');

    } catch (error) {
        console.error('❌ Fatal Error:', error);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        if (server) server.close();
    }
})();
