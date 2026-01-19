const fs = require('fs');
const path = require('path');

const env = process.env.ENVIRONMENT || 'local';

console.log(`📦 Running postbuild for environment: ${env}`);

try {
    // Paths
    const distDir = path.join(__dirname, '../dist');
    const configsDir = path.join(distDir, 'configs');

    // Source files
    const nginxConfigSource = path.join(__dirname, `../nginx-${env}.conf`);
    const envJsonSource = path.join(configsDir, `${env}.json`);
    const redirectsSource = path.join(__dirname, '../redirects.map');

    // Destination files
    const nginxConfigDest = path.join(distDir, 'nginx.conf');
    const envJsonDest = path.join(configsDir, 'environment.json');
    const redirectsDest = path.join(distDir, 'redirects.map');

    // Ensure dist directory exists
    if (!fs.existsSync(distDir)) {
        console.error('❌ dist directory does not exist');
        process.exit(1);
    }

    // Copy nginx config
    if (fs.existsSync(nginxConfigSource)) {
        fs.copyFileSync(nginxConfigSource, nginxConfigDest);
        console.log(`✅ Copied nginx-${env}.conf → dist/nginx.conf`);
    } else {
        console.error(`❌ nginx-${env}.conf not found`);
        process.exit(1);
    }

    // Copy environment.json
    if (fs.existsSync(envJsonSource)) {
        fs.copyFileSync(envJsonSource, envJsonDest);
        console.log(`✅ Copied configs/${env}.json → dist/configs/environment.json`);
    } else {
        console.error(`❌ configs/${env}.json not found`);
        process.exit(1);
    }

    // Copy redirects.map
    if (fs.existsSync(redirectsSource)) {
        fs.copyFileSync(redirectsSource, redirectsDest);
        console.log(`✅ Copied redirects.map → dist/redirects.map`);
    } else {
        console.warn(`⚠️ redirects.map not found (optional)`);
    }

    console.log(`🎉 Postbuild completed successfully for ${env} environment`);

} catch (error) {
    console.error('❌ Postbuild failed:', error);
    process.exit(1);
}
