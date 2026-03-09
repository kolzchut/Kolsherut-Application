import {createSelector} from "@reduxjs/toolkit";
import {getTaxonomy} from "../data/data.selector";
import {getBackendResponseFilter, getBackendSituationFilter} from "../filter/filter.selector";
import {FlatNode} from "../../types/taxonomy";

export const getFilteredResultsByFilter = createSelector([getTaxonomy, getBackendResponseFilter, getBackendSituationFilter], (fullTaxonomy, incomeResponse, incomeSituation) => {
    const taxonomyResponse: FlatNode | undefined = fullTaxonomy.responses.find((responseOption: FlatNode) => responseOption.slug === incomeResponse);
    const taxonomySituation: FlatNode | undefined = fullTaxonomy.situations.find((situationOption: FlatNode) => situationOption.slug === incomeSituation);
    const response = taxonomyResponse ? taxonomyResponse.he : "";
    const situation = taxonomySituation ? taxonomySituation.he : "";
    return {response, situation};
});
