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
const BOT_USER_AGENT = 'KolsherutSSG';



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

        console.log(`\n🕷️  --- Step 2: Starting Remote Crawl ---`);
        console.log("⚠️  Look at the Chrome window to ensure it sees the SSR version!");

        // 3. Launch Browser
        browser = await puppeteer.launch({
            headless: false, // Visible for debugging
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--window-size=1280,800',
                `--user-agent=${BOT_USER_AGENT}` // <--- THE MAGIC KEY
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

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
                const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
                const status = response.status();

                if (status >= 400) {
                    throw new Error(`Remote server returned ${status}`);
                }

                // Check if we got SSR content
                // (SSR usually puts content in #root immediately, CSR waits)
                try {
                    await page.waitForFunction(
                        'document.getElementById("root") && document.getElementById("root").innerHTML.trim().length > 0',
                        { timeout: 5000 } // Short timeout because SSR should be fast
                    );
                } catch(e) {
                    console.warn("   ⚠️  Content appeared slow (or Client Side Rendering fallback triggered)");
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

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
    } finally {
        if (browser) await browser.close();
    }
})();
