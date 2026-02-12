const http = require('http');
const handler = require('serve-handler');
const { DIST_DIR, PORT } = require('../config.cjs');

function createServerHandler() {
    return (req, res) => {
        return handler(req, res, {
            public: DIST_DIR,
            rewrites: [{ source: '**', destination: '/index.html' }]
        });
    };
}

function startLocalServer() {
    const server = http.createServer(createServerHandler());

    return new Promise((resolve) => {
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 --- Step 2: Build Server Started on Port ${PORT} ---`);
            resolve(server);
        });
    });
}

module.exports = { startLocalServer };
