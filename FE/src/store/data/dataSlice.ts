import {createSlice} from '@reduxjs/toolkit';
import {DataStore, initialState} from './initialState';

export const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        setResults(state:DataStore, action){
            state.results = action.payload;
        },
        setSearchOptions(state: DataStore, action) {
            state.searchOptions = action.payload;
        },
        setSelectedOrganization(state: DataStore, action) {
            const organization = action.payload;
            if (organization) {
                state.selectedOrganization = organization;
            } else {
                state.selectedOrganization = null;
            }
        },
        setLocations(state: DataStore, action) {
            state.locations = action.payload;
        }
    },
});

export const {
    setSelectedOrganization,
    setSearchOptions,
    setLocations,
    setResults
} = dataSlice.actions;

export default dataSlice.reducer;
