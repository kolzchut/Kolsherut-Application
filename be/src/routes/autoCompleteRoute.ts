import {asyncHandler} from "../middlewares/errorHandler";
import {Request, Response} from "express";
import logger from "../services/logger/logger";
import autoComplete from "../services/db/es/autoComplete";
import transformAutocompleteStructure from "../utilities/transformAutocompleteStructure";

export default asyncHandler(async (req: Request, res: Response) => {
    const {search} = req.params
    const rawAutoComplete = await autoComplete(search);
    const autocomplete = transformAutocompleteStructure(rawAutoComplete);
    logger.log({service: "AutoComplete Route", message: `Fetched autocomplete`, payload: autocomplete});
    res.status(200).json({success: true, data: autocomplete});
});
