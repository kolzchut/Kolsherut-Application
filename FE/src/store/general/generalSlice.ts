import {createSlice} from '@reduxjs/toolkit';
import {GeneralStore, initialState} from './initialState';

export const generalSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setRouteParams(state: GeneralStore, action) {
            state.page = action.payload.p || state.page;
            state.cardId = action.payload.c || state.cardId;
        },
        setPage(state: GeneralStore, action) {
            state.page = action.payload;
        },
        setSearchOptions(state: GeneralStore, action) {
            state.searchOptions = action.payload;
        },
    },
});

export const {
    setRouteParams,
    setSearchOptions,
    setPage
} = generalSlice.actions;

export default generalSlice.reducer;
