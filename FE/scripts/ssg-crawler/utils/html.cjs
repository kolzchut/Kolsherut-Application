const { TARGET_DOMAIN, LOCAL_BASE_URL, PORT } = require('../config.cjs');

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

function cleanHtmlContent(html) {
    const targetNoSlash = TARGET_DOMAIN.replace(/\/$/, '');
    const localRegex = new RegExp(LOCAL_BASE_URL, 'g');
    const localhostRegex = new RegExp(`http://localhost:${PORT}`, 'g');

    return html
        .replace(localRegex, targetNoSlash)
        .replace(localhostRegex, targetNoSlash);
}

module.exports = { extractTags, cleanHtmlContent };
