const { fetchXml } = require('../utils/network.cjs');
const { extractTags } = require('../utils/html.cjs');
const { LOCAL_BASE_URL, TARGET_DOMAIN, ALLOWED_DOMAINS } = require('../config.cjs');

async function getSitemapIndex() {
    const localIndex = `${LOCAL_BASE_URL}/sitemap.xml`;
    let xml = await fetchXml(localIndex);

    if (!xml) {
        const remoteIndex = `${TARGET_DOMAIN.replace(/\/$/, '')}/sitemap.xml`;
        console.log(`   ⚠️  Local missing. Checking remote: ${remoteIndex}`);
        xml = await fetchXml(remoteIndex);
    }
    return xml;
}

function filterAllowedRoutes(urls, routesSet) {
    urls.forEach(fullUrl => {
        try {
            const isAllowed = ALLOWED_DOMAINS.some(d => fullUrl.includes(d));
            if (isAllowed || fullUrl.startsWith('/')) {
                const urlObj = new URL(fullUrl, TARGET_DOMAIN);
                if (urlObj.pathname && urlObj.pathname !== '/') {
                    routesSet.add(urlObj.pathname);
                }
            }
        } catch (e) { }
    });
}

async function processSubSitemap(filename, routesSet) {
    const localUrl = `${LOCAL_BASE_URL}/${filename}`;
    const remoteUrl = `${TARGET_DOMAIN.replace(/\/$/, '')}/sitemap/${filename}`;

    let xml = await fetchXml(localUrl) || await fetchXml(remoteUrl);
    if (xml) filterAllowedRoutes(extractTags(xml, 'loc'), routesSet);
}

async function getRoutesToCrawl() {
    console.log('\n🔍 --- Step 1: Discovering Pages ---');
    const routes = new Set(['/']);
    const indexXml = await getSitemapIndex();

    if (!indexXml) return Array.from(routes);

    const subMaps = extractTags(indexXml, 'loc').filter(u => u.endsWith('.xml'));
    console.log(`   ✅ Found ${subMaps.length} sub-sitemaps.`);

    for (const urlStr of subMaps) {
        await new Promise(r => setTimeout(r, 500));
        await processSubSitemap(urlStr.split('/').pop(), routes);
    }

    return Array.from(routes);
}

module.exports = { getRoutesToCrawl };
