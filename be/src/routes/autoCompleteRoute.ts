import {asyncHandler} from "../middlewares/errorHandler";
import {Request, Response} from "express";
import logger from "../services/logger/logger";
import autoComplete from "../services/db/es/autoComplete";
import {
    transformAutoCompleteFromCardStructure,
    transformAutocompleteUtilities
} from "../utilities/transformAutocompleteUtilities";
import {pickTopAutocomplete} from "../utilities/mergeAutocompleteUtilities";
import ensureAutocompleteFallback from "../utilities/ensureAutocompleteFallback";
import extractServiceForAutocomplete from "../utilities/extractServiceForAutocomplete";

export default asyncHandler(async (req: Request, res: Response) => {
    const {search} = req.params
    const rawAutoComplete = await autoComplete(search);
    const autocomplete = transformAutocompleteUtilities(rawAutoComplete.autoCompleteResults, true);
    const autoCompleteFromCard = transformAutoCompleteFromCardStructure(rawAutoComplete.autoCompleteFromCardResults);
    autocomplete.unstructured = [...(autocomplete.unstructured || []), ...(autoCompleteFromCard.unstructured || [])];
    const autoCompleteOfServices = extractServiceForAutocomplete({search, autocompleteOptions: rawAutoComplete.autoCompleteFromCardResults});
    if(autoCompleteOfServices) autocomplete.structured.unshift(autoCompleteOfServices)

    const ensured = ensureAutocompleteFallback(autocomplete, search);

    const limitedAutocompleteOptions = pickTopAutocomplete(ensured, 5);
    logger.log({service: "AutoComplete Route", message: `Fetched autocomplete`, payload: limitedAutocompleteOptions});
    res.status(200).json({success: true, data: limitedAutocompleteOptions});
});
