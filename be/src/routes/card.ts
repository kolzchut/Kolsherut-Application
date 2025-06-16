import {Request, Response, Router} from "express";
import logger from "../services/logger/logger";
import getCard from "../services/db/es/getCard";
import searchCards from "../services/db/es/searchCards";
import {asyncHandler} from "../middlewares/errorHandler";

const cardRouter = Router();

cardRouter.get('/:card_id', asyncHandler(async (req: Request, res: Response) => {
    const {card_id} = req.params;
    const card = await getCard(card_id);
    logger.log({service: "Card Routes", message: `Fetched card with ID: ${card_id}`, payload: card});
    res.status(200).json({success: true, data: card});
}));

cardRouter.post('/search', asyncHandler(async (req: Request, res: Response) => {
    const {serviceName, responseId, situationId} = req.body;
    if (!serviceName && !responseId && !situationId)
        return res.status(400).json({
            success: false,
            message: "You need to provide at least one of the search fields - serviceName, responseId or situationId"
        });

    const results = await searchCards(serviceName, responseId, situationId);
    res.status(200).json({success: true, data: results});
}));

export default cardRouter;
