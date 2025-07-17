import {createSelector} from "@reduxjs/toolkit";
import {getResults} from "../data/data.selector.ts";
import {IService} from "../../types/serviceType.ts";
import {getAllResponsesInBounds, getFilteredResponsesInBounds} from "./locationFilters.selector.ts";
import {Response} from "../../types/cardType.ts";
import IFilterOptions from "../../types/filterOptions.ts";
import {getFilters} from "../filter/filter.selector.ts";
import {getAllSituationsToFilter} from "./shared.selector.ts";
import {checkIfFirstIdContainsSecondsIds} from "./utilities/checkIfFirstIdContainsSecondsIds.ts";
import {
    runOverResponsesAndGetOptionsNoResponseFilterApplied
} from "./utilities/runOverResponsesAndGetOptionsNoResponseFilterApplied.ts";

export const getTopResponses = createSelector([getResults], (services: IService[]) => {
    if (!services || services.length === 0) return [];
    const responsesArray = services.flatMap((service: IService) =>
        service.organizations.flatMap((organization) =>
            organization.branches.flatMap(branch => branch.responses) || []));
    const options = runOverResponsesAndGetOptionsNoResponseFilterApplied(responsesArray);
    return Object.entries(options)
        .sort(([, a], [, b]) => Number(b.count) - Number(a.count)) // Sort by count in descending order
        .slice(0, 7) // Take the top 7
});


export const getQuickFilterResponseOptionsIfResponseFilterApplied = createSelector(
    [getAllResponsesInBounds, getFilteredResponsesInBounds, getTopResponses],
    (allResponsesInBounds: Response[], getFilteredResponsesInBounds: Response[], topResponses) => {
        const filteredOptions: IFilterOptions = {};
        topResponses.forEach(([id, {name}]) => {
            const countInAll = allResponsesInBounds.filter(response => checkIfFirstIdContainsSecondsIds({firstIds:response.id, secondIds:id})).length;
            const countInFiltered = getFilteredResponsesInBounds.filter(response => checkIfFirstIdContainsSecondsIds({firstIds:response.id, secondIds:id})).length;
            const count = countInAll - countInFiltered > 0 ? (countInAll - countInFiltered)+ "+": "0";
            filteredOptions[id] = {
                count,
                name,
            };
        });
        return filteredOptions;
    }
);
export const getQuickFilterResponseOptions = createSelector([getFilters, getTopResponses, getAllResponsesInBounds, getQuickFilterResponseOptionsIfResponseFilterApplied], (filters, topResponses, responsesInBound, filterOptionsIfFilterApplied) => {

    if (filters.responses.length > 0) return filterOptionsIfFilterApplied;
    const options: IFilterOptions = runOverResponsesAndGetOptionsNoResponseFilterApplied(responsesInBound);
    const filteredOptions: IFilterOptions = {}
    topResponses.forEach((response) => {
        if (options[response[0]]) {
            filteredOptions[response[0]] = options[response[0]];
            return;
        }
        filteredOptions[response[0]] = {count: 0, name: response[1].name};
    });
    return filteredOptions;
});

export const getQuickFilterSituationOptions = createSelector([getAllSituationsToFilter], (situationsToFilter) => {
    return situationsToFilter.flatMap(([, situations]) =>
        situations.filter(situation => situation.selected)
    );
});

