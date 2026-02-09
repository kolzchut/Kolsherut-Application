import {createSlice} from '@reduxjs/toolkit';
import {FilterStore, initialState} from './initialState';
import {parseLocation} from "../../services/url/parseURL";
import israelLocation from "../../constants/israelLocation";

export const filterSlice = createSlice({
    name: 'filter',
    initialState,
    reducers: {
        setFilterRouteParams(state: FilterStore, action) {
            const newLocation = !action.payload.lf ? null : parseLocation(action.payload.lf);
            const newSituations = action.payload.sf ? JSON.parse(action.payload.sf) : null;
            const newResponses = action.payload.rf ? JSON.parse(action.payload.rf) : null;
            state.backendFilters.response = action.payload.brf || null;
            state.backendFilters.situation = action.payload.bsf || null;
            state.backendFilters.by = action.payload.by || "";
            state.backendFilters.serviceName = action.payload.bsnf || "";
            state.filters.location = newLocation || state.filters.location;
            state.filters.situations = newSituations || state.filters.situations;
            state.filters.responses = newResponses || state.filters.responses;
        },

        setFilters(state: FilterStore, action) {
            const {location, situations, responses} = action.payload;
            state.filters.location = location || state.filters.location;
            state.filters.situations = situations || state.filters.situations;
            state.filters.responses = responses || state.filters.responses;
        },
        resetFilters(state: FilterStore,action) {
            const {location, situations, responses} = action.payload;
            state.filters.location = location || israelLocation;
            state.filters.situations = situations || [];
            state.filters.responses = responses || [];
        },
        setBackendFilters(state: FilterStore, action) {
            const {response, situation, by, serviceName} = action.payload;
            state.backendFilters.response = response || '';
            state.backendFilters.situation = situation || '';
            state.backendFilters.by = by || '';
            state.backendFilters.serviceName = serviceName || '';
        },
        setSearchLocation(state: FilterStore, action) {
            state.searchLocation = action.payload;
        },
        addResponseFilter(state: FilterStore, action) {
            if (state.filters.responses.some((id) => id === action.payload)) return;
            state.filters.responses = [...state.filters.responses, action.payload];
        },
        removeResponseFilter(state: FilterStore, action) {
            const responseId = action.payload;
            state.filters.responses = state.filters.responses.filter((id) => id !== responseId);
        },
        addMultipleResponseFilters(state: FilterStore, action) {
            const responseIds: string[] = action.payload;
            const currentResponses = new Set(state.filters.responses);
            responseIds.forEach((id) => currentResponses.add(id));
            state.filters.responses = Array.from(currentResponses);
        },
        removeMultipleResponseFilters(state: FilterStore, action) {
            const responseIds: string[] = action.payload;
            const responseIdsSet = new Set(responseIds);
            state.filters.responses = state.filters.responses.filter((id) => !responseIdsSet.has(id));
        },
        addSituationFilter(state: FilterStore, action) {
            if (state.filters.situations.some((id) => id === action.payload)) return;
            state.filters.situations = [...state.filters.situations, action.payload];
        },
        removeSituationFilter(state: FilterStore, action) {
            const situationId = action.payload;
            state.filters.situations = state.filters.situations.filter((id) => id !== situationId);
        },
        removeMultipleSituationFilters(state: FilterStore, action) {
            const situationIds: string[] = action.payload;
            const situationIdsSet = new Set(situationIds);
            state.filters.situations = state.filters.situations.filter((id) => !situationIdsSet.has(id));
        },
        setLocationFilter(state: FilterStore, action) {
            const {key, bounds} = action.payload;
            state.filters.location = {
                key,
                bounds
            };
        }
    },
});

export const {
    setFilters,
    resetFilters,
    removeSituationFilter,
    removeMultipleSituationFilters,
    addSituationFilter,
    addResponseFilter,
    removeResponseFilter,
    addMultipleResponseFilters,
    removeMultipleResponseFilters,
    setLocationFilter,
    setSearchLocation,
    setFilterRouteParams,
    setBackendFilters
} = filterSlice.actions;

export default filterSlice.reducer;
