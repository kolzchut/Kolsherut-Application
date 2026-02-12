const { Cluster } = require('puppeteer-cluster');
const { MAX_CONCURRENCY, LOCAL_BASE_URL, MAX_RETRIES } = require('../config.cjs');
const { renderPage } = require('./browser.cjs');
const { cleanHtmlContent } = require('../utils/html.cjs');
const { savePage } = require('../utils/files.cjs');

async function initCluster() {
    return await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_PAGE,
        maxConcurrency: MAX_CONCURRENCY,
        puppeteerOptions: {
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
            dumpio: false
        },
        monitor: false
    });
}

async function taskHandler({ page, data }, stats, cluster) {
    const route = typeof data === 'string' ? data : data.route;
    const attempt = typeof data === 'string' ? 1 : data.attempt;

    const url = `${LOCAL_BASE_URL}${route}`;

    try {
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

    // Initial queue
    routes.forEach(route => cluster.queue({ route, attempt: 1 }));

    return { cluster, stats };
}

module.exports = { runCrawler };
