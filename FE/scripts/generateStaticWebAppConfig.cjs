const fs = require('fs');
const path = require('path');

const env = process.env.ENVIRONMENT || 'local';
console.log(`🔧 Generating staticwebapp config for environment: ${env}`);

try {
    const configsDir = path.join(__dirname, '../public/configs');
    const envConfigPath = path.join(configsDir, `${env}.json`);
    const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf-8'));

    console.log(`📡 Backend server: ${envConfig.server}`);

    // --- BASE CONFIGURATION ---
    const config = {
        navigationFallback: {
            rewrite: "/index.html",
            // CRITICAL: Exclude SSG paths so Azure looks for the file first
            exclude: [
                "/assets/*",
                "/icons/*",
                "/configs/*",
                "/sitemap/*",
                "/sitemap.xml",
                "/p/results/*",
                "/p/card/*",
                "*.{css,js,json,xml,txt,svg,png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot}"
            ]
        },
        routes: [
            // Add Cache Headers for your static content
            {
                route: "/p/results/*",
                headers: { "Cache-Control": "public, max-age=86400, immutable" }
            },
            {
                route: "/p/card/c/*",
                headers: { "Cache-Control": "public, max-age=604800, immutable" }
            }
        ],
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

    // --- ENVIRONMENT SPECIFIC LOGIC ---
    if (env !== 'local') {
        config.globalHeaders["Cache-Control"] = "no-cache, must-revalidate, proxy-revalidate";
        config.globalHeaders["Pragma"] = "no-cache";
        config.globalHeaders["Expires"] = "0";

        if (env === 'production') {
            config.routes.push(
                { route: "/c/:cardId", redirect: "/p/card/c/:cardId", statusCode: 301 },
                { route: "/s/:query", redirect: "/p/results/sq/:query/old=true", statusCode: 301 },
                { route: "/s/מיצוי_זכויות", redirect: "/p/results/sq/%D7%9E%D7%99%D7%A6%D7%95%D7%99_%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA/lf/%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3/brf/human_services%3Alegal%3Aadvocacy_legal_aid%3Aunderstand_government_programs", statusCode: 302 },
                { route: "/s/מתמודדי_נפש", redirect: "/p/results/sq/%D7%9E%D7%AA%D7%9E%D7%95%D7%93%D7%93%D7%99_%D7%A0%D7%A4%D7%A9/lf/%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3/bsf/human_situations%3Adisability%3Amental_illness", statusCode: 302 },
                { route: "/s/אוטיסטים", redirect: "/p/results/sq/%D7%90%D7%95%D7%98%D7%99%D7%A1%D7%98%D7%99%D7%9D/lf/%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3/bsf/human_situations%3Adisability%3Aautistic_spectrum", statusCode: 302 }
            );
        } else {
            // Dev/Stage Redirects
            config.routes.push(
                { route: "/c/:cardId", redirect: "/?p=card&c=:cardId", statusCode: 301 },
                { route: "/s/:query", redirect: "/?p=results&sq=:query&old=true", statusCode: 301 },
                { route: "/s/מיצוי_זכויות", redirect: "/?p=results&sq=%D7%9E%D7%99%D7%A6%D7%95%D7%99_%D7%96%D7%9B%D7%95%D7%99%D7%95%D7%AA&lf=%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3&brf=human_services%3Alegal%3Aadvocacy_legal_aid%3Aunderstand_government_programs", statusCode: 302 },
                { route: "/s/מתמודדי_נפש", redirect: "/?p=results&sq=%D7%9E%D7%AA%D7%9E%D7%95%D7%93%D7%93%D7%99_%D7%A0%D7%A4%D7%A9&lf=%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3&bsf=human_situations%3Adisability%3Amental_illness", statusCode: 302 },
                { route: "/s/אוטיסטים", redirect: "/?p=results&sq=%D7%90%D7%95%D7%98%D7%99%D7%A1%D7%98%D7%99%D7%9D&lf=%D7%9B%D7%9C+%D7%94%D7%90%D7%A8%D7%A5%7C34.2%2C29.5%2C35.6%2C33.3&bsf=human_situations%3Adisability%3Aautistic_spectrum", statusCode: 302 }
            );
        }
    }

    // SPA Routes (Cleaned)
    config.routes.push(
        { route: "/p/sitemap", rewrite: "/index.html" }
    );

    const outputPath = path.join(__dirname, `../staticwebapp-${env}.config.json`);
    fs.writeFileSync(outputPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log(`✅ Generated staticwebapp-${env}.config.json`);

} catch (error) {
    console.error('❌ Failed to generate staticwebapp config:', error);
    process.exit(1);
}
