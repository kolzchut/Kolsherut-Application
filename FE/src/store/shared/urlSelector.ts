import {createSelector} from "@reduxjs/toolkit";
import UrlParams from "../../types/urlParams.ts";
import {getCardId, getPage, getSearchQuery} from "../general/general.selector.ts";

export const getUrlParams = createSelector([getPage, getCardId, getSearchQuery, getLocationFilter, getSituationsFilter, getResponsesFilter],
    (page, cardId, searchQuery, locationFilter, situationFilter, responseFilter) => {
    const params: UrlParams= {
        p: page
    };
    if(page === 'card' && cardId) params.c = cardId;
    if(page === 'results' && searchQuery) params.sq = searchQuery;
    if(page === 'results' && locationFilter) params.lf = locationFilter;
    if(page === 'results' && situationFilter) params.sf = situationFilter;
    if(page === 'results' && responseFilter) params.rf = responseFilter;
    return params;
});
