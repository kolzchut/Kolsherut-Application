import path from "path";

export default {
    serverSetups:{
        origin: process.env.ORIGIN || '*',
        environment: process.env.ENV || 'dev',
        port: process.env.PORT || 3000,
        elastic:{
            connection:{
                node: process.env.ELASTIC_URL || 'http://localhost:9200',
                auth: {
                    username: process.env.ELASTIC_USERNAME || 'your-username',
                    password: process.env.ELASTIC_PASSWORD || 'your-password'
                }
            },
            reconnectTimeout: parseInt(process.env.ELASTIC_RECONNECT_TIMEOUT || '5') * 1000,
            indices:{
              card: "srm__cards_20220926183305498944_a9274d22"
            }
        }
    },
    logs: {
        verbose: process.env.VERBOSE === 'true',
        logToFile: process.env.LOG_TO_FILE === 'true',
        loggerFolderPath: path.join(process.cwd(), 'logs'),
        logDuration: 60 * 1000 * parseInt(process.env.LOG_DURATION || '10'),
    }
};
