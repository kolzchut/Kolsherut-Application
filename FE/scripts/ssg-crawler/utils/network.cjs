const axios = require('axios');
const https = require('https');
const http = require('http');

function getAgent(urlObj) {
    const isHttps = urlObj.protocol === 'https:';
    const options = { keepAlive: false, rejectUnauthorized: false, servername: urlObj.hostname };
    return isHttps ? new https.Agent(options) : new http.Agent(options);
}

async function fetchXml(url, { timeout = 15000 } = {}) {
    try {
        const urlObj = new URL(url);
        const agent = getAgent(urlObj);

        const { data } = await axios.get(url, {
            httpsAgent: urlObj.protocol === 'https:' ? agent : undefined,
            httpAgent: urlObj.protocol !== 'https:' ? agent : undefined,
            responseType: 'text',
            headers: {
                'User-Agent': 'KolsherutTestBot',
                'Connection': 'close',
                'Accept-Encoding': 'gzip, deflate'
            },
            timeout,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const isValid = typeof data === 'string' &&
            (data.includes('<?xml') || data.includes('<urlset') || data.includes('<sitemapindex'));

        if (!isValid) {
            console.log(`   ⚠️  Response from ${url} is not valid XML (type: ${typeof data}, length: ${data?.length || 0})`);
        }

        return isValid ? data : null;
    } catch (error) {
        console.log(`   ⚠️  Failed to fetch ${url}: ${error.code || error.message}`);
        return null;
    }
}

module.exports = { fetchXml };
