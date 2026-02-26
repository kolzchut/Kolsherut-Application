import path from "path";

const indices :any = {
    production: {
        card: "srm__cards_20260219134007017041_8f265ef7",
        autocomplete: "srm__autocomplete_20260219134330342056_0ddc6977",
    },
    stage: {
        card: "srm__cards_20220926183305498944_a9274d22", // TODO: UPDATE
        autocomplete: "srm__autocomplete_20240505135631716607_372901c0",// TODO: UPDATE
    },
    development:{
        card:"srm__cards_20260129133731521567_4f7801a8",
        autocomplete:"srm__autocomplete_20260129134047850681_2e67cc4e",
    }
}
export default {
    serverSetups: {
        origin: process.env.ORIGIN && process.env.ORIGIN.includes(',') ? process.env.ORIGIN.split(',').map(o => o.trim()) : (process.env.ORIGIN || '*'),
        environment: process.env.ENV || 'local',
        port: process.env.PORT || 5000,
        elastic: {
            connection: {
                compression: true,
                node: process.env.ELASTIC_URL || 'http://localhost:9200',
                auth: {
                    username: process.env.ELASTIC_USERNAME || 'elastic',
                    password: process.env.ELASTIC_PASS || 'your-password'
                },
            },
            reconnectTimeout: parseInt(process.env.ELASTIC_RECONNECT_TIMEOUT || '5') * 1000,
            indices: indices[process.env.ENV as keyof typeof indices] || indices.dev,
            autocompleteMinScore: parseFloat(process.env.AUTOCOMPLETE_MIN_SCORE || '5000')
        }
    },
    defaultParams: {
        searchCards: {
            fast: {
                size: parseInt(process.env.SEARCHCARDS_FIRST_LENGTH || '50'),
                offset: 0,
                innerHitsSize: 5000
            },
            rest: {
                size: 300,
                offset: parseInt(process.env.SEARCHCARDS_FIRST_LENGTH || '50'),
                innerHitsSize: 5000
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
        minimumLastModifiedForCards: process.env.SITEMAP_MINIMUM_LAST_MODIFIED_FOR_CARDS || '2026-02-01T09:00:00',
    },
    ssr: {
        userAgent: 'KolSherutBot/1.0',
        routesToBlock: [
            "search",
            "card"
        ],
        puppeteerLaunchOptions: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        },
        pageGotoOptions: {
            waitUntil: 'networkidle0',
            timeout: 30000,
        }
    }
};
