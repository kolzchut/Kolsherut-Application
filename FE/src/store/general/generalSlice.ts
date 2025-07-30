import {createSlice} from '@reduxjs/toolkit';
import {GeneralStore, initialState} from './initialState';

export const generalSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setRouteParams(state: GeneralStore, action) {
            state.page = action.payload.p || state.page;
            state.modal = action.payload.m || state.modal;
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
        },
        settingURLParamsToResults(state: GeneralStore, action) {
            state.searchQuery = action.payload;
            state.page = 'results';
        },
        setCardIdAndCardPage(state: GeneralStore, action) {
            state.cardId = action.payload;
            state.page = 'card'
        },
        setSearchQueryAndResultsPage(state: GeneralStore, action) {
            state.searchQuery = action.payload;
            state.page = 'results';
        },
        setAccessibility(state: GeneralStore, action) {
            state.accessibilityActive = action.payload;
        },
        setFirstVisitedUrl(state: GeneralStore, action) {
            if (state.firstVisitedUrl === null) {
                state.firstVisitedUrl = action.payload;
            }
        },
        setLoading(state: GeneralStore, action) {
            if (typeof action.payload != 'boolean') return;
            state.loading = action.payload;

        }
    },
});

export const {
    setRouteParams,
    setPage, setSearchQueryAndResultsPage,
    setCardIdAndCardPage,
    setModal,
    settingURLParamsToResults,
    setShowSidebar,
    setAccessibility,
    setFirstVisitedUrl,
    setLoading,
} = generalSlice.actions;

export default generalSlice.reducer;
