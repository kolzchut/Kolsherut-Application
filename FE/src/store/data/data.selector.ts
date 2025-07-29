import {RootState} from '../store';
import {createSelector} from '@reduxjs/toolkit';
import {DataStore} from "./initialState";
import {IService} from "../../types/serviceType";
import {getBranches} from "../shared/utilities/getBranches";

export const dataStore = (state: RootState) => state.data;

export const getSearchOptions = createSelector([dataStore], (dataStore: DataStore) => {
    return dataStore.searchOptions;
});
export const getResults = createSelector([dataStore], (dataStore: DataStore) => {
    return dataStore.results;
});
export const getAllBranches = createSelector([getResults], (services: IService[]) => getBranches(services));

export const getSelectedOrganization = createSelector([dataStore], (dataStore: DataStore) => {
    return dataStore.selectedOrganization;
});
export const getSelectedOrganizationId = createSelector([dataStore], (dataStore: DataStore) => {
    return dataStore.selectedOrganization ? dataStore.selectedOrganization.id : null;
});
export const getLocations = createSelector([dataStore], (dataStore: DataStore) => {
    return dataStore.locations;
});
