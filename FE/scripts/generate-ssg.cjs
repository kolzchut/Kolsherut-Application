const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// ==========================================
// 1. CONFIGURATION
// ==========================================

const env = process.env.ENVIRONMENT || 'local';
console.log(`🌍 Starting Remote SSG for environment: ${env}`);

const configPath = path.join(__dirname, `../public/configs/${env}.json`);
if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
}
const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// TARGET: The live staging site
const TARGET_DOMAIN = envConfig.currentURL;
const SITEMAP_URL = `${TARGET_DOMAIN}/sitemap.xml`;
const DIST_DIR = path.join(__dirname, '../dist');

// USER AGENT: This triggers your Nginx @bot_ssr location
const BOT_USER_AGENT = 'KolsherutTestBot';

// const LIMIT = 50; // Uncomment to test with only 50 pages

console.log(`🎯 Target Domain: ${TARGET_DOMAIN}`);
console.log(`🤖 User Agent:   ${BOT_USER_AGENT}`);

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
        console.log(`   📄 Fetching ${url}...`);
        const { data } = await axios.get(url);
        if (typeof data === 'string' && (data.includes('<?xml') || data.includes('<urlset') || data.includes('<sitemapindex'))) {
            return data;
        }
        return null;
    } catch (error) {
        console.error(`   ⚠️ Failed to fetch ${url}: ${error.message}`);
        return null;
    }
}

async function getRoutesToCrawl() {
    console.log('\n🔍 --- Step 1: Discovering Pages (Remote) ---');
    const routes = new Set(['/']);

    // 1. Fetch Remote Sitemap
    const indexXml = await fetchXml(SITEMAP_URL);

    if (!indexXml) {
        console.error("   ❌ Failed to load remote sitemap.xml");
        return Array.from(routes);
    }

    const subSitemapUrls = extractTags(indexXml, 'loc').filter(u => u.endsWith('.xml'));

    for (const subUrl of subSitemapUrls) {
        // 2. Fetch Remote Sub-sitemaps
        const subData = await fetchXml(subUrl);
        if (subData) {
            const rawUrls = extractTags(subData, 'loc');
            rawUrls.forEach(fullUrl => {
                try {
                    const urlObj = new URL(fullUrl);
                    const pathName = urlObj.pathname;
                    if (pathName && pathName !== '/') routes.add(pathName);
                } catch (e) { }
            });
        }
    }

    const finalRoutes = Array.from(routes);
    console.log(`✅ Total unique pages found: ${finalRoutes.length}`);
    return finalRoutes;
}

// ==========================================
// 3. MAIN EXECUTION
// ==========================================

(async () => {
    let browser;

    try {
        if (!fs.existsSync(DIST_DIR)) fs.ensureDirSync(DIST_DIR);

        // 1. Get Routes
        let routes = await getRoutesToCrawl();
        if (routes.length === 0) process.exit(0);

        // 2. Apply Limit (Optional)
        if (typeof LIMIT !== 'undefined') {
            console.log(`⚠️  TEST MODE: Limiting to first ${LIMIT} pages.`);
            routes = routes.slice(0, LIMIT);
        }

        console.log(`\n🕷️  --- Step 2: Starting Remote Crawl ---`);

        // 3. Launch Browser (HEADLESS for CI/CD)
        browser = await puppeteer.launch({
            headless: "new", // <--- CRITICAL FIX FOR LINUX/CI
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-dev-shm-usage', // <--- PREVENTS CRASHES IN DOCKER
                `--user-agent=${BOT_USER_AGENT}` // <--- TRIGGERS NGINX SSR
            ]
        });

        const page = await browser.newPage();

        // Log Console errors (Remote)
        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`   [Remote JS Error] ${msg.text()}`);
        });

        let successCount = 0;
        let failCount = 0;

        // 4. Crawl Loop
        for (const route of routes) {
            const targetUrl = `${TARGET_DOMAIN}${route}`;
            const filePath = route === '/'
                ? path.join(DIST_DIR, 'index.html')
                : path.join(DIST_DIR, decodeURIComponent(route), 'index.html');

            console.log(`\n➡️  Visiting: ${targetUrl}`);

            try {
                // Navigate to REMOTE url
                // Note: We use 'domcontentloaded' because SSR should be fast
                const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                const status = response.status();

                if (status >= 400) {
                    throw new Error(`Remote server returned ${status}`);
                }

                // Check for content
                try {
                    await page.waitForFunction(
                        'document.getElementById("root") && document.getElementById("root").innerHTML.trim().length > 0',
                        { timeout: 5000 }
                    );
                } catch(e) {
                    console.warn("   ⚠️  Content appeared slow (or fallback trigger)");
                }

                const html = await page.content();

                // Save to LOCAL dist folder
                await fs.ensureDir(path.dirname(filePath));
                await fs.writeFile(filePath, html);

                successCount++;
                console.log(`   ✅ Saved (${html.length} bytes)`);

            } catch (err) {
                console.error(`   ❌ Failed: ${err.message}`);
                failCount++;
            }
        }

        console.log(`\n✨ Done! Success: ${successCount}, Failed: ${failCount}`);

        // Fail build if nothing generated
        if (successCount === 0) process.exit(1);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
})();
