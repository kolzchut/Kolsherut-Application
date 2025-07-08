import SingleFilter from "./singleFilter/singleFilter";
import {addSituationFilter, removeSituationFilter} from "../../../../../store/filter/filterSlice";
import {store} from "../../../../../store/store";

interface FilterProps {
    id: string;
    value: { count?: number, name: string };
    situationFilters: string[];
}

const SituationQuickFilter= ({id, value, situationFilters}:FilterProps) => {
    const isFilterActive = situationFilters.some(filter => filter === id)

    const handleClick = () => {
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
