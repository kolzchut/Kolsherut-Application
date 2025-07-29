import { setCardIdAndCardPage, setSearchQueryAndResultsPage } from "../../store/general/generalSlice";
import {store} from "../../store/store";
import ILocation from "../../types/locationType";
import {setFilters} from "../../store/filter/filterSlice.ts";
import israelLocation from "../../constants/israelLocation.ts";


export const reRouteToCard = ({cardId}: { cardId: string }) => {
    store.dispatch(setCardIdAndCardPage(cardId));
}

export const reRouteToResults = ({searchQuery, locationFilter = israelLocation, situationFilter = [], responseFilter = []}: {
    searchQuery?: string,
    locationFilter?: ILocation,
    situationFilter?: string[],
    responseFilter?: string[]
}) => {
    const filters = {
        responses: responseFilter,
        situations: situationFilter,
        location: locationFilter
    }
    store.dispatch(setFilters(filters));
    store.dispatch(setSearchQueryAndResultsPage(searchQuery || ''));
}
