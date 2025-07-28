import IFilterOptions from "../../../types/filterOptions.ts";

export const sortAndLimitOptions = (options: IFilterOptions, limit: number = 7) => {
    return Object.entries(options)
        .sort(([, a], [, b]) => Number(b.count) - Number(a.count))
        .slice(0, limit);
};
