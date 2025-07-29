import {createSelector} from "@reduxjs/toolkit";
import {getFilters, getLocationFilter, getSearchLocation} from "../filter/filter.selector";
import {getFilteredBranches} from "./shared.selector";
import {getLocations, getResults} from "../data/data.selector";
import ILocation from "../../types/locationType";
import {IBranch, IService} from "../../types/serviceType";
import {checkIfCoordinatesInBounds} from "../../services/geoLogic";
import israelLocation from "../../constants/israelLocation";

export const getFilteredBranchesInBounds = createSelector([getFilteredBranches, getFilters, getLocationFilter], (branches: IBranch[], filters, location) => {
    const isDefaultLocation = location.key === israelLocation.key;

    return branches.filter(branch =>
        (isDefaultLocation && branch.isNational) || checkIfCoordinatesInBounds({
            bounds: filters.location.bounds,
            coordinates: branch.geometry
        })
    );
});

export const getFilteredResponsesInBounds = createSelector([getFilteredBranchesInBounds], (branches: IBranch[]) => {
    return branches.flatMap(branch => branch.responses) || [];
});

export const getAllBranchesInBounds = createSelector([getResults, getFilters,getLocationFilter], (services: IService[], filters,location) => {
    const isDefaultLocation = location.key === israelLocation.key;

    return services.flatMap((service: IService) =>
        service.organizations.flatMap((organization) => organization.branches.filter(branch =>(isDefaultLocation && branch.isNational) || checkIfCoordinatesInBounds({
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
