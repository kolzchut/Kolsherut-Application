import {RootState} from '../store';
import {createSelector} from '@reduxjs/toolkit';
import {GeneralStore} from "./initialState";

export const generalStore = (state: RootState) => state.general;

export const isConnected = createSelector([generalStore], (generalStore:GeneralStore) => {
    return generalStore.connected;
});
export const getSearchOptions = createSelector([generalStore], (generalStore:GeneralStore) => {
    return generalStore.searchOptions;
});
export const getPage = createSelector([generalStore], (generalStore:GeneralStore) => {
    return generalStore.page;
});
