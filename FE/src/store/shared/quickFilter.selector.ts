import {createSelector} from "@reduxjs/toolkit";
import {getAllBranchesInBounds, getFilteredBranchesInBounds} from "./locationFilters.selector";
import IFilterOptions from "../../types/filterOptions";
import {getFilters, getBackendResponseFilter, getBackendSituationFilter} from "../filter/filter.selector";

import {getFilterOptionsByResponsesAndSituations} from "./utilities/getFilterOptionsByResponsesAndSituations.ts";
import {sortAndLimitOptions} from "./utilities/sortAndLimitOptions";
import {countBranchChanges} from "./utilities/countBranchChanges";
import {mergeFilteredOptionsToResult} from "./utilities/mergeFilteredOptionsToResult";
import {addMissingSelectedResponses} from "./utilities/addMissingSelectedResponses";
import {addMissingSelectedSituations} from "./utilities/addMissingSelectedSituations.ts";
import stringCountOnQuickFilters from "./utilities/stringCountOnQuickFilters.ts";
import {getFilterResultsLength} from "./shared.selector.ts";

export const topFilterOptions = createSelector([getAllBranchesInBounds, getBackendResponseFilter, getBackendSituationFilter], (branches, backendResponseFilter, backendSituationFilter) => {
    if (!branches || branches.length === 0) return [];
    const filteredResponses = branches.flatMap(branch => branch.responses).filter(response => response.id !== backendResponseFilter);
    const filteredSituations = branches.flatMap(branch => branch.situations).filter(situation => situation.id !== backendSituationFilter);
    const options = getFilterOptionsByResponsesAndSituations({
        responses: filteredResponses,
        situations: filteredSituations
    });
    return sortAndLimitOptions(options);
});

const getQuickFilterResponseOptionsIfResponseFilterApplied = createSelector(
    [getAllBranchesInBounds, getFilteredBranchesInBounds, getFilters, getBackendResponseFilter, getBackendSituationFilter],
    (allBranchesInBounds, filteredBranchesInBounds, filters, backendResponseFilter, backendSituationFilter) => {
        const filteredOptions: IFilterOptions = {};
        const filteredBranchIds = new Set(filteredBranchesInBounds.map(branch => branch.id));

        const responsesArray = allBranchesInBounds.flatMap(branch => branch.responses).filter(response => response.id !== backendResponseFilter);
        const situationsArray = allBranchesInBounds.flatMap(branch => branch.situations).filter(situation => situation.id !== backendSituationFilter);

        const options = getFilterOptionsByResponsesAndSituations({
            responses: responsesArray,
            situations: situationsArray
        });

        const topResponsesAndSituationsFromSameBranches = sortAndLimitOptions(options);

        topResponsesAndSituationsFromSameBranches.forEach(([id, {name, type}]) => {
            const branchChanges = countBranchChanges(
                allBranchesInBounds,
                filteredBranchIds,
                id,
                filters,
                type
            );
            filteredOptions[id] = {
                count: branchChanges.netChange,
                name,
                type
            };
        });

        return filteredOptions;
    }
);
const getQuickFilterList = createSelector([getQuickFilterResponseOptionsIfResponseFilterApplied, getFilterResultsLength], (filterList, filteredBranchesCount) => {
    const quickFilterList: IFilterOptions = {};
    Object.entries(filterList).forEach(([id, data]) => {
        quickFilterList[id] = {
            ...data,
            count: stringCountOnQuickFilters({count:data.count, totalBranches:filteredBranchesCount}),
        };
    });
    return quickFilterList;
});

export const getQuickFilterOptions = createSelector(
    [getFilters, topFilterOptions, getQuickFilterList, getAllBranchesInBounds],
    (filters, topFilterOptions, filterOptionsIfFilterApplied, allBranches) => {
        if (filters.responses.length > 0 || filters.situations.length > 0) {
            const result: IFilterOptions = {};

            mergeFilteredOptionsToResult(result, filterOptionsIfFilterApplied);

            addMissingSelectedResponses(result, filters.responses, allBranches);
            addMissingSelectedSituations(result, filters.situations, allBranches);

            return result;
        }

        const filteredOptions: IFilterOptions = {}
        topFilterOptions.forEach(([id, data]) => {
            filteredOptions[id] = data;
        });
        return filteredOptions;
    }
);
