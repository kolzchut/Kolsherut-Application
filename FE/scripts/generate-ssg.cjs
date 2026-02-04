const { Cluster } = require('puppeteer-cluster');
const fs = require('fs-extra');
const path = require('path');
const handler = require('serve-handler');
const http = require('http');
const axios = require('axios');

// ==========================================
// 1. CONFIGURATION & ENVIRONMENT
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
const LOCAL_BASE_URL = `http://localhost:${PORT}`;
const LOCAL_SITEMAP_INDEX = `${LOCAL_BASE_URL}/sitemap.xml`;

// Known Production Domains (to allow crawling content even if sitemap uses Prod URL)
const ALLOWED_DOMAINS = [
    TARGET_DOMAIN,
    'www.kolsherut.org.il',
    'kolsherut.org.il',
    'api.kolsherut.org.il'
];

const MAX_CONCURRENCY = 5;

console.log(`🎯 Target Domain: ${TARGET_DOMAIN}`);
console.log(`🏠 Local Build Server: ${LOCAL_BASE_URL}`);
console.log(`⚡ Parallel Threads: ${MAX_CONCURRENCY}`);


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

    console.log(`   📄 Fetching Index from Local: ${LOCAL_SITEMAP_INDEX}`);
    const indexXml = await fetchXml(LOCAL_SITEMAP_INDEX);

    if (!indexXml) {
        console.error("   ❌ Failed to load local sitemap.xml");
        return Array.from(routes);
    }

    const subSitemapUrls = extractTags(indexXml, 'loc').filter(u => u.endsWith('.xml'));
    console.log(`   📋 Found ${subSitemapUrls.length} sub-sitemaps.`);

    for (const originalUrl of subSitemapUrls) {
        const filename = path.basename(originalUrl);
        let rawUrls = [];

        // A. Try Local
        const localUrl = originalUrl.replace(TARGET_DOMAIN, LOCAL_BASE_URL);
        const localData = await fetchXml(localUrl);

        if (localData) {
            rawUrls = extractTags(localData, 'loc');
        }

        // B. Fallback Remote
        if (rawUrls.length > 0) {
            console.log(`   ✅ Loaded locally: ${filename} (${rawUrls.length} raw URLs)`);
        } else {
            console.log(`   ⚠️  Local ${filename} empty/missing. Fetching remote...`);
            const remoteData = await fetchXml(originalUrl);
            if (remoteData) {
                rawUrls = extractTags(remoteData, 'loc');
                console.log(`   🌍 Loaded remotely: ${filename} (${rawUrls.length} raw URLs)`);
            } else {
                console.error(`   ❌ Failed to load ${filename} from Remote.`);
            }
        }

        // C. Process & Filter
        let addedCount = 0;
        let skippedCount = 0;
        let sampleSkipped = '';

        rawUrls.forEach(fullUrl => {
            try {
                const urlObj = new URL(fullUrl);

                // CHECK: Is the domain in our Allowed List?
                // We check if the hostname includes any of our allowed domains
                const isAllowed = ALLOWED_DOMAINS.some(d => fullUrl.includes(d));

                if (isAllowed) {
                    const pathName = urlObj.pathname;
                    if (pathName && pathName !== '/') {
                        routes.add(pathName);
                        addedCount++;
                    }
                } else {
                    skippedCount++;
                    if (!sampleSkipped) sampleSkipped = fullUrl;
                }
            } catch (e) { /* skip invalid */ }
        });

        if (skippedCount > 0) {
            console.log(`      ⚠️  Skipped ${skippedCount} URLs (Domain mismatch). Sample: ${sampleSkipped}`);
        }
        console.log(`      ➡️  Queued ${addedCount} pages from ${filename}`);
    }

    const finalRoutes = Array.from(routes);
    console.log(`\n✅ Total unique pages to generate: ${finalRoutes.length}`);
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
        server.listen(PORT, () => {
            console.log(`\n🚀 --- Step 2: Build Server Started ---`);
            resolve(server);
        });
    });
}


// ==========================================
// 5. MAIN EXECUTION WITH CLUSTER
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

        if (routes.length === 0) {
            console.log('⚠️ No pages found to crawl. Exiting.');
            process.exit(0);
        }

        console.log(`\n🕷️  --- Step 3: Starting Parallel Crawl (${routes.length} pages) ---`);

        // 1. Launch Cluster
        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: MAX_CONCURRENCY,
            puppeteerOptions: {
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            },
            monitor: false
        });

        // 2. Define Task
        await cluster.task(async ({ page, data: route }) => {
            const url = `${LOCAL_BASE_URL}${route}`;
            const safeRoute = decodeURIComponent(route);
            const filePath = route === '/'
                ? path.join(DIST_DIR, 'index.html')
                : path.join(DIST_DIR, safeRoute, 'index.html');

            try {
                // Optimization: Block heavy assets
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

                // CRITICAL: Wait for #root to have content
                await page.waitForFunction(
                    'document.getElementById("root") && document.getElementById("root").innerHTML.trim().length > 0',
                    { timeout: 30000 }
                );

                const html = await page.content();
                await fs.ensureDir(path.dirname(filePath));
                await fs.writeFile(filePath, html);

            } catch (err) {
                console.error(`   ❌ Failed: ${route} (${err.message})`);
            }
        });

        // 3. Queue URLs
        let completed = 0;
        const total = routes.length;

        // Console progress bar
        const logProgress = setInterval(() => {
            const percent = Math.round((completed / total) * 100);
            console.log(`   ⏳ Progress: ${completed}/${total} (${percent}%)`);
        }, 5000);

        routes.forEach(route => {
            cluster.queue(route, async () => {
                completed++;
            });
        });

        await cluster.idle();
        await cluster.close();
        clearInterval(logProgress);

        console.log('\n✨ Parallel SSG Generation Complete!');

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
        process.exit(1);
    } finally {
        if (server) server.close();
    }
})();
