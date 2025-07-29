import SingleFilter from "./singleFilter/singleFilter";
import {addResponseFilter, removeResponseFilter} from "../../../../../store/filter/filterSlice";
import {store} from "../../../../../store/store";
import resultsAnalytics from "../../../../../services/gtag/resultsEvents.ts";

interface FilterProps {
    id: string;
    value: { count: number | string, name: string };
    responseFilters: string[];
}

const ResponseQuickFilter= ({id, value, responseFilters}:FilterProps) => {
    const isFilterActive = responseFilters.some(filter => filter === id)

    const handleClick = () => {
        resultsAnalytics.quickFilterActivatedEvent();
        if (isFilterActive) return store.dispatch(removeResponseFilter(id));
        return store.dispatch(addResponseFilter(id));
    };


    return (
        <SingleFilter
            onClick={handleClick}
            isFilterActive={isFilterActive}
            value={value}
            key={id}
        />
    );
};

export default ResponseQuickFilter;
