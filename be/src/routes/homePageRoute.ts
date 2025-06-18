import {Request, Response} from "express";
import logger from "../services/logger/logger";
import {asyncHandler} from "../middlewares/errorHandler";
import getHomePage from "../services/db/es/getHomePage";
import elasticFormater from "../services/db/es/elasticFormater";



export default asyncHandler(async (_req: Request, res: Response) => {
    const rawHomepage = await getHomePage();
    const homepage = elasticFormater(rawHomepage);
    logger.log({service: "Card Routes", message: `Fetched homepage`, payload: homepage});
    res.status(200).json({success: true, data: homepage});
});

