import {createSelector} from "@reduxjs/toolkit";
import {getAllBranches, getResults} from "../data/data.selector";
import {IBranch, IService} from "../../types/serviceType";
import {Response, Situation} from "../../types/cardType";
import {filterStore, getFilters} from "../filter/filter.selector";
import {FilterStore} from "../filter/initialState";
import ISituationsToFilter from "../../types/SituationsToFilter";
import IResponseToFilter from "../../types/ResponseToFilter";
import {filterServices} from "./utilities/filterServices.ts";
import {getBranches} from "./utilities/getBranches.ts";
import {getKeyForResponse} from "./utilities/getKeyForResponse.ts";
import {getKeyForSituation} from "./utilities/getKeyForSituation.ts";
import {translateKeyToTitle} from "./utilities/translateKeyToTitle.ts";

export const getFilteredSituationIds = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters.situations;
});

export const getFilteredResponseIds = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters.responses;
});

export const getFilteredResponseLength = createSelector([getFilteredResponseIds], (filterResponse: string[]) => {
    return filterResponse.length;
});


export const getFilteredResults = createSelector([getResults, getFilters], (results, filters) => {
    if (!filters || (filters.situations.length == 0 && filters.responses.length == 0 && !filters.location)) return results;
    return filterServices({filters, services: results})
});
export const getFilteredBranches = createSelector([getFilteredResults], (services: IService[]) => getBranches(services));

export const getFilterResultsLength = createSelector([getFilteredBranches], (branches: IBranch[]) => {
    return branches.length;
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
