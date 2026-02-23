const fs = require('fs');
const path = require('path');

const env = process.env.ENVIRONMENT || 'local';
console.log(`🔧 Generating staticwebapp config for environment: ${env}`);

function loadRedirectsMap() {
    const mapPath = path.join(__dirname, '../redirects.map');
    if (!fs.existsSync(mapPath)) {
        console.warn('⚠️  redirects.map not found, skipping redirect map entries.');
        return [];
    }

    return fs.readFileSync(mapPath, 'utf-8')
        .split('\n')
        .map(line => {
            const match = line.trim().match(/^"([^"]+)"\s+"([^"]+)"\s*;?\s*$/);
            return match ? {route: match[1], redirect: match[2], statusCode: 301} : null;
        })
        .filter(Boolean);
}

try {
    const configsDir = path.join(__dirname, '../public/configs');
    const envConfigPath = path.join(configsDir, `${env}.json`);
    const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf-8'));
    const server = (envConfig.server || '').replace(/\/+$/, '');

    console.log(`📡 Backend server: ${server}`);

    const config = {
        navigationFallback: {
            rewrite: "/index.html",
            exclude: [
                "/assets/*", "/icons/*", "/configs/*", "/sitemap/*", "/sitemap.xml",
                "/p/results/*", "/p/card/*",
                "*.{css,js,json,xml,txt,svg,png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot}"
            ]
        },
        routes: [
            {route: "/", rewrite: "/home/index.html"},
            {route: "/p/results/*", headers: {"Cache-Control": "public, max-age=86400, immutable"}},
            {route: "/p/card/c/*", headers: {"Cache-Control": "public, max-age=604800, immutable"}},
            {route: "/p/sitemap", rewrite: "/index.html"},
            {
                route: "*.{css,js,jpg,jpeg,gif,png,ico,svg,woff,woff2,ttf,eot}",
                headers: {"Cache-Control": "public, max-age=31536000, immutable"}
            }
        ],
        responseOverrides: {
            "404": {rewrite: "/index.html", statusCode: 200},
            "500": {rewrite: "/50x.html"},
            "502": {rewrite: "/50x.html"},
            "503": {rewrite: "/50x.html"},
            "504": {rewrite: "/50x.html"}
        },
        globalHeaders: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "x-request-id,Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With",
            "Access-Control-Max-Age": "1728000",
            "ETag": "",
            "Content-Type": "text/html; charset=utf-8"
        },
        mimeTypes: {
            ".json": "application/json",
            ".xml": "application/xml"
        }
    };

    if (env !== 'local') {
        config.globalHeaders["Cache-Control"] = "no-cache, must-revalidate, proxy-revalidate";
        config.globalHeaders["Pragma"] = "no-cache";
        config.globalHeaders["Expires"] = "0";

        config.routes.push(...loadRedirectsMap());

        if (server) {
            config.routes.push(
                {route: "/sitemap/cards.xml", redirect: `${server}/sitemap/cards`, statusCode: 301},
                {route: "/sitemap/taxonomy.xml", redirect: `${server}/sitemap/taxonomy`, statusCode: 301},
                {route: "/sitemap/mixedtaxonomy.xml", redirect: `${server}/sitemap/mixedtaxonomy`, statusCode: 301}
            );
        }
    }

    const outputPath = path.join(__dirname, `../staticwebapp-${env}.config.json`);
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`✅ Generated staticwebapp-${env}.config.json`);

} catch (error) {
    console.error('❌ Failed to generate staticwebapp config:', error);
    process.exit(1);
}
