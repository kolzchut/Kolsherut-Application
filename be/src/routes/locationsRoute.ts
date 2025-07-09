import {Request, Response} from "express";
import logger from "../services/logger/logger";
import getLocations from "../services/db/es/getLocations";
import {asyncHandler} from "../middlewares/errorHandler";
import elasticFormater from "../services/db/es/elasticFormater";

export default asyncHandler(async (_: Request, res: Response) => {
    const locations = elasticFormater(await getLocations());
    logger.log({service: "Locations Routes", message: `Fetched locations`, payload: locations});
    res.status(200).json({success: true, data: locations});
});

