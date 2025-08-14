import {createSelector} from "@reduxjs/toolkit";
import {getFilters, getLocationFilter, getSearchLocation} from "../filter/filter.selector";
import {getFilteredBranches} from "./shared.selector";
import {getLocations, getResults} from "../data/data.selector";
import ILocation from "../../types/locationType";
import {IBranch, IService} from "../../types/serviceType";
import isBranchInBounds from "./utilities/isBranchInBounds.ts";

export const getFilteredBranchesInBounds = createSelector([getFilteredBranches, getFilters], (branches: IBranch[], filters) => {
    return branches.filter(branch => isBranchInBounds(branch, filters.location.bounds));
});


export const getAllBranchesInBounds = createSelector([getResults, getFilters, getLocationFilter], (services: IService[], filters) => {
    return services.flatMap((service: IService) =>
        service.organizations.flatMap((organization) => organization.branches.filter(branch => isBranchInBounds(branch, filters.location.bounds))));
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
