import {RootState} from '../store';
import {createSelector} from '@reduxjs/toolkit';
import {DataStore} from "./initialState";

export const dataStore = (state: RootState) => state.data;

export const getSearchOptions = createSelector([dataStore], (generalStore:DataStore) => {
    return generalStore.searchOptions;
});