import {ILabel} from "../../types/homepageType";
import {store} from "../store";
import {setPage, settingURLParamsToResults} from "../general/generalSlice";
import {setResults} from "../data/dataSlice.ts";
import fetchResults from "../../services/searchUtilities/fetchResults.ts";
import {addResponseFilter, addSituationFilter, removeFilters} from "../filter/filterSlice.ts";

export const settingToResults = async ({value}: { value: ILabel }) => {
    store.dispatch(settingURLParamsToResults(value.title))
    const fetchedResults = await fetchResults({
        responseId: value.response_id,
        situationId: value.situation_id,
        searchQuery: value.title
    });
    if (!fetchedResults || fetchedResults.length === 0) return;
    store.dispatch(setResults(fetchedResults));
    store.dispatch(removeFilters())
    if (value.response_id) store.dispatch(addResponseFilter(value.response_id));
    if (value.situation_id) store.dispatch(addSituationFilter(value.situation_id));
}

export const backToResults = () => {
    store.dispatch(setPage('results'));
}

