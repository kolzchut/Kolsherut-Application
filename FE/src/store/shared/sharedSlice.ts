import {ILabel} from "../../types/homepageType";
import {store} from "../store";
import {setLoading, setPage, settingURLParamsToResults} from "../general/generalSlice";
import {setResults} from "../data/dataSlice.ts";
import fetchResults from "../../services/searchUtilities/fetchResults.ts";
import {
    resetFilters, setFilters,
} from "../filter/filterSlice.ts";
import ILocation from "../../types/locationType.ts";

export const settingToResults = async ({value, removeOldFilters}: { value: ILabel, removeOldFilters: boolean }) => {
    store.dispatch(setLoading(true));
    store.dispatch(settingURLParamsToResults(value.query))
    const fetchedResults = await fetchResults({
        responseId: value.response_id,
        situationId: value.situation_id,
        searchQuery: value.query
    });
    store.dispatch(setResults(fetchedResults || []));

    const newFilters: { location?: ILocation, situations?: string[], responses?: string[] } = {};
    if (value.situation_id) newFilters.situations = [value.situation_id];
    if (value.response_id) newFilters.responses = [value.response_id];
    if (value.cityName && value.bounds) newFilters.location = {key: value.cityName, bounds: value.bounds};
    if (removeOldFilters) store.dispatch(resetFilters(newFilters))
    if (!removeOldFilters) store.dispatch(setFilters(newFilters));
    store.dispatch(setLoading(false));

}

export const backToResults = () => {
    store.dispatch(setPage('results'));
}

