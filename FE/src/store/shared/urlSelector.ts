import {createSelector} from "@reduxjs/toolkit";
import UrlParams from "../../types/urlParams";
import {getCardId, getPage, getSearchQuery} from "../general/general.selector";
import {getLocationFilter, getResponsesFilter, getSituationsFilter} from "../filter/filter.selector";
import {stringifyLocation} from "../../services/url/parseURL";

export const getUrlParams = createSelector([getPage, getCardId, getSearchQuery, getLocationFilter, getSituationsFilter, getResponsesFilter],
    (page, cardId, searchQuery, locationFilter, situationFilter, responseFilter) => {
    const params: UrlParams= {
        p: page
    };
    if(page === 'card' && cardId) params.c = cardId;
    if(page === 'results' && searchQuery) params.sq = searchQuery;
    if(page === 'results' && locationFilter) params.lf = stringifyLocation(locationFilter);
    if(page === 'results' && situationFilter) params.sf = JSON.stringify(situationFilter);
    if(page === 'results' && responseFilter) params.rf = JSON.stringify(responseFilter);
    return params;
});
