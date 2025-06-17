import {Response, Request} from "express";
import logger from "../services/logger/logger";


export default (req: Request, res: Response) => {
    const service = `${req.params.provider || ''}`
    const {message, payload} = req.body
    logger.logAlways({service,message,payload})
    res.status(200).json("Log Received");
};
