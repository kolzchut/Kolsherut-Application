import {Request, Response} from "express";
import logger from "../services/logger/logger";
import getCard from "../services/db/es/getCard";
import {asyncHandler} from "../middlewares/errorHandler";
import getHomePage from "../services/db/es/getHomePage";

const homepageFormatter = (rawHomePage: any) => rawHomePage.hits.hits.map((hit: any) => hit._source);


export default asyncHandler(async (req: Request, res: Response) => {
    const rawHomepage = await getHomePage();
    const homepage = homepageFormatter(rawHomepage);
    logger.log({service: "Card Routes", message: `Fetched homepage`, payload: homepage});
    res.status(200).json({success: true, data: homepage});
});

