import {RootState} from '../store';
import {createSelector} from '@reduxjs/toolkit';
import {GeneralStore} from "./initialState";
import {pageKeys, Pages} from "../../pages/pages";
import UrlParams from "../../types/urlParams";

export const generalStore = (state: RootState) => state.general;

export const getPage = createSelector([generalStore], (generalStore: GeneralStore) => {
    if (!pageKeys.includes(generalStore.page as Pages)) return pageKeys[0];
    switch (generalStore.page as Pages) {
        case 'home':
            return 'home';
        case 'results': {
            if(!generalStore.searchQuery) return 'home';
            return 'results';
        }
        case 'card': {
            if (!generalStore.cardId) return 'home';
            return 'card';
        }
        default:
            return pageKeys[0];
    }
});

export const getModal = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.modal;
});

export const getCardId = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.cardId;
});
export const getSearchQuery = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.searchQuery;
});
export const getUrlParams = createSelector([getPage, getCardId, getSearchQuery], (page, cardId, searchQuery) => {
    const params: UrlParams = {
        p: page
    };
    if (cardId) params.c = cardId;
    if (searchQuery) params.sq = searchQuery;
    return params;
});
export const getShowSidebar = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.showSidebar;
});
export const isAccessibilityActive = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.accessibilityActive;
})
export const isLoading = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.loading;
});

export const getFirstVisitedUrl = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.firstVisitedUrl;
})

export const getIsLandingPage = createSelector([generalStore], (generalStore: GeneralStore) => {
    const firstUrl = generalStore.firstVisitedUrl;
    const currentUrl = window.location.href;
    return firstUrl === currentUrl;
})
export const getSelectedFeatureId = createSelector([generalStore], (generalStore: GeneralStore) => {
    return generalStore.selectedFeatureId;
});

