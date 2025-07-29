import SingleFilter from "./singleFilter/singleFilter";
import {addSituationFilter, removeSituationFilter} from "../../../../../store/filter/filterSlice";
import {store} from "../../../../../store/store";
import resultsAnalytics from "../../../../../services/gtag/resultsEvents.ts";

interface FilterProps {
    id: string;
    value: { count?: number, name: string };
    situationFilters: string[];
}

const SituationQuickFilter= ({id, value, situationFilters}:FilterProps) => {
    const isFilterActive = situationFilters.some(filter => filter === id)

    const handleClick = () => {
        resultsAnalytics.quickFilterActivatedEvent();
        if (isFilterActive) return store.dispatch(removeSituationFilter(id));
        return store.dispatch(addSituationFilter(id));
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

export default SituationQuickFilter;
