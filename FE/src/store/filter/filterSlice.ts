import {createSlice} from '@reduxjs/toolkit';
import {FilterStore, initialState} from './initialState';
import {parseLocation} from "../../services/url/parseURL.ts";
import israelLocation from "../../constants/israelLocation.ts";

export const filterSlice = createSlice({
    name: 'filter',
    initialState,
    reducers: {
        setFilterRouteParams(state: FilterStore, action) {
            const newLocation = !action.payload.lf ? null : parseLocation(action.payload.lf);
            const newSituations = action.payload.sf ? JSON.parse(action.payload.sf) : null;
            const newResponses = action.payload.rf ? JSON.parse(action.payload.rf) : null;
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
        removeFilters(state: FilterStore) {
            state.filters = {
                location: israelLocation,
                situations: [],
                responses: []
            };
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
            responseIds.forEach((id) => {
                if (!state.filters.responses.includes(id)) {
                    state.filters.responses = [...state.filters.responses, id];
                }
            });
            const responseId = action.payload;
            state.filters.responses = state.filters.responses.filter((id) => id !== responseId);
        },
        removeMultipleResponseFilters(state: FilterStore, action) {
            const responseIds = action.payload;
            state.filters.responses = state.filters.responses.filter((id) => !responseIds.includes(id));
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
            const situationIds = action.payload;
            state.filters.situations = state.filters.situations.filter((id) => !situationIds.includes(id));
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
    removeFilters,
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
} = filterSlice.actions;

export default filterSlice.reducer;
