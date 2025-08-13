import {createSelector} from "@reduxjs/toolkit";
import {getBackendResponseFilter, getBackendSituationFilter} from "../../filter/filter.selector.ts";
import {getAllBranches} from "../../data/data.selector.ts";

export const getBackendFiltersNamesByResults = createSelector([getBackendResponseFilter, getBackendSituationFilter, getAllBranches], (responseId, situationId, branches) => {
    const names = {
        response: "",
        situation: ""
    }
    for (let i = 0; i < branches.length; i++) {
        if (!names.response) {
            const response = branches[i].responses.find(response => response.id === responseId);
            if (response) names.response = response.name;
        }
        if (!names.situation) {
            const situation = branches[i].situations.find(situation => situation.id === situationId);
            if (situation) names.situation = situation.name;
        }
        if (names.response && names.situation) return names;
    }
    return names;
});
