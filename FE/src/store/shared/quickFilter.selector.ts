import {createSelector} from "@reduxjs/toolkit";
import {getAllBranchesInBounds, getFilteredBranchesInBounds} from "./locationFilters.selector";
import IFilterOptions from "../../types/filterOptions";
import {getFilters} from "../filter/filter.selector";
import {getAllSituationsToFilter} from "./shared.selector";
import {runOverResponsesAndGetOptionsNoResponseFilterApplied} from "./utilities/runOverResponsesAndGetOptionsNoResponseFilterApplied";
import {sortAndLimitOptions} from "./utilities/sortAndLimitOptions";
import {countAdditionalBranches} from "./utilities/countAdditionalBranches";
import {deduplicateById} from "./utilities/deduplicateById";

export const getTopResponses = createSelector([getAllBranchesInBounds], (branches) => {
    if (!branches || branches.length === 0) return [];
    const responsesArray = branches.flatMap(branch => branch.responses);
    const options = runOverResponsesAndGetOptionsNoResponseFilterApplied(responsesArray);
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
            const selectedResponsesOptions: IFilterOptions = {};

            // Add selected responses to quick filters
            filters.responses.forEach(selectedResponseId => {
                const responsesArray = allBranches.flatMap(branch => branch.responses);
                const selectedResponse = responsesArray.find(response => response.id === selectedResponseId);

                if (selectedResponse) {
                    selectedResponsesOptions[selectedResponseId] = {
                        count: 0,
                        name: selectedResponse.name,
                    };
                }
            });


            return {
                ...selectedResponsesOptions,
                ...filterOptionsIfFilterApplied
            };
        }

        const filteredOptions: IFilterOptions = {}
        topResponses.forEach(([id, data]) => {
            filteredOptions[id] = data;
        });
        return filteredOptions;
    }
);

export const getQuickFilterSituationOptions = createSelector([getAllSituationsToFilter], (situationsToFilter) => {
    const allSelectedSituations = situationsToFilter.flatMap(([, situations]) =>
        situations.filter(situation => situation.selected)
    );
    return deduplicateById(allSelectedSituations);
});
