import {createSelector} from "@reduxjs/toolkit";
import UrlParams from "../../types/urlParams";
import {getCardId, getModal, getPage, getSearchQuery} from "../general/general.selector";
import {
    getBackendResponseFilter, getBackendSituationFilter,
    getLocationFilter,
    getResponsesFilter,
    getSituationsFilter
} from "../filter/filter.selector";
import {stringifyLocation} from "../../services/url/parseURL";

export const getUrlParams = createSelector([getPage, getModal, getCardId, getSearchQuery, getLocationFilter, getSituationsFilter, getResponsesFilter, getBackendResponseFilter, getBackendSituationFilter],
    (page, modal, cardId, searchQuery, locationFilter, situationFilter, responseFilter, beResponseFilter, beSituationFilter) => {
        const params: UrlParams = {
            p: page,
        };
        if (modal) params.m = modal;
        if (page === 'card' && cardId) params.c = cardId;
        if (page === 'results' && searchQuery) params.sq = searchQuery;
        if (page === 'results' && locationFilter) params.lf = stringifyLocation(locationFilter);
        if (page === 'results' && situationFilter && situationFilter.length > 0) params.sf = JSON.stringify(situationFilter);
        if (page === 'results' && responseFilter && responseFilter.length > 0) params.rf = JSON.stringify(responseFilter);
        if (page === 'results' && beResponseFilter) params.brf = beResponseFilter;
        if (page === 'results' && beSituationFilter) params.bsf = beSituationFilter;
        return params;
    });
