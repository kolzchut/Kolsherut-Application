const { execSync } = require('child_process');
const { version } = require('../package.json');
const path = require('path');
const action = process.argv[2]; // 'build' or 'save'
const env = process.argv[3] || 'local'; // default to 'local'

if (!['build', 'save'].includes(action)) {
    console.error('❌ Please specify an action: "build" or "save"');
    process.exit(1);
}
const envSuffix = env === 'local' ? '' : `-${env}`;
const imageName = `kolsherut_fe:${version}${envSuffix}`;
const tarName = `kolsherut_fe.${version}${envSuffix}.tar`;
const tarPath = path.join('..', 'tars', tarName);

console.log(`🚀 Running Docker ${action} for ${env} (v${version})...`);

try {
    if (action === 'build') {
        const cmd = `docker build --build-arg environment=${env} -t ${imageName} .`;
        console.log(`> ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });
    }

    else if (action === 'save') {
        const cmd = `docker save -o "${tarPath}" ${imageName}`;
        console.log(`> ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });
    }

} catch (error) {
    console.error(`❌ Docker ${action} failed.`);
    process.exit(1);
}
