import path from "path";

export default {
    serverSetups:{
        origin: process.env.ORIGIN || '*',
        environment: process.env.ENV || 'dev',
        port: process.env.PORT || 3000,
    },
    logs: {
        verbose: process.env.VERBOSE === 'true',
        logToFile: process.env.LOG_TO_FILE === 'true',
        loggerFolderPath: path.join(process.cwd(), 'logs'),
        logDuration: 60 * 1000 * parseInt(process.env.LOG_DURATION || '10'),
    }
};
