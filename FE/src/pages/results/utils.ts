import {BeFilters} from "../../store/filter/initialState";
import {ILabel} from "../../types/homepageType";
import {removeAllPOIs} from "../../services/map/poiInteraction";
import {addResultsPOIs, setMapOnLocation} from "./resultsLogic";
import {allowChangeStoreLocation} from "../../services/map/events/mapInteraction";
import {IBranch} from "../../types/serviceType";

interface IConvertFilterToBeFormat {
    searchQuery: string;
    backendFilters: BeFilters;
}

interface IUpdatePois {
    location: {
        key: string;
        bounds:  [number, number, number, number];
    };
    branchesForMapWithoutLocationFilter:  IBranch[];
}

export const convertFilterToBeFormat = ({searchQuery, backendFilters}: IConvertFilterToBeFormat) =>{
    const value: ILabel = {query: searchQuery};
    if (backendFilters.situation) value.situation_id = backendFilters.situation;
    if (backendFilters.response) value.response_id = backendFilters.response;
    if (backendFilters.by) value.by = backendFilters.by;
    return {value};
}

export const updatePois = ({location, branchesForMapWithoutLocationFilter}: IUpdatePois) => {
    removeAllPOIs();
    addResultsPOIs(branchesForMapWithoutLocationFilter);
    allowChangeStoreLocation(false);
    if (location.key !== window.strings.map.locationByBoundingBox)
        setMapOnLocation(location.bounds);
    allowChangeStoreLocation(true)
}
