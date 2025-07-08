import {asyncHandler} from "../middlewares/errorHandler";
import {Request, Response} from "express";
import searchCards from "../services/db/es/searchCards";
import elasticFormater from "../services/db/es/elasticFormater";
import collapseHitsByGroup from "../utilities/collapseHitsByGroup";
import {mockServices} from "../mocks";

export default asyncHandler(async (req: Request, res: Response) => {
    const {serviceName, responseId, situationId} = req.body;
    if (!serviceName && !responseId && !situationId)
        return res.status(400).json({
            success: false,
            message: "You need to provide at least one of the search fields - serviceName, responseId or situationId"
        });

    return res.status(200).json({success:true, data:mockServices}) // TODO: REMOVE THE MOCK AND USE THE ACTUAL SEARCH FUNCTION

    let results = elasticFormater(await searchCards(serviceName, responseId, situationId));
    results = collapseHitsByGroup(results);
    res.status(200).json({success: true, data: results});
});
