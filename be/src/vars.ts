import path from "path";

export default {
    serverSetups: {
        origin: process.env.ORIGIN || '*',
        environment: process.env.ENV || 'local',
        port: process.env.PORT || 5000,
        elastic: {
            connection: {
                compression: true,
                node: process.env.ELASTIC_URL || 'http://localhost:9200',
                auth: {
                    username: process.env.ELASTIC_USERNAME || 'elastic',
                    password: process.env.ELASTIC_PASS || 'your-password'
                }
            },
            reconnectTimeout: parseInt(process.env.ELASTIC_RECONNECT_TIMEOUT || '5') * 1000,
            indices: process.env.ENV === 'prod' ? {
                card: "srm__cards_20240417210351058073_bb6360fd",
                autocomplete: "srm__autocomplete_20230214172220805473_23f43e2a",
                presets: "srm__presets_20211201201949753432_1915f3c0"
            } : {
                card: "srm__cards_20220926183305498944_a9274d22",
                autocomplete: "srm__autocomplete_20240505135631716607_372901c0",
                presets: "srm__presets_20220322175100923906_0199cd26"
            },
            autocompleteMinScore: parseFloat(process.env.AUTOCOMPLETE_MIN_SCORE || '5000')
        }
    },
    defaultParams: {
        searchCards: {
            fast: {
                size: parseInt(process.env.SEARCHCARDS_FIRST_LENGTH || '50'),
                offset: 0,
                innerHitsSize: 1000
            },
            rest: {
                size: 300,
                offset: parseInt(process.env.SEARCHCARDS_FIRST_LENGTH || '50'),
                innerHitsSize: 1000
            }
        }
    },
    logs: {
        verbose: process.env.VERBOSE === 'true',
        logToFile: process.env.LOG_TO_FILE === 'true',
        loggerFolderPath: path.join(process.cwd(), 'logs'),
        logDuration: 60 * 1000 * parseInt(process.env.LOG_DURATION || '10'),
    },
    yaml_url: "https://raw.githubusercontent.com/kolzchut/openeligibility/refs/heads/main/taxonomy.tx.yaml",
    email: {
        SMTP_SERVER: 'smtp.gmail.com',
        SMTP_PORT: 587,
        EMAIL_NOTIFIER_SENDER_EMAIL:  process.env.EMAIL_NOTIFIER_SENDER_EMAIL,
        EMAIL_NOTIFIER_PASSWORD: process.env.EMAIL_NOTIFIER_PASSWORD,
        EMAIL_NOTIFIER_RECIPIENT_LIST: (process.env.EMAIL_NOTIFIER_RECIPIENT_LIST || "ariel_ohana@webiks.com,eli.rabby@kolzchut.org.il,efrat.shamir@kolzchut.org.il").split(','),
        EMAIL_INTERVAL_HOURS: parseInt(process.env.EMAIL_INTERVAL_HOURS || '6'),
    },
    sitemap:{
        minimumLastModifiedForCards: process.env.SITEMAP_MINIMUM_LAST_MODIFIED_FOR_CARDS || '2026-01-19T09:00:00',
    }
};
