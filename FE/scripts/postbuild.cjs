const fs = require('fs');
const path = require('path');

const env = process.env.ENVIRONMENT || 'local';

console.log(`📦 Running postbuild for environment: ${env}`);

try {
    // Paths
    const distDir = path.join(__dirname, '../dist');
    const configsDir = path.join(distDir, 'configs');

    // Source files
    const envJsonSource = path.join(configsDir, `${env}.json`);
    const swaConfigSource = path.join(__dirname, `../staticwebapp-${env}.config.json`);

    // Destination files
    const envJsonDest = path.join(configsDir, 'environment.json');
    const swaConfigDest = path.join(distDir, 'staticwebapp.config.json');

    // Ensure dist directory exists
    if (!fs.existsSync(distDir)) {
        console.error('❌ dist directory does not exist');
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

    // Copy staticwebapp.config.json (for Azure Static Web Apps)
    if (fs.existsSync(swaConfigSource)) {
        fs.copyFileSync(swaConfigSource, swaConfigDest);
        console.log(`✅ Copied staticwebapp-${env}.config.json → dist/staticwebapp.config.json`);
    } else {
        console.warn(`⚠️  staticwebapp-${env}.config.json not found (will use default SWA routing)`);
    }

    console.log(`🎉 Postbuild completed successfully for ${env} environment`);

} catch (error) {
    console.error('❌ Postbuild failed:', error);
    process.exit(1);
}
