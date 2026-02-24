const path = require('path');
const fs = require('fs-extra');

const env = process.env.ENVIRONMENT || 'local';

const configPath = path.join(__dirname, `../../public/configs/${env}.json`);

if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
}

const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const TARGET_DOMAIN = envConfig.currentURL;

module.exports = {
    ENV: env,
    PORT: 3000,
    DIST_DIR: path.join(__dirname, '../../dist'),
    TARGET_DOMAIN: TARGET_DOMAIN,
    LOCAL_BASE_URL: `http://127.0.0.1:3000`,
    MAX_PAGES: 250,
    MAX_CONCURRENCY: 5,
    MAX_RETRIES: 3,
    ALLOWED_DOMAINS: [
        TARGET_DOMAIN,
        'www.kolsherut.org.il',
        'kolsherut.org.il',
        'api.kolsherut.org.il',
        'srm-staging.whiletrue.industries',
    ],
    PROXIED_PATTERNS: ['whiletrue.industries', 'api.kolsherut']
};
