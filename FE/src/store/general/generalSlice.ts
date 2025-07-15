import {createSlice} from '@reduxjs/toolkit';
import {GeneralStore, initialState} from './initialState';

export const generalSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setRouteParams(state: GeneralStore, action) {
            state.page = action.payload.p || state.page;
            state.cardId = action.payload.c || state.cardId;
            state.searchQuery = action.payload.sq || state.searchQuery;
        },
        setPage(state: GeneralStore, action) {
            state.page = action.payload;
        },
        setModal(state: GeneralStore, action) {
            state.modal = action.payload;
        },
        setShowSidebar(state: GeneralStore, action) {
            state.showSidebar = action.payload;
        }
    },
});

export const {
    setRouteParams,
    setPage,
    setModal,
    setShowSidebar
} = generalSlice.actions;

export default generalSlice.reducer;
