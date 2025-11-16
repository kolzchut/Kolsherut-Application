import {asyncHandler} from "../middlewares/errorHandler";
import {Request, Response} from "express";
import searchCards from "../services/db/es/searchCards";
import {sendEmailWhenNoResults} from "../utilities/sendTimedEmails";

export default asyncHandler(async (req: Request, res: Response) => {
    const {searchQuery, isFast, responseId, situationId, by} = req.body;
    if (!searchQuery)
        return res.status(400).json({
            success: false,
            message: "You need to provide searchQuery"
        });
    const fixedSearchQuery = searchQuery.replace('_', " ")

    const results = await searchCards({fixedSearchQuery, isFast, responseId, situationId, by})
    // if (!results.length && isFast) sendEmailWhenNoResults({fixedSearchQuery, responseId, situationId, by});
    res.status(200).json({success: true, data: results});
});
