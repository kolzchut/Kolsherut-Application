import {RootState} from '../store';
import {createSelector} from '@reduxjs/toolkit';
import {FilterStore} from "./initialState";

export const filterStore = (state: RootState) => state.filter;

export const getFilters = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters;
});

export const getResponsesFilter = createSelector(getFilters], (filters) => filters.responses);
export const getSituationsFilter = createSelector(getFilters], (filters) => filters.situations);
export const getLocationFilter = createSelector(getFilters], (filters) => filters.location);
export const getSearchLocation = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.searchLocation;
});
