import {RootState} from '../store';
import {createSelector} from '@reduxjs/toolkit';
import {GeneralStore} from "./initialState";
import {pageKeys, Pages} from "../../pages/pages";
import UrlParams from "../../types/urlParams";

export const generalStore = (state: RootState) => state.general;

export const getPage = createSelector([generalStore], (generalStore: GeneralStore) => {
    if (!pageKeys.includes(generalStore.page as Pages)) return pageKeys[0];
    return generalStore.page;
});
export const getCardId = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.cardId;
})

export const getSearchOptions = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.searchOptions;
});

export const getUrlParams = createSelector([getPage, getCardId], (page, cardId) => {
    const params: UrlParams= {
        p: page
    };
    if (cardId) params.c = cardId;
    return params;
});
