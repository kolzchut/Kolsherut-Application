import {ILabel} from "../../types/homepageType";
import {store} from "../store";
import {
    setCardIdAndCardPage,
    setLoading,
    setPage,
    setSearchQuery,
    settingURLParamsToResults
} from "../general/generalSlice";
import {setResults} from "../data/dataSlice";
import fetchResults from "../../services/searchUtilities/fetchResults";
import {resetFilters, setBackendFilters, setFilters} from "../filter/filterSlice";
import {IService} from "../../types/serviceType";


const updateFirstResults = async ({startResults}: {
    startResults: Promise<IService[]>
}) => {
    const results = await startResults;
    store.dispatch(setResults(results));
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

const settingFilters = ({removeOldFilters, value}: {removeOldFilters:boolean,value:ILabel})=>{
    store.dispatch(setBackendFilters({response: value.response_id, situation: value.situation_id, by: value.by}));
    store.dispatch(setPage('results'))
    const filters: {location?: {key: string, bounds: [number,number,number,number]}} = {}
    if(value.cityName && value.bounds) filters.location = {key: value.cityName, bounds: value.bounds};
    if (removeOldFilters) return store.dispatch(resetFilters(filters));
    store.dispatch(setFilters(filters));
}


export const changingPageToResults =  ({value, removeOldFilters, refreshPage}: { value: ILabel, removeOldFilters: boolean,refreshPage?: ()=>void }) => {
    settingFilters({removeOldFilters, value});
    store.dispatch(settingURLParamsToResults(value.query))
    if(refreshPage) refreshPage();
}


export const settingToResults = async ({value}: { value: ILabel}) => {
    store.dispatch(setLoading(true));
    store.dispatch(settingURLParamsToResults(value.query))

    const fetchBaseData = {
        responseId: value.response_id,
        situationId: value.situation_id,
        searchQuery: value.query,
        by: value.by,
    }
    const startResults = fetchResults({...fetchBaseData, isFast: true,});
    const restResults = fetchResults({...fetchBaseData, isFast: false,});
    updateFirstResults({startResults});
    updateAllResults({startResults, restResults})
}

export const settingToCardAndFittingSearchQuery = (searchQuery: string, cardId: string) => {
    store.dispatch(setSearchQuery(searchQuery));
    store.dispatch(setResults([]))
    store.dispatch(setCardIdAndCardPage(cardId));
}
