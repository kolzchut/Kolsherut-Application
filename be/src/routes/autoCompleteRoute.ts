import {asyncHandler} from "../middlewares/errorHandler";
import {Request, Response} from "express";
import logger from "../services/logger/logger";
import elasticFormater from "../services/db/es/elasticFormater";
import autoComplete from "../services/db/es/autoComplete";

export default asyncHandler(async (req: Request, res: Response) => {
    const {search} = req.params
    const rawAutoComplete = await autoComplete(search);
    const autocomplete = elasticFormater(rawAutoComplete);
    logger.log({service: "Card Routes", message: `Fetched autocomplete`, payload: autocomplete});
    res.status(200).json({success: true, data: autocomplete});
});
