import {createSelector} from "@reduxjs/toolkit";
import {getAllBranchesInBounds, getFilteredBranchesInBounds} from "./locationFilters.selector";
import IFilterOptions from "../../types/filterOptions";
import {getFilters, getBackendResponseFilter, getBackendSituationFilter} from "../filter/filter.selector";
import {getAllSituationsToFilter} from "./shared.selector";
import {runOverResponsesAndGetOptionsNoResponseFilterApplied} from "./utilities/runOverResponsesAndGetOptionsNoResponseFilterApplied";
import {sortAndLimitOptions} from "./utilities/sortAndLimitOptions";
import {countAdditionalBranches} from "./utilities/countAdditionalBranches";
import {deduplicateById} from "./utilities/deduplicateById";
import {addSelectedResponseToResult} from "./utilities/addSelectedResponseToResult";
import {mergeFilteredOptionsToResult} from "./utilities/mergeFilteredOptionsToResult";
import {addMissingSelectedResponses} from "./utilities/addMissingSelectedResponses";

export const getTopResponses = createSelector([getAllBranchesInBounds, getBackendResponseFilter], (branches, backendResponseFilter) => {
    if (!branches || branches.length === 0) return [];
    const responsesArray = branches.flatMap(branch => branch.responses);
    const filteredResponses = responsesArray.filter(response => response.id !== backendResponseFilter);
    const options = runOverResponsesAndGetOptionsNoResponseFilterApplied(filteredResponses);
    return sortAndLimitOptions(options);
});

const getQuickFilterResponseOptionsIfResponseFilterApplied = createSelector(
    [getAllBranchesInBounds, getFilteredBranchesInBounds, getFilters],
    (allBranchesInBounds, filteredBranchesInBounds, filters) => {
        const filteredOptions: IFilterOptions = {};
        const filteredBranchIds = new Set(filteredBranchesInBounds.map(branch => branch.id));

        const responsesArray = allBranchesInBounds.flatMap(branch => branch.responses);
        const options = runOverResponsesAndGetOptionsNoResponseFilterApplied(responsesArray);
        const topResponsesFromSameBranches = sortAndLimitOptions(options);

        topResponsesFromSameBranches.forEach(([id, {name}]) => {
            const additionalBranchCount = countAdditionalBranches(
                allBranchesInBounds,
                filteredBranchIds,
                id,
                filters
            );

            filteredOptions[id] = {
                count: additionalBranchCount,
                name,
            };
        });

        return filteredOptions;
    }
);
const getQuickFilterList = createSelector([getQuickFilterResponseOptionsIfResponseFilterApplied], (filterList) => {
    const quickFilterList: IFilterOptions = {};
    Object.entries(filterList).forEach(([id, data]) => {
        quickFilterList[id] = {
            ...data,
            count: `${data.count}${!data.count ? '' : '+'}`
        };
    });
    return quickFilterList;
});

export const getQuickFilterResponseOptions = createSelector(
    [getFilters, getTopResponses, getQuickFilterList, getAllBranchesInBounds],
    (filters, topResponses, filterOptionsIfFilterApplied, allBranches) => {
        if (filters.responses.length > 0 || filters.situations.length > 0) {
            const result: IFilterOptions = {};

            topResponses.forEach(([id]) => {
                if (filterOptionsIfFilterApplied[id]) {
                    result[id] = filterOptionsIfFilterApplied[id];
                } else if (filters.responses.includes(id)) {
                    addSelectedResponseToResult(result, id, allBranches);
                }
            });

            mergeFilteredOptionsToResult(result, filterOptionsIfFilterApplied);

            addMissingSelectedResponses(result, filters.responses, allBranches);

            return result;
        }

        const filteredOptions: IFilterOptions = {}
        topResponses.forEach(([id, data]) => {
            filteredOptions[id] = data;
        });
        return filteredOptions;
    }
);

export const getQuickFilterSituationOptions = createSelector([getAllSituationsToFilter, getBackendSituationFilter], (situationsToFilter, backendSituationFilter) => {
    const allSelectedSituations = situationsToFilter.flatMap(([, situations]) =>
        situations.filter(situation => situation.selected)
    );
    const deduplicated = deduplicateById(allSelectedSituations);

    return deduplicated.filter(situation => situation.id !== backendSituationFilter);
});
