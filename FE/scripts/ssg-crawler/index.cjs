const { ENV, MAX_PAGES } = require('./config.cjs');
const { ensureDist } = require('./utils/files.cjs');
const { startLocalServer } = require('./components/server.cjs');
const { getRoutesToCrawl } = require('./components/sitemap.cjs');
const { runCrawler } = require('./components/crawler.cjs');

console.log(`🌍 Starting Local SSG for environment: ${ENV}`);

(async () => {
    let server;
    try {
        await ensureDist();
        server = await startLocalServer();

        let routes = await getRoutesToCrawl();
        if (routes.length === 0) process.exit(0);

        if (MAX_PAGES && routes.length > MAX_PAGES) {
            console.log(`\n⚠️  LIMIT: Reducing to ${MAX_PAGES} pages.`);
            routes = routes.slice(0, MAX_PAGES);
        }

        console.log(`\n🕷️  --- Step 3: Starting Crawl (${routes.length} pages) ---`);
        const { cluster, stats } = await runCrawler(routes);

        const logInt = setInterval(() => {
            const pct = Math.round((stats.completed / routes.length) * 100);
            console.log(`   ⏳ ${stats.completed}/${routes.length} (${pct}%) | ✅ ${stats.success} | ❌ ${stats.fail}`);
        }, 5000);

        await cluster.idle();
        await cluster.close();
        clearInterval(logInt);

        console.log(`\n✨ Done! Success: ${stats.success}, Failed: ${stats.fail}`);
        if (stats.success === 0) process.exit(1);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
        process.exit(1);
    } finally {
        if (server) server.close();
    }
})();
