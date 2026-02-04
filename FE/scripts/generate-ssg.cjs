const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const handler = require('serve-handler');
const http = require('http');
const axios = require('axios');

// ==========================================
// 1. CONFIGURATION & ENVIRONMENT
// ==========================================

const env = process.env.ENVIRONMENT || 'local';
console.log(`🌍 Starting SSG for environment: ${env}`);

const configPath = path.join(__dirname, `../public/configs/${env}.json`);
if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
}
const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const TARGET_DOMAIN = envConfig.currentURL;
const DIST_DIR = path.join(__dirname, '../dist');
const PORT = 3000;
const LOCAL_BASE_URL = `http://localhost:${PORT}`;
const LOCAL_SITEMAP_INDEX = `${LOCAL_BASE_URL}/sitemap.xml`;

console.log(`🎯 Target Domain: ${TARGET_DOMAIN}`);
console.log(`🏠 Local Build Server: ${LOCAL_BASE_URL}`);


// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

function extractTags(xml, tagName) {
    if (!xml) return [];
    const regex = new RegExp(`<${tagName}>(.*?)<\/${tagName}>`, 'g');
    const matches = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

async function fetchXml(url) {
    try {
        const { data } = await axios.get(url);
        // Basic check: response should look like XML
        if (typeof data === 'string' && (data.includes('<?xml') || data.includes('<urlset') || data.includes('<sitemapindex'))) {
            return data;
        }
        return null; // It might be HTML (index.html) returned by the SPA server
    } catch (error) {
        return null;
    }
}


// ==========================================
// 3. SITEMAP DISCOVERY LOGIC
// ==========================================

async function getRoutesToCrawl() {
    console.log('\n🔍 --- Step 1: Discovering Pages ---');
    const routes = new Set(['/']);

    // 1. Fetch Local Index
    console.log(`   📄 Fetching Index from Local: ${LOCAL_SITEMAP_INDEX}`);
    const indexXml = await fetchXml(LOCAL_SITEMAP_INDEX);

    if (!indexXml) {
        console.error("   ❌ Failed to load local sitemap.xml");
        return Array.from(routes);
    }

    // 2. Extract Sub-Sitemaps
    const subSitemapUrls = extractTags(indexXml, 'loc').filter(u => u.endsWith('.xml'));
    console.log(`   📋 Found ${subSitemapUrls.length} sub-sitemaps.`);

    // 3. Process each Sub-Sitemap
    for (const originalUrl of subSitemapUrls) {
        const filename = path.basename(originalUrl);
        let urls = [];

        // A. Try Local Fetch First
        const localUrl = originalUrl.replace(TARGET_DOMAIN, LOCAL_BASE_URL);
        const localData = await fetchXml(localUrl);

        if (localData) {
            urls = extractTags(localData, 'loc');
        }

        // CHECK: If local fetch gave 0 results, it was likely a missing file served as index.html
        if (urls.length > 0) {
            console.log(`   ✅ Loaded locally: ${filename} (${urls.length} URLs)`);
        } else {
            // B. Fallback to Remote
            console.log(`   ⚠️  Local ${filename} returned 0 URLs. Fetching remote...`);
            const remoteData = await fetchXml(originalUrl);

            if (remoteData) {
                urls = extractTags(remoteData, 'loc');
                console.log(`   🌍 Loaded remotely: ${filename} (${urls.length} URLs)`);
            } else {
                console.error(`   ❌ Failed to load ${filename} from Remote as well.`);
            }
        }

        // C. Add URLs to Set
        urls.forEach(fullUrl => {
            if (fullUrl.includes(TARGET_DOMAIN)) {
                let relative = fullUrl.replace(TARGET_DOMAIN, '');
                if (!relative.startsWith('/')) relative = `/${relative}`;
                routes.add(relative);
            }
        });
    }

    const finalRoutes = Array.from(routes);
    console.log(`   ✅ Total unique pages found: ${finalRoutes.length}`);
    return finalRoutes;
}


// ==========================================
// 4. SERVER & CRAWLER LOGIC
// ==========================================

function startLocalServer() {
    const server = http.createServer((req, res) => {
        return handler(req, res, {
            public: DIST_DIR,
            rewrites: [
                { source: '**', destination: '/index.html' }
            ]
        });
    });

    return new Promise((resolve) => {
        server.listen(PORT, () => {
            console.log(`\n🚀 --- Step 2: Build Server Started ---`);
            resolve(server);
        });
    });
}

async function crawlPage(page, route) {
    const url = `${LOCAL_BASE_URL}${route}`;
    const safeRoute = decodeURIComponent(route);

    const filePath = route === '/'
        ? path.join(DIST_DIR, 'index.html')
        : path.join(DIST_DIR, safeRoute, 'index.html');

    try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await page.waitForSelector('#root', { timeout: 30000 });

        const html = await page.content();
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, html);

    } catch (err) {
        console.error(`   ❌ Error generating ${route}: ${err.message}`);
    }
}


// ==========================================
// 5. MAIN EXECUTION
// ==========================================

(async () => {
    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ dist/ folder missing.');
        process.exit(1);
    }

    let server;
    let browser;

    try {
        server = await startLocalServer();
        const routes = await getRoutesToCrawl();

        console.log(`\n🕷️  --- Step 3: Starting Crawl (${routes.length} pages) ---`);

        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        for (let i = 0; i < routes.length; i++) {
            if (i % 20 === 0) console.log(`   [${i + 1}/${routes.length}] Processing...`);
            await crawlPage(page, routes[i]);
        }

        console.log('\n✨ SSG Generation Complete!');

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        if (server) server.close();
    }
})();
