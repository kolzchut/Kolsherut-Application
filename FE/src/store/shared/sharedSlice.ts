import {ILabel} from "../../types/homepageType";
import {store} from "../store";
import {setPage, settingURLParamsToResults} from "../general/generalSlice";
import {setResults} from "../data/dataSlice.ts";
import fetchResults from "../../services/searchUtilities/fetchResults.ts";
import {
    resetFilters, setFilters,
} from "../filter/filterSlice.ts";
import ILocation from "../../types/locationType.ts";

export const settingToResults = async ({value, removeOldFilters}: { value: ILabel, removeOldFilters: boolean }) => {
    store.dispatch(settingURLParamsToResults(value.title))
    const fetchedResults = await fetchResults({
        responseId: value.response_id,
        situationId: value.situation_id,
        searchQuery: value.title
    });
    store.dispatch(setResults(fetchedResults || []));

    const newFilters: { location?: ILocation, situations?: string[], responses?: string[] } = {};
    if (value.situation_id) newFilters.situations = [value.situation_id];
    if (value.response_id) newFilters.responses = [value.response_id];
    if (value.cityName && value.bounds) newFilters.location = {key: value.cityName, bounds: value.bounds};
    if (removeOldFilters) return store.dispatch(resetFilters(newFilters))
    store.dispatch(setFilters(newFilters));
}

export const backToResults = () => {
    store.dispatch(setPage('results'));
}

