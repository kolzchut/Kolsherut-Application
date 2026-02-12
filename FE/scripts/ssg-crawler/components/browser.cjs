const { PROXIED_PATTERNS, TARGET_DOMAIN } = require('../config.cjs');

async function setupInterception(page) {
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        const reqUrl = req.url();
        if (PROXIED_PATTERNS.some(p => reqUrl.includes(p))) {
            const headers = { ...req.headers(), 'Origin': TARGET_DOMAIN, 'Referer': TARGET_DOMAIN + '/' };
            req.continue({ headers });
        } else {
            req.continue();
        }
    });
}

async function injectFixes(page) {
    await page.evaluate(() => {
        const sheets = Array.from(document.styleSheets);
        sheets.forEach(sheet => {
            try {
                if (sheet.cssRules && sheet.ownerNode.tagName === 'STYLE') {
                    const rules = Array.from(sheet.cssRules).map(r => r.cssText).join(' ');
                    if (rules) sheet.ownerNode.innerHTML = rules;
                }
            } catch (e) { }
        });
        if (!document.querySelector('base')) {
            const base = document.createElement('base');
            base.href = '/';
            document.head.prepend(base);
        }
    });
}

async function renderPage(page, url) {
    await setupInterception(page);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await injectFixes(page);

    await page.waitForFunction(
        'document.getElementById("root") && document.getElementById("root").innerHTML.trim().length > 0',
        { timeout: 30000 }
    );
    return await page.content();
}

module.exports = { renderPage };
