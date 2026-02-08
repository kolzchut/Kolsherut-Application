const { Cluster } = require('puppeteer-cluster');
const fs = require('fs-extra');
const path = require('path');
const handler = require('serve-handler');
const http = require('http');
const https = require('https');
const axios = require('axios');

// ==========================================
// 1. CONFIGURATION
// ==========================================

const env = process.env.ENVIRONMENT || 'local';
console.log(`🌍 Starting Local SSG for environment: ${env}`);

const configPath = path.join(__dirname, `../public/configs/${env}.json`);
if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
}
const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// The API expects requests from THIS domain
const TARGET_DOMAIN = envConfig.currentURL;
const DIST_DIR = path.join(__dirname, '../dist');
const PORT = 3000;
const LOCAL_BASE_URL = `http://127.0.0.1:${PORT}`;
const LOCAL_SITEMAP_INDEX = `${LOCAL_BASE_URL}/sitemap.xml`;

const ALLOWED_DOMAINS = [
    TARGET_DOMAIN,
    'www.kolsherut.org.il',
    'kolsherut.org.il',
    'api.kolsherut.org.il',
    'srm-staging.whiletrue.industries',
    `127.0.0.1:${PORT}`,
    `localhost:${PORT}`
];

const MAX_CONCURRENCY = 5;

// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

function extractTags(xml, tagName) {
    if (!xml) return [];
    const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\/${tagName}>`, 'g');
    const matches = [];
    let match;
    while ((match = regex.exec(xml)) !== null) {
        matches.push(match[1]);
    }
    return matches;
}

// Helper for delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ✅ FIX: Stronger isolation to prevent 421 errors
async function fetchXml(url) {
    try {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';

        // ✅ CRITICAL: Create a FRESH agent for every request.
        // This forces a new TCP connection and handshake, bypassing
        // Cloudflare's connection reuse logic (which causes the 421).
        const agentOptions = {
            keepAlive: false,
            rejectUnauthorized: false,
            servername: urlObj.hostname // Explicit SNI matching
        };

        const agent = isHttps ? new https.Agent(agentOptions) : new http.Agent(agentOptions);

        const { data } = await axios.get(url, {
            httpsAgent: isHttps ? agent : undefined,
            httpAgent: !isHttps ? agent : undefined,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Host': urlObj.hostname,
                'Connection': 'close', // Force close
                'Accept-Encoding': 'gzip, deflate' // Simplify encoding
            },
            timeout: 15000,
            validateStatus: () => true // Resolve promise even on errors so we can log status
        });

        if (typeof data === 'string' && (data.includes('<?xml') || data.includes('<urlset') || data.includes('<sitemapindex'))) {
            return data;
        }
        return null;
    } catch (error) {
        const status = error.response ? error.response.status : (error.code || 'Unknown');
        if (url.includes('http') && !url.includes('127.0.0.1')) {
            console.log(`      ❌ Fetch failed: ${url} (Error: ${status})`);
        }
        return null;
    }
}

async function getRoutesToCrawl() {
    console.log('\n🔍 --- Step 1: Discovering Pages ---');
    const routes = new Set(['/']);

    // ---------------------------------------------------------
    // PHASE 1: Get the list of Sub-Sitemaps
    // ---------------------------------------------------------

    let indexXml = await fetchXml(LOCAL_SITEMAP_INDEX);
    let subSitemapUrls = [];

    if (indexXml) {
        subSitemapUrls = extractTags(indexXml, 'loc').filter(u => u.endsWith('.xml'));
    }

    // Fallback to remote index if local is missing/empty
    if (!indexXml || subSitemapUrls.length === 0) {
        console.log(`   ⚠️  Local sitemap index missing or empty. Checking remote: ${TARGET_DOMAIN}/sitemap.xml`);

        const remoteIndexUrl = `${TARGET_DOMAIN.replace(/\/$/, '')}/sitemap.xml`;
        indexXml = await fetchXml(remoteIndexUrl);

        if (indexXml) {
            subSitemapUrls = extractTags(indexXml, 'loc').filter(u => u.endsWith('.xml'));
        }
    }

    if (subSitemapUrls.length === 0) {
        console.error("   ❌ Failed to load sitemap structure (checked local and remote).");
        return Array.from(routes);
    }

    console.log(`   ✅ Found ${subSitemapUrls.length} sub-sitemaps in index.`);

    // ---------------------------------------------------------
    // PHASE 2: Process each Sub-Sitemap
    // ---------------------------------------------------------

    for (const urlStr of subSitemapUrls) {
        // ✅ Add small delay to prevent rapid-fire requests triggering 421/WAF
        await delay(500);

        const filename = urlStr.split('/').pop();

        // 1. Construct LOCAL URL
        const localSitemapUrl = `${LOCAL_BASE_URL}/${filename}`;

        // 2. Construct REMOTE URL
        const baseUrl = TARGET_DOMAIN.replace(/\/$/, '');
        const remoteSitemapUrl = `${baseUrl}/sitemap/${filename}`;

        // --- Fetching Logic ---

        let xmlData = await fetchXml(localSitemapUrl);
        let rawUrls = [];
        let source = 'Local';

        if (xmlData) {
            rawUrls = extractTags(xmlData, 'loc');
        }

        // 3. If Local failed or was empty, switch to Remote
        if (!xmlData || rawUrls.length === 0) {
            if (!xmlData) {
                console.log(`   ⚠️  Missing local file: ${filename}`);
            } else {
                console.log(`   ⚠️  Empty local file: ${filename}`);
            }

            console.log(`       ☁️  Fetching Remote: ${remoteSitemapUrl}`);

            xmlData = await fetchXml(remoteSitemapUrl);
            source = 'Remote';

            if (xmlData) {
                rawUrls = extractTags(xmlData, 'loc');
            }
        }

        // --- Logging & Processing ---

        if (rawUrls.length > 0) {
            if (source === 'Remote') {
                console.log(`       ✅ Recovered ${rawUrls.length} URLs from remote (${filename}).`);
            }
        } else {
            console.error(`       ❌ Failed to get URLs for ${filename} (Local & Remote failed)`);
        }

        // Add to Routes
        rawUrls.forEach(fullUrl => {
            try {
                const isAllowed = ALLOWED_DOMAINS.some(d => fullUrl.includes(d));
                if (isAllowed || fullUrl.startsWith('/')) {
                    const urlObj = new URL(fullUrl, TARGET_DOMAIN);
                    const pathName = urlObj.pathname;
                    if (pathName && pathName !== '/') routes.add(pathName);
                }
            } catch (e) { }
        });
    }

    const finalRoutes = Array.from(routes);
    console.log(`✅ Total unique pages found: ${finalRoutes.length}`);
    return finalRoutes;
}

// ==========================================
// 3. SERVER SETUP
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
// 4. MAIN EXECUTION
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
        let routes = await getRoutesToCrawl();

        if (routes.length === 0) process.exit(0);

        console.log(`\n🕷️  --- Step 3: Starting Parallel Crawl ---`);

        let completed = 0;
        let successCount = 0;
        let failCount = 0;

        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: MAX_CONCURRENCY,
            puppeteerOptions: {
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ],
                dumpio: false
            },
            monitor: false
        });

        cluster.on('taskerror', (err, data) => {
            console.error(`\n🔴 WORKER CRASHED on route: ${data}`);
            console.error(`   Reason: ${err.message}`);
            failCount++;
            completed++;
        });

        await cluster.task(async ({ page, data: route }) => {
            const url = `${LOCAL_BASE_URL}${route}`;

            let safeRoute = decodeURIComponent(route);
            if (process.platform === 'win32') {
                safeRoute = safeRoute.replace(/[:*?"<>|]/g, '_');
            }

            const filePath = route === '/'
                ? path.join(DIST_DIR, 'index.html')
                : path.join(DIST_DIR, safeRoute, 'index.html');

            try {
                await page.setRequestInterception(true);

                page.on('request', (req) => {
                    const reqUrl = req.url();
                    if (reqUrl.includes('whiletrue.industries') || reqUrl.includes('api.kolsherut')) {
                        const headers = { ...req.headers() };
                        headers['Origin'] = TARGET_DOMAIN;
                        headers['Referer'] = TARGET_DOMAIN + '/';
                        req.continue({ headers });
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

                successCount++;

            } catch (err) {
                console.error(`   ❌ Failed: ${route} -> ${err.message}`);
                failCount++;
            } finally {
                completed++;
            }
        });

        const total = routes.length;
        routes.forEach(route => cluster.queue(route));

        const logProgress = setInterval(() => {
            const percent = Math.round((completed / total) * 100);
            console.log(`   ⏳ Progress: ${completed}/${total} (${percent}%) | ✅ Success: ${successCount} | ❌ Failed: ${failCount}`);
        }, 5000);

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
