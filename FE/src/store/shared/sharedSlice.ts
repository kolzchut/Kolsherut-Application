import {ILabel} from "../../types/homepageType";
import {store} from "../store";
import {setLoading, settingURLParamsToResults} from "../general/generalSlice";
import {setResults} from "../data/dataSlice";
import fetchResults from "../../services/searchUtilities/fetchResults";
import {resetFilters, setFilters} from "../filter/filterSlice";
import {IService} from "../../types/serviceType";
import setupNewFilters from "./utilities/setupNewFilters";
import {setLockUpdateURL} from "../../services/url/route";


const updateFirstResults = async ({startResults}: {
    startResults: Promise<IService[]>
}) => {
    const results = await startResults;
    store.dispatch(setResults(results));
    store.dispatch(setLoading(false));

};
const updateAllResults = async ({startResults, restResults}: {
    startResults: Promise<IService[]>,
    restResults: Promise<IService[]>
}) => {
    const results = await Promise.all([startResults, restResults]);
    const combinedResults = results.flat();
    store.dispatch(setResults(combinedResults));
    store.dispatch(setLoading(false));
    return combinedResults;
};

const settingFilters = ({removeOldFilters, value, restResults}: {removeOldFilters:boolean,value:ILabel, restResults:IService[]})=>{
    const newFilters = setupNewFilters({value: value, results: restResults});
    if (removeOldFilters) return store.dispatch(resetFilters(newFilters));
    store.dispatch(setFilters(newFilters));
}

export const settingToResults = async ({value, removeOldFilters}: { value: ILabel, removeOldFilters: boolean }) => {
    setLockUpdateURL(true);
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
    updateFirstResults({startResults});
    updateAllResults({startResults, restResults}).then((restResults: IService[]) => {
        settingFilters({removeOldFilters, value, restResults});
        setLockUpdateURL(false);
    });

}
