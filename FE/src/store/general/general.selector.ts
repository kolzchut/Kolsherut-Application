import {RootState} from '../store';
import {createSelector} from '@reduxjs/toolkit';
import {GeneralStore} from "./initialState";
import {pageKeys, Pages} from "../../pages/pages";

export const generalStore = (state: RootState) => state.general;

export const getPage = createSelector([generalStore], (generalStore:GeneralStore) => {
    if(!pageKeys.includes(generalStore.page as Pages))  return pageKeys[0];
    return generalStore.page;
});

export const getUrlParams = createSelector([getPage], (page) => ({
    p:page,

}));
