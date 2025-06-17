import {Request, Response} from "express";
import logger from "../services/logger/logger";
import getCard from "../services/db/es/getCard";
import {asyncHandler} from "../middlewares/errorHandler";

export default asyncHandler(async (req: Request, res: Response) => {
    const {card_id} = req.params;
    const card = await getCard(card_id);
    logger.log({service: "Card Routes", message: `Fetched card with ID: ${card_id}`, payload: card});
    res.status(200).json({success: true, data: card});
});

