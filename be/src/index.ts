import express, {Request, Response} from 'express';
import {createServer} from 'http';
import vars from "./vars";
import logger from "./services/logger/logger";
import cors from 'cors';
import cardRoute from "./routes/cardRoute";
import {init as dbInit} from "./services/db/db";
import {errorHandler} from "./middlewares/errorHandler";
import logRoute from "./routes/logRoute";
import searchRoute from "./routes/searchRoute";
import autoCompleteRoute from "./routes/autoCompleteRoute";
import siteMapForModalRoute from "./routes/siteMapForModalRoute";
import sitemapRouter from "./routes/sitemapRouter";
import ssrRoute from "./routes/ssrRoute";
import {initEmailService} from "./services/email/emailService";
import {closeBrowser} from "./services/ssr/ssrService";
import {sanitizeCardRoute} from "./utilities/sanitizeRoutes";

const app = express();
const httpServer = createServer(app);

const {port, environment, origin} = vars.serverSetups;

app.use(express.json());
app.use(cors({origin}));

app.get('/test', (req: Request, res: Response) => {
    res.status(200).json({message:'Server is running 🍍☺', success: true});
});
app.get('/autocomplete/:search', autoCompleteRoute);
app.get('/card/:card_id', [sanitizeCardRoute, cardRoute]);
app.post('/search', searchRoute);
app.post('/logs/:provider', logRoute);
app.get('/siteMapForModal', siteMapForModalRoute);
app.use('/sitemap', sitemapRouter);
app.use('/ssr', ssrRoute);
app.use(errorHandler);

httpServer.listen(port, () => {
    logger.logAlways({service: "HTTP" , message:`Server running on port:${port} - ${environment} mode, available at ${origin}`});
});

const start = async () => {
    console.log('Starting server...');
    logger.log({service:"Show indices",message:"using indices:",payload: vars.serverSetups.elastic.indices});
    initEmailService();
    await dbInit();
};

process.on('SIGTERM', async () => {
    logger.logAlways({service: "Server", message: "SIGTERM received, closing browser..."});
    await closeBrowser();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.logAlways({service: "Server", message: "SIGINT received, closing browser..."});
    await closeBrowser();
    process.exit(0);
});


start();
