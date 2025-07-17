import {createSelector} from "@reduxjs/toolkit";
import {getFilters, getSearchLocation} from "../filter/filter.selector.ts";
import {getFilteredBranches} from "./shared.selector.ts";
import {getLocations, getResults} from "../data/data.selector.ts";
import ILocation from "../../types/locationType.ts";
import {IBranch, IService} from "../../types/serviceType.ts";
import {checkIfCoordinatesInBounds} from "../../services/geoLogic.ts";

export const getFilteredBranchesInBounds = createSelector([getFilteredBranches, getFilters], (branches: IBranch[], filters) => {
    return branches.filter(branch => checkIfCoordinatesInBounds({
        bounds: filters.location.bounds,
        coordinates: branch.geometry
    }));
});

export const getFilteredResponsesInBounds = createSelector([getFilteredBranchesInBounds], (branches: IBranch[]) => {
    return branches.flatMap(branch => branch.responses) || [];
});

export const getAllBranchesInBounds = createSelector([getResults, getFilters], (services: IService[], filters) => {
    return services.flatMap((service: IService) =>
        service.organizations.flatMap((organization) => organization.branches.filter(branch => checkIfCoordinatesInBounds({
            bounds: filters.location.bounds,
            coordinates: branch.geometry
        }))));
});

export const getAllResponsesInBounds = createSelector([getAllBranchesInBounds], (branches: IBranch[]) => {
    return branches.flatMap(branch => branch.responses) || [];
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
