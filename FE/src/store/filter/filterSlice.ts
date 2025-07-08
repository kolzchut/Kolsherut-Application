import {createSlice} from '@reduxjs/toolkit';
import {FilterStore, initialState} from './initialState';

export const filterSlice = createSlice({
    name: 'filter',
    initialState,
    reducers: {
        setSearchLocation(state: FilterStore, action) {
            state.searchLocation = action.payload;
        },
        addResponseFilter(state: FilterStore, action) {
            if(state.filters.responses.some((id) => id === action.payload)) return;
            state.filters.responses.push(action.payload);
        },
        addMultipleResponseFilters(state: FilterStore, action) {
            const responseIds:string[] = action.payload;
            responseIds.forEach((id) => {
                if(!state.filters.responses.includes(id)) {
                    state.filters.responses.push(id);
                }
            });
        },
        removeResponseFilter(state: FilterStore, action) {
            const responseId = action.payload;
            state.filters.responses = state.filters.responses.filter((id) => id !== responseId);
        },
        removeMultipleResponseFilters(state: FilterStore, action) {
            const responseIds = action.payload;
            state.filters.responses = state.filters.responses.filter((id) => !responseIds.includes(id));
        },
        addSituationFilter(state: FilterStore, action) {
            if(state.filters.situations.some((id) => id === action.payload)) return;
            state.filters.situations.push(action.payload);
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
    addResponseFilter,
    addMultipleResponseFilters,
    removeResponseFilter,
    removeMultipleResponseFilters,
    setLocationFilter,
    setSearchLocation
} = filterSlice.actions;

export default filterSlice.reducer;
