const fs = require('fs');
const path = require('path');

const env = process.env.ENVIRONMENT || 'local';

console.log(`🔧 Generating staticwebapp config for environment: ${env}`);

try {
    // Read environment config to get backend URL
    const configsDir = path.join(__dirname, '../public/configs');
    const envConfigPath = path.join(configsDir, `${env}.json`);
    const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf-8'));

    const backendServer = envConfig.server;
    console.log(`📡 Backend server: ${backendServer}`);

    // Base configuration
    const config = {
        navigationFallback: {
            rewrite: "/index.html",
            exclude: ["/assets/*", "/icons/*", "/configs/*", "/sitemap/*", "/sitemap.xml", "*.{css,js,json,xml,txt,svg,png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot}"]
        },
        routes: [],
        responseOverrides: {
            "404": {
                rewrite: "/index.html",
                statusCode: 200
            }
        },
        globalHeaders: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "x-request-id,Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With",
            "Access-Control-Max-Age": "1728000"
        },
        mimeTypes: {
            ".json": "application/json",
            ".xml": "application/xml"
        }
    };

    // Add legacy redirects for non-local environments
    if (env !== 'local') {
        const redirectBase = (env === 'production') ? '/p/' : '/?';
        const redirectFormat = (env === 'production')
            ? (route) => `/p/${route}`
            : (route) => `/?${route}`;

        if (env === 'production') {
            // Production uses /p/ paths
            config.routes.push(
                { route: "/c/:cardId", redirect: "/p/card/c/:cardId", statusCode: 301 },
                { route: "/s/:query", redirect: "/p/results/sq/:query/old=true", statusCode: 301 },
                { route: "/s/מיצוי_זכויות", redirect: "/p/results/sq/%D7%9E%D7%99%D7%A6%D7%95%D7%99_%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA/lf/%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3/brf/human_services%3Alegal%3Aadvocacy_legal_aid%3Aunderstand_government_programs", statusCode: 302 },
                { route: "/s/מתמודדי_נפש", redirect: "/p/results/sq/%D7%9E%D7%AA%D7%9E%D7%95%D7%93%D7%93%D7%99_%D7%A0%D7%A4%D7%A9/lf/%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3/bsf/human_situations%3Adisability%3Amental_illness", statusCode: 302 },
                { route: "/s/אוטיסטים", redirect: "/p/results/sq/%D7%90%D7%95%D7%98%D7%99%D7%A1%D7%98%D7%99%D7%9D/lf=%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3/bsf/human_situations%3Adisability%3Aautistic_spectrum", statusCode: 302 }
            );
        } else {
            // Development/Stage use query string format
            config.routes.push(
                { route: "/c/:cardId", redirect: "/?p=card&c=:cardId", statusCode: 301 },
                { route: "/s/:query", redirect: "/?p=results&sq=:query&old=true", statusCode: 301 },
                { route: "/s/מיצוי_זכויות", redirect: "/?p=results&sq=%D7%9E%D7%99%D7%A6%D7%95%D7%99_%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA&lf=%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3&brf=human_services%3Alegal%3Aadvocacy_legal_aid%3Aunderstand_government_programs", statusCode: 302 },
                { route: "/s/מתמודדי_נפש", redirect: "/?p=results&sq=%D7%9E%D7%AA%D7%9E%D7%95%D7%93%D7%93%D7%99_%D7%A0%D7%A4%D7%A9&lf=%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3&bsf=human_situations%3Adisability%3Amental_illness", statusCode: 302 },
                { route: "/s/אוטיסטים", redirect: "/?p=results&sq=%D7%90%D7%95%D7%98%D7%99%D7%A1%D7%98%D7%99%D7%9D&lf=%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3&bsf=human_situations%3Adisability%3Aautistic_spectrum", statusCode: 302 }
            );
        }
    }

    // Add API proxy routes for sitemap endpoints
    // Azure SWA uses "route" for matching and "redirect" for proxying to external URLs
    config.routes.push(
        {
            route: "/sitemap/cards.xml",
            redirect: `${backendServer}/sitemap/cards`,
            statusCode: 200
        },
        {
            route: "/sitemap/taxonomy.xml",
            redirect: `${backendServer}/sitemap/taxonomy`,
            statusCode: 200
        },
        {
            route: "/sitemap/mixedtaxonomy.xml",
            redirect: `${backendServer}/sitemap/mixedtaxonomy`,
            statusCode: 200
        }
    );

    // Add SPA routes
    config.routes.push(
        { route: "/p/sitemap", rewrite: "/index.html" },
        { route: "/p/*", rewrite: "/index.html" }
    );

    // Add cache control headers for non-local environments
    if (env !== 'local') {
        config.globalHeaders["Cache-Control"] = "no-cache, must-revalidate, proxy-revalidate";
        config.globalHeaders["Pragma"] = "no-cache";
        config.globalHeaders["Expires"] = "0";
    }

    // Write the generated config to the FE root directory
    const outputPath = path.join(__dirname, `../staticwebapp-${env}.config.json`);
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf-8');

    console.log(`✅ Generated staticwebapp-${env}.config.json with backend: ${backendServer}`);

} catch (error) {
    console.error('❌ Failed to generate staticwebapp config:', error);
    process.exit(1);
}
