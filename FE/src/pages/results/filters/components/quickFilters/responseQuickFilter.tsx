import SingleFilter from "./singleFilter/singleFilter";
import {addResponseFilter, removeResponseFilter} from "../../../../../store/filter/filterSlice";
import {store} from "../../../../../store/store";
import resultsAnalytics from "../../../../../services/gtag/resultsEvents";
import updateFilterTagToUrl from "./updateFilterTagToUrl.ts";

interface FilterProps {
    id: string;
    value: { count: number | string, name: string };
    responseFilters: string[];
}

const ResponseQuickFilter= ({id, value, responseFilters}:FilterProps) => {
    const isFilterActive = responseFilters.some(filter => filter === id)
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        resultsAnalytics.quickFilterActivatedEvent();
        if (isFilterActive) return store.dispatch(removeResponseFilter(id));
        return store.dispatch(addResponseFilter(id));
    };
    const href = updateFilterTagToUrl({url:window.location.href, value:id, isResponse:true, isFilterActive})

    return <SingleFilter href={href} value={value} onClick={handleClick} isFilterActive={isFilterActive}/>
}

export default ResponseQuickFilter;
