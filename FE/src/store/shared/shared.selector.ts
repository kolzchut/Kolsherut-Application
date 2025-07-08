import {createSelector} from "@reduxjs/toolkit";
import {getAllBranches, getResults} from "../data/data.selector";
import {IBranch, IService} from "../../types/serviceType";
import IFilterOptions from "../../types/filterOptions";
import {Response, Situation} from "../../types/cardType";
import {filterStore, getFilters} from "../filter/filter.selector";
import {
    filterServices,
    getBranches,
    getKeyForResponse,
    getKeyForSituation,
    runOverResponsesAndGetOptions,
    translateKeyToTitle
} from "./utilities";
import {FilterStore} from "../filter/initialState";
import ISituationsToFilter from "../../types/SituationsToFilter";
import IResponseToFilter from "../../types/ResponseToFilter";

export const getFilteredSituationIds = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters.situations;
});

export const getFilteredResponseIds = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters.responses;
});

export const getFilteredResults = createSelector([getResults, getFilters], (results, filters) => {
    if (!filters || (filters.situations.length == 0 && filters.responses.length == 0)) return results;
    return filterServices({filters, services: results})
});
export const getFilterResultsLength = createSelector([getFilteredResults], (services: IService[]) => {
    return services.length;
});

export const getFilteredBranches = createSelector([getFilteredResults], (services: IService[]) => getBranches(services));


export const getQuickFilterResponseOptions = createSelector([getFilteredResults], (services: IService[]) => {
    const responses = services.flatMap((service: IService) =>
        service.organizations.flatMap((organization) => organization.branches.flatMap(branch => branch.responses) || []));
    const options: IFilterOptions = runOverResponsesAndGetOptions(responses);
    return Object.entries(options)
        .sort(([, a], [, b]) => b.count - a.count) // Sort by the `count` property in descending order
        .slice(0, 10) // Take the top 10
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {} as IFilterOptions);
});

export const getMoreFiltersResponseOptions = createSelector([getAllBranches, getFilteredResponseIds], (branches: IBranch[], filteredResponseIds: string[]) => {
    const responsesByTitle = new Map<string, IResponseToFilter[]>();
    branches.flatMap((branch: IBranch) =>
        branch.responses.map((response: Response) => {
            const selected = filteredResponseIds.includes(response.id);
            const title = getKeyForResponse(response.id) || response.name;

            if (!responsesByTitle.has(title)) {
                responsesByTitle.set(title, []);
            }

            const existingResponses = responsesByTitle.get(title) || [];
            if (!existingResponses.some(existingResponse => existingResponse.id === response.id)) {
                responsesByTitle.get(title)?.push({
                    ...response,
                    selected,
                });
            }

            return {
                ...response,
                selected,
            };
        })
    );
    return Array.from(responsesByTitle.entries());
});

export const getAllSituationsToFilter = createSelector([getAllBranches, getFilteredSituationIds], (branches: IBranch[], filteredSituationIds: string[]) => {
    const situationsByTitle = new Map<string, ISituationsToFilter[]>();

    branches.flatMap((branch: IBranch) =>
        branch.situations.map((situation: Situation) => {
            const selected = filteredSituationIds.includes(situation.id);
            const titleKey = getKeyForSituation(situation.id);
            if (titleKey) {
                const title = translateKeyToTitle(titleKey)
                if (!situationsByTitle.has(title)) {
                    situationsByTitle.set(title, []);
                }
                situationsByTitle.get(title)?.push({
                    ...situation,
                    selected,
                });
            }

            return {
                ...situation,
                selected,
            };
        })
    );
    return Array.from(situationsByTitle.entries());
});

export const getQuickFilterSituationOptions = createSelector([getAllSituationsToFilter], (situationsToFilter) => {
    return situationsToFilter.flatMap(([, situations]) =>
        situations.filter(situation => situation.selected)
    );
});
