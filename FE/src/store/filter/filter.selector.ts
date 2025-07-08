import {RootState} from '../store';
import {createSelector} from '@reduxjs/toolkit';
import {FilterStore} from "./initialState";

export const filterStore = (state: RootState) => state.filter;

export const getFilters = createSelector([filterStore], (filterStore: FilterStore) => {
    return filterStore.filters;
});
