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

const TARGET_DOMAIN = envConfig.currentURL;
const DIST_DIR = path.join(__dirname, '../dist');
const PORT = 3000;
const LOCAL_BASE_URL = `http://127.0.0.1:${PORT}`;
const LOCAL_SITEMAP_INDEX = `${LOCAL_BASE_URL}/sitemap.xml`;

const MAX_PAGES_TO_CRAWL = 250;

const ALLOWED_DOMAINS = [
    TARGET_DOMAIN,
    'www.kolsherut.org.il',
    'kolsherut.org.il',
    'api.kolsherut.org.il',
    'srm-staging.whiletrue.industries',
];

const PROXIED_API_PATTERNS = [
    'whiletrue.industries',
    'api.kolsherut'
];

const MAX_CONCURRENCY = 5;

const mapFileName = `ssgRoutes-${env}.map`;


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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchXml(url) {
    try {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';

        const agentOptions = { keepAlive: false, rejectUnauthorized: false, servername: urlObj.hostname };
        const agent = isHttps ? new https.Agent(agentOptions) : new http.Agent(agentOptions);

        const { data } = await axios.get(url, {
            httpsAgent: isHttps ? agent : undefined,
            httpAgent: !isHttps ? agent : undefined,
            headers: { 'User-Agent': 'KolsherutTestBot', 'Host': urlObj.hostname, 'Connection': 'close', 'Accept-Encoding': 'gzip, deflate' },
            timeout: 15000,
            validateStatus: () => true
        });

        if (typeof data === 'string' && (data.includes('<?xml') || data.includes('<urlset') || data.includes('<sitemapindex'))) {
            return data;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function getRoutesToCrawl() {
    console.log('\n🔍 --- Step 1: Discovering Pages ---');
    const routes = new Set(['/']);

    let indexXml = await fetchXml(LOCAL_SITEMAP_INDEX);
    let subSitemapUrls = [];

    if (indexXml) subSitemapUrls = extractTags(indexXml, 'loc').filter(u => u.endsWith('.xml'));

    if (!indexXml || subSitemapUrls.length === 0) {
        console.log(`   ⚠️  Local sitemap index missing or empty. Checking remote: ${TARGET_DOMAIN}/sitemap.xml`);
        const remoteIndexUrl = `${TARGET_DOMAIN.replace(/\/$/, '')}/sitemap.xml`;
        indexXml = await fetchXml(remoteIndexUrl);
        if (indexXml) subSitemapUrls = extractTags(indexXml, 'loc').filter(u => u.endsWith('.xml'));
    }

    if (subSitemapUrls.length === 0) {
        console.error("   ❌ Failed to load sitemap structure.");
        return Array.from(routes);
    }

    console.log(`   ✅ Found ${subSitemapUrls.length} sub-sitemaps in index.`);

    for (const urlStr of subSitemapUrls) {
        await delay(500);
        const filename = urlStr.split('/').pop();
        const localSitemapUrl = `${LOCAL_BASE_URL}/${filename}`;
        const baseUrl = TARGET_DOMAIN.replace(/\/$/, '');
        const remoteSitemapUrl = `${baseUrl}/sitemap/${filename}`;

        let xmlData = await fetchXml(localSitemapUrl);
        let rawUrls = [];
        let source = 'Local';

        if (xmlData) rawUrls = extractTags(xmlData, 'loc');

        if (!xmlData || rawUrls.length === 0) {
            console.log(`       ☁️  Fetching Remote: ${remoteSitemapUrl}`);
            xmlData = await fetchXml(remoteSitemapUrl);
            source = 'Remote';
            if (xmlData) rawUrls = extractTags(xmlData, 'loc');
        }

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
            rewrites: [ { source: '**', destination: '/index.html' } ]
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
    const successfulRoutes = [];

    try {
        server = await startLocalServer();
        let routes = await getRoutesToCrawl();

        if (routes.length === 0) process.exit(0);

        if (MAX_PAGES_TO_CRAWL && routes.length > MAX_PAGES_TO_CRAWL) {
            console.log(`\n⚠️  LIMIT ACTIVE: Reducing from ${routes.length} to ${MAX_PAGES_TO_CRAWL} pages.`);
            routes = routes.slice(0, MAX_PAGES_TO_CRAWL);
        }

        console.log(`\n🕷️  --- Step 3: Starting Parallel Crawl (${routes.length} pages) ---`);

        let completed = 0;
        let successCount = 0;
        let failCount = 0;

        cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: MAX_CONCURRENCY,
            puppeteerOptions: {
                headless: "new",
                args: [
                    '--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security',
                    '--disable-dev-shm-usage', '--disable-gpu',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ],
                dumpio: false
            },
            monitor: false
        });

        cluster.on('taskerror', (err, data) => {
            console.error(`\n🔴 WORKER CRASHED on route: ${data}`);
            failCount++;
            completed++;
        });

        await cluster.task(async ({ page, data: route }) => {
            const url = `${LOCAL_BASE_URL}${route}`;

            let safeRoute = route;
            try {
                safeRoute = decodeURIComponent(route).normalize('NFC');
            } catch (e) {
                console.warn(`   ⚠️ Could not decode route: ${route}, using raw.`);
            }

            safeRoute = safeRoute.replace(/[*?"<>| ]/g, '_');

            const filePath = route === '/'
                ? path.join(DIST_DIR, 'index.html')
                : path.join(DIST_DIR, safeRoute, 'index.html');

            try {
                await page.setRequestInterception(true);

                page.on('request', (req) => {
                    const reqUrl = req.url();
                    if (PROXIED_API_PATTERNS.some(pattern => reqUrl.includes(pattern))) {
                        const headers = { ...req.headers() };
                        headers['Origin'] = TARGET_DOMAIN;
                        headers['Referer'] = TARGET_DOMAIN + '/';
                        req.continue({ headers });
                    } else {
                        req.continue();
                    }
                });

                await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

                await page.evaluate(() => {
                    const styleSheets = Array.from(document.styleSheets);
                    styleSheets.forEach(sheet => {
                        try {
                            if (sheet.cssRules && sheet.ownerNode && sheet.ownerNode.tagName === 'STYLE') {
                                const rules = Array.from(sheet.cssRules).map(rule => rule.cssText).join(' ');
                                if (rules && rules.length > 0) sheet.ownerNode.innerHTML = rules;
                            }
                        } catch (e) { }
                    });
                });

                await page.evaluate(() => {
                    if (!document.querySelector('base')) {
                        const base = document.createElement('base');
                        base.href = '/';
                        document.head.prepend(base);
                    }
                });

                await page.waitForFunction(
                    'document.getElementById("root") && document.getElementById("root").innerHTML.trim().length > 0',
                    { timeout: 30000 }
                );

                let html = await page.content();

                const targetDomainNoSlash = TARGET_DOMAIN.replace(/\/$/, '');
                const localBaseRegex = new RegExp(LOCAL_BASE_URL, 'g');
                const localhostRegex = new RegExp(`http://localhost:${PORT}`, 'g');

                html = html.replace(localBaseRegex, targetDomainNoSlash)
                    .replace(localhostRegex, targetDomainNoSlash)
                    .replace(/src="\/assets/g, `src="${targetDomainNoSlash}/assets`)
                    .replace(/href="\/assets/g, `href="${targetDomainNoSlash}/assets`);

                await fs.ensureDir(path.dirname(filePath));
                await fs.writeFile(filePath, html);

                try {
                    const decodedForMap = decodeURIComponent(route).normalize('NFC');
                    successfulRoutes.push(decodedForMap);
                } catch(e) {
                    successfulRoutes.push(route);
                }

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

        console.log(`\n📝 Generating Nginx Map file for environment: ${env}`);
        const mapFilePath = path.join(DIST_DIR, mapFileName);

        const mapContent = successfulRoutes
            .filter(r => r !== '/') // Exclude homepage
            .map(r => `"${r}" 1;`)  // Format: "/path" 1;
            .join('\n');

        await fs.writeFile(mapFilePath, mapContent);
        console.log(`   ✅ Map file written to: ${mapFilePath}`);

        console.log(`\n✨ Done! Success: ${successCount}, Failed: ${failCount}`);
        if (successCount === 0) process.exit(1);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
        process.exit(1);
    } finally {
        if (server) server.close();
    }
})();
