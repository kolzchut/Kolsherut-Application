import {asyncHandler} from "../middlewares/errorHandler";
import {Request, Response} from "express";
import logger from "../services/logger/logger";

import initialAutoComplete from "../services/db/es/initialAutoComplete";
import {transformAutocompleteUtilities} from "../utilities/transformAutocompleteUtilities";

export default asyncHandler(async (req: Request, res: Response) => {
    const rawAutoComplete = await initialAutoComplete();
    const mergeAutoComplete = rawAutoComplete.flatMap((item: any) => ({
        _score: item.hits._score || 0,
        source: {...item.hits.hits[0]._source}
    }));
    const transformedAutoComplete = transformAutocompleteUtilities(mergeAutoComplete, false);
    const mergedAfterTransformedAndWithNoHighlights = [...transformedAutoComplete.structured || [], ...transformedAutoComplete.unstructured || []]
        .map(e => ({...e, labelHighlighted: null}));
    logger.log({
        service: "Initial AutoComplete Route",
        message: `Fetched autocomplete`,
        payload: mergedAfterTransformedAndWithNoHighlights
    });
    res.status(200).json(mergedAfterTransformedAndWithNoHighlights);
});
