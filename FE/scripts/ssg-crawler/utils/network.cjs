const axios = require('axios');
const https = require('https');
const http = require('http');

function getAgent(urlObj) {
    const isHttps = urlObj.protocol === 'https:';
    const options = { keepAlive: false, rejectUnauthorized: false, servername: urlObj.hostname };
    return isHttps ? new https.Agent(options) : new http.Agent(options);
}

async function fetchXml(url) {
    try {
        const urlObj = new URL(url);
        const agent = getAgent(urlObj);

        const { data } = await axios.get(url, {
            httpsAgent: urlObj.protocol === 'https:' ? agent : undefined,
            httpAgent: urlObj.protocol !== 'https:' ? agent : undefined,
            headers: {
                'User-Agent': 'KolsherutTestBot',
                'Connection': 'close',
                'Accept-Encoding': 'gzip, deflate'
            },
            timeout: 15000
        });

        const isValid = typeof data === 'string' &&
            (data.includes('<?xml') || data.includes('<urlset') || data.includes('<sitemapindex'));

        return isValid ? data : null;
    } catch (error) {
        return null;
    }
}

module.exports = { fetchXml };
