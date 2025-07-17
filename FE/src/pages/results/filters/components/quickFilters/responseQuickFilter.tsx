import SingleFilter from "./singleFilter/singleFilter";
import {addResponseFilter, removeResponseFilter} from "../../../../../store/filter/filterSlice";
import {store} from "../../../../../store/store";

interface FilterProps {
    id: string;
    value: { count: number | string, name: string };
    responseFilters: string[];
}

const ResponseQuickFilter= ({id, value, responseFilters}:FilterProps) => {
    const isFilterActive = responseFilters.some(filter => filter === id)

    const handleClick = () => {
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
