import {createSlice} from '@reduxjs/toolkit';
import {DataStore, initialState} from './initialState';

export const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        setResults(state: DataStore, action) {
            state.results = action.payload;
        },
        setSelectedOrganization(state: DataStore, action) {
            state.selectedOrganization = action.payload || null;
        },
        setLocations(state: DataStore, action) {
            state.locations = action.payload;
        },
        setSitemap(state: DataStore, action) {
            state.sitemap = action.payload;
        },
        setTaxonomy(state: DataStore, action) {
            const {responses, situations} = action.payload;
            state.taxonomy.responses = responses;
            state.taxonomy.situations = situations;
        }
    },
});

export const {
    setSelectedOrganization,
    setTaxonomy,
    setLocations,
    setResults,
    setSitemap
} = dataSlice.actions;

export default dataSlice.reducer;
