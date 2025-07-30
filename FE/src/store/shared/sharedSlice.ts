import {ILabel} from "../../types/homepageType";
import {store} from "../store";
import {setLoading, setPage, settingURLParamsToResults} from "../general/generalSlice";
import {setResults} from "../data/dataSlice";
import fetchResults from "../../services/searchUtilities/fetchResults";
import {resetFilters, setFilters} from "../filter/filterSlice";
import setupNewFilters from "./utilities/setupNewFilters";
import {IService} from "../../types/serviceType.ts";

export const settingToResults = async ({value, removeOldFilters}: { value: ILabel, removeOldFilters: boolean }) => {
    store.dispatch(setResults([]))
    store.dispatch(setLoading(true));
    store.dispatch(settingURLParamsToResults(value.query))

    const fetchBaseData = {
        responseId: value.response_id,
        situationId: value.situation_id,
        searchQuery: value.query,
    }

    const startResults = fetchResults({...fetchBaseData, isFast: true,});
    const restResults = fetchResults({...fetchBaseData, isFast: false,});
    updateFirstResults({startResults, value, removeOldFilters});
    updateAllResults({startResults, restResults, value, removeOldFilters});

}

export const backToResults = () => {
    store.dispatch(setPage('results'));
}


const updateFirstResults = async ({startResults, value, removeOldFilters}: {
    startResults: Promise<IService[]>,
    value: ILabel,
    removeOldFilters: boolean
}) => {
    const results = await startResults;
    store.dispatch(setResults(results));
    const newFilters = setupNewFilters({results, value});
    if (removeOldFilters) store.dispatch(resetFilters(newFilters))
    if (!removeOldFilters) store.dispatch(setFilters(newFilters));
    store.dispatch(setLoading(false));

};
const updateAllResults = async ({startResults, restResults, value, removeOldFilters}: {
    startResults: Promise<IService[]>,
    restResults: Promise<IService[]>,
    value: ILabel,
    removeOldFilters: boolean
}) => {
    const results = await Promise.all([startResults, restResults]);
    const combinedResults = results.flat();
    store.dispatch(setResults(combinedResults));
    const newFilters = setupNewFilters({results: combinedResults, value});
    if (removeOldFilters) store.dispatch(resetFilters(newFilters))
    if (!removeOldFilters) store.dispatch(setFilters(newFilters));
    store.dispatch(setLoading(false));
};
