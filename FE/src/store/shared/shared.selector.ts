import {createSelector} from "@reduxjs/toolkit";
import {getAllBranches, getResults} from "../data/data.selector";
import {IBranch, IService} from "../../types/serviceType";
import {filterStore, getFilters} from "../filter/filter.selector";
import {FilterStore} from "../filter/initialState";
import ISituationsToFilter from "../../types/SituationsToFilter";
import IResponseToFilter from "../../types/ResponseToFilter";
import {filterServices} from "./utilities/filterServices";
import {getBranches} from "./utilities/getBranches";
import {getKeyForResponse} from "./utilities/getKeyForResponse";
import {getKeyForSituation} from "./utilities/getKeyForSituation";
import {translateKeyToTitle} from "./utilities/translateKeyToTitle";
import israelLocation from "../../constants/israelLocation";

export const getFilteredSituationIds = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters.situations;
});

export const getFilteredResponseIds = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters.responses;
});

export const getFilteredResponseLength = createSelector([getFilteredResponseIds], (filterResponse: string[]) => {
    return filterResponse.length;
});

export const getFilteredResultsByFilter = createSelector([getResults, getFilters], (results, filters) => {
    if (!filters || (!filters.situations.length && !filters.responses.length)) return results;
    return filterServices({filters, services: results,byResponseAndSituation:true})
});
export const getFilteredBranchesByResponseAndFilter = createSelector([getFilteredResultsByFilter], (services: IService[]) => {
    return getBranches(services);
});


export const getFilteredResults = createSelector([getFilteredResultsByFilter, getFilters], (results, filters) => {
    if (!filters || (!filters.location || filters.location.key === israelLocation.key)) return results;
    return filterServices({filters, services: results, byLocation:true})
});

export const getFilteredBranches = createSelector([getFilteredResults], (services: IService[]) => getBranches(services));

export const getFilterResultsLength = createSelector([getFilteredBranches], (branches: IBranch[]) => {
    return branches.length;
});

export const getMoreFiltersResponseOptions = createSelector([getAllBranches, getFilteredResponseIds], (branches: IBranch[], filteredResponseIds: string[]) => {
    const responsesByTitle = new Map<string, IResponseToFilter[]>();
    const filteredResponsesSet = new Set(filteredResponseIds);
    const processedResponseIds = new Set<string>(); 

    for (const branch of branches) {
        for (const response of branch.responses) {
            if (processedResponseIds.has(response.id)) continue;
            processedResponseIds.add(response.id);
            const selected = filteredResponsesSet.has(response.id);
            const title = getKeyForResponse(response.id) || response.name;
            if (!responsesByTitle.has(title)) {
                responsesByTitle.set(title, []);
            }
            responsesByTitle.get(title)!.push({
                ...response,
                selected,
            });
        }
    }
    return Array.from(responsesByTitle.entries());
});

export const getAllSituationsToFilter = createSelector([getAllBranches, getFilteredSituationIds], (branches: IBranch[], filteredSituationIds: string[]) => {
    const situationsByTitle = new Map<string, ISituationsToFilter[]>();
    const filteredSituationsSet = new Set(filteredSituationIds);
    const processedSituationIds = new Set<string>();
   
    for (const branch of branches) {
        for (const situation of branch.situations) {
            if (processedSituationIds.has(situation.id)) continue;
            processedSituationIds.add(situation.id);
            const selected = filteredSituationsSet.has(situation.id);
            const titleKey = getKeyForSituation(situation.id);
            if (titleKey) {
                const title = translateKeyToTitle(titleKey);
                if (!situationsByTitle.has(title)) {
                    situationsByTitle.set(title, []);
                }
                situationsByTitle.get(title)!.push({
                    ...situation,
                    selected,
                });
            }
        }
    }
    return Array.from(situationsByTitle.entries());
});
