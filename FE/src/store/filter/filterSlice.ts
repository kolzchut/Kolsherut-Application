import {createSlice} from '@reduxjs/toolkit';
import {FilterStore, initialState} from './initialState';

export const filterSlice = createSlice({
    name: 'filter',
    initialState,
    reducers: {
        setFilterRouteParams(state: FilterStore, action) {
            state.filters.location = action.payload.lf || state.filters.location;
            state.filters.situations = action.payload.sf || state.filters.situations;
            state.filters.responses = action.payload.rf || state.filters.responses;
        },
        setSearchLocation(state: FilterStore, action) {
            state.searchLocation = action.payload;
        },
        addResponseFilter(state: FilterStore, action) {
            if(state.filters.responses.some((id) => id === action.payload)) return;
            state.filters.responses = [...state.filters.responses, action.payload];
        },
        addMultipleResponseFilters(state: FilterStore, action) {
            const responseIds:string[] = action.payload;
            responseIds.forEach((id) => {
                if(!state.filters.responses.includes(id)) {
                    state.filters.responses = [...state.filters.responses, id];
                }
            });
        },
        removeResponseFilter(state: FilterStore, action) {
            const responseId = action.payload;
            state.filters.responses = state.filters.responses.filter((id) => id !== responseId);
        },
        setResponsesFilter(state: FilterStore, action) {
            state.filters.responses = action.payload;
        },
        removeMultipleResponseFilters(state: FilterStore, action) {
            const responseIds = action.payload;
            state.filters.responses = state.filters.responses.filter((id) => !responseIds.includes(id));
        },
        addSituationFilter(state: FilterStore, action) {
            if(state.filters.situations.some((id) => id === action.payload)) return;
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
        setSituationsFilter(state: FilterStore, action) {
            state.filters.situations = action.payload;
        },
        setResponseAndSituationFilters(state: FilterStore, action) {
            const {responses, situations} = action.payload;
            state.filters.responses = responses;
            state.filters.situations = situations;
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
    removeSituationFilter,
    removeMultipleSituationFilters,
    addSituationFilter,
    setSituationsFilter,
    setResponsesFilter,
    setResponseAndSituationFilters,
    addResponseFilter,
    addMultipleResponseFilters,
    removeResponseFilter,
    removeMultipleResponseFilters,
    setLocationFilter,
    setSearchLocation,
    setFilterRouteParams,
} = filterSlice.actions;

export default filterSlice.reducer;
