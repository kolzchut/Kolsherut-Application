import express, {Request, Response} from 'express';
import {createServer} from 'http';
import vars from "./vars";
import logger from "./services/logger/logger";
import cors from 'cors';
import cardRouter from "./routes/card";
import {init as dbInit} from "./services/db/db";
import {errorHandler} from "./middlewares/errorHandler";

const app = express();
const httpServer = createServer(app);

const {port, environment, origin} = vars.serverSetups;

app.use(express.json());
app.use(cors({origin}));

app.get('/test', (req: Request, res: Response) => {
    res.status(200).json({message:'Server is running 🍍☺', success: true});
});

app.use('/card', cardRouter);

app.use(errorHandler);
httpServer.listen(port, () => {
    logger.logAlways({service: "HTTP" , message:`Server running on port:${port} - ${environment} mode, available at ${origin}`});
});

const start = async () => {
    console.log('Starting server...');
    await dbInit();
};

start();
