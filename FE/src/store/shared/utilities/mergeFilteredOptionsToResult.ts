import IFilterOptions from "../../../types/filterOptions";

export const mergeFilteredOptionsToResult = (
    result: IFilterOptions,
    filterOptionsIfFilterApplied: IFilterOptions
): void => {
    Object.entries(filterOptionsIfFilterApplied).forEach(([id, data]) => {
        if (!result[id]) {
            result[id] = data;
        }
    });
};
