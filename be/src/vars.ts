import path from "path";

export default {
    serverSetups: {
        origin: process.env.ORIGIN || '*',
        environment: process.env.ENV || 'dev',
        port: process.env.PORT || 3000,
        elastic: {
            connection: {
                compression: true,
                node: process.env.ELASTIC_URL || 'http://localhost:9200',
                auth: {
                    username: process.env.ELASTIC_USERNAME || 'elastic',
                    password: process.env.ELASTIC_PASSWORD || 'your-password'
                }
            },
            reconnectTimeout: parseInt(process.env.ELASTIC_RECONNECT_TIMEOUT || '5') * 1000,
            indices: {
                card: "srm__cards_20220926183305498944_a9274d22",
                homepage: "srm__homepage_20240523001317126410_9fa37757",
                autocomplete: "srm__autocomplete_20240505135631716607_372901c0",
                locations: "srm__places_20220926183316169381_f69c0129"
            }
        }
    },
    defaultParams:{
        searchCards:{
        fast:{
            size:  parseInt(process.env.SEARCHCARDS_FIRST_LENGTH || '50'),
            offset: 0,
            innerHitsSize: 1000
        },
        rest:{
            size: 300,
            offset:  parseInt(process.env.SEARCHCARDS_FIRST_LENGTH || '50'),
            innerHitsSize: 1000
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
