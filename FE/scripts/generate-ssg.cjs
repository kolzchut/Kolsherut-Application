const { Cluster } = require('puppeteer-cluster'); // NEW: Import Cluster
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

// CONCURRENCY SETTINGS
// 5 is safe for GitHub Actions (2 cores). Higher might crash the runner.
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
// 3. SITEMAP DISCOVERY (Unchanged)
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
        let urls = [];

        // A. Try Local
        const localUrl = originalUrl.replace(TARGET_DOMAIN, LOCAL_BASE_URL);
        const localData = await fetchXml(localUrl);

        if (localData) {
            urls = extractTags(localData, 'loc');
        }

        // B. Fallback Remote
        if (urls.length > 0) {
            console.log(`   ✅ Loaded locally: ${filename} (${urls.length} URLs)`);
        } else {
            console.log(`   ⚠️  Local ${filename} empty/missing. Fetching remote...`);
            const remoteData = await fetchXml(originalUrl);
            if (remoteData) {
                urls = extractTags(remoteData, 'loc');
                console.log(`   🌍 Loaded remotely: ${filename} (${urls.length} URLs)`);
            } else {
                console.error(`   ❌ Failed to load ${filename} from Remote.`);
            }
        }

        // C. Add to Set (Domain Agnostic)
        urls.forEach(fullUrl => {
            try {
                const urlObj = new URL(fullUrl);
                const pathName = urlObj.pathname;
                if (pathName && pathName !== '/') routes.add(pathName);
            } catch (e) { /* skip */ }
        });
    }

    const finalRoutes = Array.from(routes);
    console.log(`   ✅ Total unique pages found: ${finalRoutes.length}`);
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

        console.log(`\n🕷️  --- Step 3: Starting Parallel Crawl ---`);

        // 1. Launch Cluster
        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_CONTEXT, // Uses Incognito tabs (fast & isolated)
            maxConcurrency: MAX_CONCURRENCY,
            puppeteerOptions: {
                headless: "new",
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            },
            monitor: false // We will use our own simple logging
        });

        // 2. Define the Crawl Task
        await cluster.task(async ({ page, data: route }) => {
            const url = `${LOCAL_BASE_URL}${route}`;
            const safeRoute = decodeURIComponent(route);
            const filePath = route === '/'
                ? path.join(DIST_DIR, 'index.html')
                : path.join(DIST_DIR, safeRoute, 'index.html');

            try {
                // Optimize page load
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    // Abort images/fonts/css to speed up generation - we only need HTML structure
                    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
                await page.waitForSelector('#root', { timeout: 30000 });

                const html = await page.content();
                await fs.ensureDir(path.dirname(filePath));
                await fs.writeFile(filePath, html);

            } catch (err) {
                console.error(`   ❌ Failed: ${route} (${err.message})`);
                // Optional: throw err if you want to retry
            }
        });

        // 3. Queue URLs
        let completed = 0;
        const total = routes.length;

        // Progress logger
        const logProgress = setInterval(() => {
            console.log(`   ⏳ Progress: ${completed}/${total} (${Math.round(completed/total*100)}%)`);
        }, 5000); // Log every 5 seconds

        // Add Event listener for task completion to increment counter
        cluster.on('taskerror', (err, data) => {
            // console.error(`   Error crawling ${data}: ${err.message}`);
        });

        routes.forEach(route => {
            cluster.queue(route, async () => {
                // Task is done (success or fail)
                completed++;
            });
        });

        // 4. Wait for completion
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
