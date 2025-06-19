import {RootState} from '../store';
import {createSelector} from '@reduxjs/toolkit';
import {GeneralStore} from "./initialState";
import {pageKeys} from "../../pages/pages.ts";

export const generalStore = (state: RootState) => state.general;

export const getPage = createSelector([generalStore], (generalStore:GeneralStore) => {
    if(!pageKeys.includes(generalStore.page))  return pageKeys[0];
    return generalStore.page;
});

export const getUrlParams = createSelector([getPage], (page) => ({
    p:page,

}));
