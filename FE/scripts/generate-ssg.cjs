const { Cluster } = require('puppeteer-cluster');
const fs = require('fs-extra');
const path = require('path');
const handler = require('serve-handler');
const http = require('http');
const axios = require('axios');

// ==========================================
// 1. CONFIGURATION
// ==========================================

const env = process.env.ENVIRONMENT || 'local';
console.log(`🌍 Starting Parallel SSG for environment: ${env}`);

const configPath = path.join(__dirname, `../public/configs/${env}.json`);
if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
}
const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const TARGET_DOMAIN = envConfig.currentURL;
const DIST_DIR = path.join(__dirname, '../dist');
const PORT = 3000;

// Use 127.0.0.1 to be safe on all OSs
const LOCAL_BASE_URL = `http://127.0.0.1:${PORT}`;
const LOCAL_SITEMAP_INDEX = `${LOCAL_BASE_URL}/sitemap.xml`;

const ALLOWED_DOMAINS = [
    TARGET_DOMAIN,
    'www.kolsherut.org.il',
    'kolsherut.org.il',
    'api.kolsherut.org.il',
    'srm-staging.whiletrue.industries'
];

const MAX_CONCURRENCY = 5;

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
        if (typeof data === 'string' && (data.includes('<?xml') || data.includes('<urlset') || data.includes('<sitemapindex'))) {
            return data;
        }
        return null;
    } catch (error) {
        return null;
    }
}

// ==========================================
// 3. SITEMAP DISCOVERY
// ==========================================

async function getRoutesToCrawl() {
    console.log('\n🔍 --- Step 1: Discovering Pages ---');
    const routes = new Set(['/']);

    console.log(`   📄 Fetching Index: ${LOCAL_SITEMAP_INDEX}`);
    const indexXml = await fetchXml(LOCAL_SITEMAP_INDEX);

    if (!indexXml) {
        console.error("   ❌ Failed to load local sitemap.xml");
        return Array.from(routes);
    }

    const subSitemapUrls = extractTags(indexXml, 'loc').filter(u => u.endsWith('.xml'));

    for (const originalUrl of subSitemapUrls) {
        let rawUrls = [];
        const localUrl = originalUrl.replace(TARGET_DOMAIN, LOCAL_BASE_URL);
        const localData = await fetchXml(localUrl);

        if (localData) {
            rawUrls = extractTags(localData, 'loc');
        } else {
            const remoteData = await fetchXml(originalUrl);
            if (remoteData) rawUrls = extractTags(remoteData, 'loc');
        }

        rawUrls.forEach(fullUrl => {
            try {
                const isAllowed = ALLOWED_DOMAINS.some(d => fullUrl.includes(d));
                if (isAllowed) {
                    const urlObj = new URL(fullUrl);
                    const pathName = urlObj.pathname;
                    if (pathName && pathName !== '/') routes.add(pathName);
                }
            } catch (e) { }
        });
    }

    const finalRoutes = Array.from(routes);
    console.log(`✅ Total unique pages to generate: ${finalRoutes.length}`);
    return finalRoutes;
}

// ==========================================
// 4. SERVER SETUP
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
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 --- Step 2: Build Server Started on Port ${PORT} ---`);
            resolve(server);
        });
    });
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
    let cluster;

    try {
        server = await startLocalServer();
        const routes = await getRoutesToCrawl();

        if (routes.length === 0) process.exit(0);

        console.log(`\n🕷️  --- Step 3: Starting Parallel Crawl ---`);

        // FIX: Comprehensive Stability Flags for Windows/Docker
        const puppeteerArgs = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-dev-shm-usage',
            '--disable-gpu',                // <--- CRITICAL for Windows
            '--disable-software-rasterizer' // <--- CRITICAL for Windows
        ];

        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: MAX_CONCURRENCY,
            puppeteerOptions: {
                headless: "new",
                args: puppeteerArgs
            },
            monitor: false
        });

        // Debug: Log specific crash reasons (LOUDLY)
        cluster.on('taskerror', (err, data) => {
            console.error(`\n!!!!! CRASH on ${data} !!!!!`);
            console.error(`REASON: ${err.message}`);
            console.error(`-----------------------------`);
        });

        await cluster.task(async ({ page, data: route }) => {
            const url = `${LOCAL_BASE_URL}${route}`;
            const safeRoute = decodeURIComponent(route);
            const filePath = route === '/'
                ? path.join(DIST_DIR, 'index.html')
                : path.join(DIST_DIR, safeRoute, 'index.html');

            try {
                // Pre-check to ensure browser is alive
                if (page.isClosed()) throw new Error('Browser Page is closed!');

                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

                await page.waitForFunction(
                    'document.getElementById("root") && document.getElementById("root").innerHTML.trim().length > 0',
                    { timeout: 30000 }
                );

                const html = await page.content();
                await fs.ensureDir(path.dirname(filePath));
                await fs.writeFile(filePath, html);

            } catch (err) {
                // Screenshot on first failure
                if (!fs.existsSync(path.join(DIST_DIR, 'error-screenshot.png'))) {
                    console.log(`   📸 Screenshotting error at ${route}`);
                    try {
                        await page.screenshot({ path: path.join(DIST_DIR, 'error-screenshot.png'), fullPage: true });
                    } catch (e) {
                        console.log("   Could not take screenshot (Browser might be dead)");
                    }
                }
                throw err;
            }
        });

        // Progress Tracking
        let completed = 0;
        let successCount = 0;
        let failCount = 0;
        const total = routes.length;

        const logProgress = setInterval(() => {
            const percent = Math.round((completed / total) * 100);
            console.log(`   ⏳ Progress: ${completed}/${total} (${percent}%) | ✅ Success: ${successCount} | ❌ Failed: ${failCount}`);
        }, 5000);

        routes.forEach(route => {
            cluster.queue(route, async () => {
                const safeRoute = decodeURIComponent(route);
                const checkPath = route === '/'
                    ? path.join(DIST_DIR, 'index.html')
                    : path.join(DIST_DIR, safeRoute, 'index.html');

                // Slight delay to check file system
                if (fs.existsSync(checkPath) && route !== '/') {
                    successCount++;
                } else if (route !== '/') {
                    failCount++;
                }
                completed++;
            });
        });

        await cluster.idle();
        await cluster.close();
        clearInterval(logProgress);

        console.log(`\n✨ Done! Success: ${successCount}, Failed: ${failCount}`);

        if (successCount === 0) process.exit(1);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
        process.exit(1);
    } finally {
        if (server) server.close();
    }
})();
