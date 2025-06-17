import {Req} from "../types/expressTypes";
import {Response} from "express";
import logger from "../services/logger/logger";


export default (req: Req, res: Response) => {
    const user = req.user;
    const service = `${req.params.provider || ''} - ${user}`
    const {message, payload} = req.body
    logger.logAlways({service,message,payload})
    res.status(200).json("Log Received");
};
