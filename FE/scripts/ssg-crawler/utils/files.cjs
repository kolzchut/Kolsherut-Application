const fs = require('fs-extra');
const path = require('path');
const { DIST_DIR, ENV } = require('../config.cjs');

async function ensureDist() {
    if (!fs.existsSync(DIST_DIR)) {
        console.error('❌ dist/ folder missing.');
        process.exit(1);
    }
}

async function updateEnvironmentConfig() {
    const configSource = path.join(__dirname, `../../../public/configs/${ENV}.json`);
    const configDest = path.join(DIST_DIR, 'configs/environment.json');

    if (await fs.pathExists(configSource)) {
        await fs.copy(configSource, configDest);
        console.log(`📝 Updated dist/configs/environment.json to ${ENV}`);
    } else {
        console.warn(`⚠️  Config for ${ENV} not found at ${configSource}`);
    }
}

function getFilePath(route) {
    let safeRoute = route;
    try {
        safeRoute = decodeURIComponent(route).normalize('NFC');
    } catch (e) { }

    const sanitized = safeRoute.replace(/[*?"<>| ]/g, '_');

    // FIX: Save homepage to /home/index.html to avoid overwriting main entry
    return route === '/'
        ? path.join(DIST_DIR, 'home', 'index.html')
        : path.join(DIST_DIR, sanitized, 'index.html');
}

async function savePage(route, html) {
    const filePath = getFilePath(route);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, html);
}

module.exports = { ensureDist, savePage, updateEnvironmentConfig };
