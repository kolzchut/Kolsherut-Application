const { Cluster } = require('puppeteer-cluster');
const { MAX_CONCURRENCY, LOCAL_BASE_URL, MAX_RETRIES } = require('../config.cjs');
const { renderPage } = require('./browser.cjs');
const { cleanHtmlContent } = require('../utils/html.cjs');
const { savePage } = require('../utils/files.cjs');

async function initCluster() {
    return await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT, 
        maxConcurrency: MAX_CONCURRENCY,

        puppeteerOptions: {
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--mute-audio',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-breakpad',
                '--disable-component-update',
                '--disable-domain-reliability',
                '--disable-sync',
            ],
            dumpio: false
        },
        monitor: false,
        workerCreationDelay: 100, 
    });
}

async function taskHandler({ page, data }, stats, cluster) {
    const route = typeof data === 'string' ? data : data.route;
    const attempt = typeof data === 'string' ? 1 : data.attempt;

    const url = `${LOCAL_BASE_URL}${route}`;

    try {
        if (global.gc) { global.gc(); }

        const rawHtml = await renderPage(page, url);
        const finalHtml = cleanHtmlContent(rawHtml);

        await savePage(route, finalHtml);

        stats.success++;
        stats.completed++;

    } catch (err) {
        if (attempt < MAX_RETRIES) {
            console.warn(`   ⚠️  Retry (${attempt}/${MAX_RETRIES}): ${route} -> ${err.message}`);
            cluster.queue({ route, attempt: attempt + 1 });
        } else {
            console.error(`   ❌ Failed (Final): ${route} -> ${err.message}`);
            stats.fail++;
            stats.completed++;
        }
    }
}

async function runCrawler(routes) {
    const cluster = await initCluster();
    const stats = { completed: 0, success: 0, fail: 0 };

    cluster.on('taskerror', (err, data) => {
        console.error(`\n🔴 WORKER CRASHED: ${err.message}`);
    });

    await cluster.task((args) => taskHandler(args, stats, cluster));

    routes.forEach(route => cluster.queue({ route, attempt: 1 }));

    return { cluster, stats };
}

module.exports = { runCrawler };
