import SingleFilter from "./singleFilter/singleFilter";
import {addSituationFilter, removeSituationFilter} from "../../../../../store/filter/filterSlice";
import {store} from "../../../../../store/store";
import resultsAnalytics from "../../../../../services/gtag/resultsEvents";
import addFilterTagToUrl from "./addFilterTagToUrl.ts";

interface FilterProps {
    id: string;
    value: { count: number | string, name: string };
    situationFilters: string[];
}

const SituationQuickFilter= ({id, value, situationFilters}:FilterProps) => {
    const isFilterActive = situationFilters.some(filter => filter === id)

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        resultsAnalytics.quickFilterActivatedEvent();
        if (isFilterActive) return store.dispatch(removeSituationFilter(id));
        return store.dispatch(addSituationFilter(id));
    };
    const href = addFilterTagToUrl({url:window.location.href, newValue:value?.name, isResponse:false })

    return (
        <SingleFilter
            onClick={handleClick}
            isFilterActive={isFilterActive}
            value={value}
            href={href}
            key={id}
        />
    );
};

export default SituationQuickFilter;
