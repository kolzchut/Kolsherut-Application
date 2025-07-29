import {ILabel} from "../../types/homepageType";
import {store} from "../store";
import {setLoading, setPage, settingURLParamsToResults} from "../general/generalSlice";
import {setResults} from "../data/dataSlice";
import fetchResults from "../../services/searchUtilities/fetchResults";
import { resetFilters, setFilters } from "../filter/filterSlice";
import setupNewFilters from "./utilities/setupNewFilters";

export const settingToResults = async ({value, removeOldFilters}: { value: ILabel, removeOldFilters: boolean }) => {
    store.dispatch(setResults([]))
    store.dispatch(setLoading(true));
    store.dispatch(settingURLParamsToResults(value.query))
    const fetchedResults = await fetchResults({
        responseId: value.response_id,
        situationId: value.situation_id,
        searchQuery: value.query
    });
    store.dispatch(setResults(fetchedResults || []));
    const newFilters = setupNewFilters({results: fetchedResults, value});
    if (removeOldFilters) store.dispatch(resetFilters(newFilters))
    if (!removeOldFilters) store.dispatch(setFilters(newFilters));
    store.dispatch(setLoading(false));

}

export const backToResults = () => {
    store.dispatch(setPage('results'));
}

