import {createSelector} from "@reduxjs/toolkit";
import {getAllBranches, getLocations, getResults} from "../data/data.selector";
import {IBranch, IService} from "../../types/serviceType";
import IFilterOptions from "../../types/filterOptions";
import {Response, Situation} from "../../types/cardType";
import {filterStore, getFilters, getSearchLocation} from "../filter/filter.selector";
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
import {checkIfCoordinatesInBounds} from "../../services/geoLogic";
import ILocation from "../../types/locationType";

export const getFilteredSituationIds = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters.situations;
});

export const getFilteredResponseIds = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters.responses;
});
export const getFiltersLength = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters.responses.length + filterStore.filters.situations.length;
});

export const getFilteredResponseLength = createSelector([getFilteredResponseIds], (filterResponse:string[]) => {
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

export const getTopResponses = createSelector([getResults], (services: IService[]) => {
    if (!services || services.length === 0) return [];
    const responsesArray = services.flatMap((service: IService) =>
        service.organizations.flatMap((organization) =>
            organization.branches.flatMap(branch => branch.responses) || []));
    const options = runOverResponsesAndGetOptions(responsesArray);
    return Object.entries(options)
        .sort(([, a], [, b]) => b.count - a.count) // Sort by count in descending order
        .slice(0, 7) // Take the top 7
});

export const getQuickFilterResponseOptions = createSelector([getFilteredResults, getFilters, getTopResponses], (services: IService[], filters, topResponses) => {
    const responses = services.flatMap((service: IService) =>
        service.organizations.flatMap((organization) => organization.branches.filter(branch => checkIfCoordinatesInBounds({
            bounds: filters.location.bounds,
            coordinates: branch.geometry
        })).flatMap(branch => branch.responses) || []));
    const options: IFilterOptions = runOverResponsesAndGetOptions(responses);
    const filteredOptions: IFilterOptions = {}
    topResponses.forEach((response) => {
        if (options[response[0]]) {
            filteredOptions[response[0]] = options[response[0]];
            return;
        }
        console.log(response)
        filteredOptions[response[0]] = {count:0, name:response[1].name};

    });
    return filteredOptions;
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

export const getOptionalLocations = createSelector([getSearchLocation, getLocations], (searchLocation: string, locations: ILocation[]) => {
    const fixedSearchLocation = searchLocation.trim().replace(' ', "_");
    if (!locations || locations.length === 0) return [];
    if (fixedSearchLocation != '') return locations
        .filter(location => location.key
            .includes(fixedSearchLocation))
        .map(location => {
            return {
                ...location,
                key: location.key.replace(/_/g, ' ').trim()
            };
        }).slice(0, 5);
    return [];
});
