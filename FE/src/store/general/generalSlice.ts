import {createSlice} from '@reduxjs/toolkit';
import {GeneralStore, initialState} from './initialState';

export const generalSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setRouteParams(state: GeneralStore, action) {
            state.page = action.payload.p || state.page;
        },
        setSearchOptions(state: GeneralStore, action) {
            state.searchOptions = action.payload;
        },
        setPage(state: GeneralStore, action) {
            state.page = action.payload;
        },
    },
});

export const {
    setRouteParams,
    setSearchOptions,
} = generalSlice.actions;

export default generalSlice.reducer;
