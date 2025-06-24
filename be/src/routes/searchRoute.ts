import {asyncHandler} from "../middlewares/errorHandler";
import {Request, Response} from "express";
import searchCards from "../services/db/es/searchCards";
import elasticFormater from "../services/db/es/elasticFormater";

export default asyncHandler(async (req: Request, res: Response) => {
    const {serviceName, responseId, situationId} = req.body;
    if (!serviceName && !responseId && !situationId)
        return res.status(400).json({
            success: false,
            message: "You need to provide at least one of the search fields - serviceName, responseId or situationId"
        });

    const results = elasticFormater(await searchCards(serviceName, responseId, situationId));
    res.status(200).json({success: true, data: results});
});
