import {createSelector} from "@reduxjs/toolkit";
import UrlParams from "../../types/urlParams";
import {getCardId, getModal, getOldURL, getPage, getSearchQuery} from "../general/general.selector";
import {
    getBackendByFilter,
    getBackendResponseFilter, getBackendSituationFilter,
    getLocationFilter,
    getResponsesFilter,
    getSituationsFilter
} from "../filter/filter.selector";
import {stringifyLocation} from "../../services/url/parseURL";

export const getUrlParams = createSelector([getPage, getModal, getCardId, getSearchQuery, getLocationFilter, getSituationsFilter, getResponsesFilter, getBackendResponseFilter, getBackendSituationFilter, getBackendByFilter, getOldURL],
    (page, modal, cardId, searchQuery, locationFilter, situationFilter, responseFilter, beResponseFilter, beSituationFilter, beByFilter,oldURL) => {
        const params: UrlParams = {};
        if (page != 'home') params.p = page;
        if (modal) params.m = modal;
        if (page === 'card' && cardId) params.c = cardId;
        if (page === 'results' && searchQuery) params.sq = searchQuery;
        if (page === 'results' && locationFilter) params.lf = stringifyLocation(locationFilter);
        if (page === 'results' && situationFilter && situationFilter.length > 0) params.sf = JSON.stringify(situationFilter);
        if (page === 'results' && responseFilter && responseFilter.length > 0) params.rf = JSON.stringify(responseFilter);
        if (page === 'results' && beResponseFilter) params.brf = beResponseFilter;
        if (page === 'results' && beSituationFilter) params.bsf = beSituationFilter;
        if (page === 'results' && beByFilter) params.by = beByFilter;
        if(page === 'results' && oldURL) params.old = 'true';

        return params;
    });
