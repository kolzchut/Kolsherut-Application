import {asyncHandler} from "../middlewares/errorHandler";
import {Request, Response} from "express";
import searchCards from "../services/db/es/searchCards";

export default asyncHandler(async (req: Request, res: Response) => {
    const {searchQuery} = req.params;
    if (!searchQuery)
        return res.status(400).json({
            success: false,
            message: "You need to provide searchQuery"
        });
    const fixedSearchQuery = searchQuery.replace('_', " ")

    const results = await searchCards(fixedSearchQuery)
    res.status(200).json({success: true, data: results});
});
