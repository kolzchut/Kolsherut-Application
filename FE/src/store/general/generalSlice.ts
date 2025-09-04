import {createSlice} from '@reduxjs/toolkit';
import {GeneralStore, initialState} from './initialState';

export const generalSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setRouteParams(state: GeneralStore, action) {
            state.page = action.payload.p || 'home';
            state.modal = action.payload.m || state.modal;
            state.cardId = action.payload.c || state.cardId;
            state.searchQuery = action.payload.sq || state.searchQuery;
        },
        setPage(state: GeneralStore, action) {
            if (!action.payload) {
                state.page = 'home'
                return;
            }
            state.page = action.payload;
        },
        setSearchQuery(state: GeneralStore, action) {
            state.searchQuery = action.payload;
        },
        setModal(state: GeneralStore, action) {
            state.modal = action.payload;
        },
        setShowSidebar(state: GeneralStore, action) {
            state.showSidebar = action.payload;
        },
        settingURLParamsToResults(state: GeneralStore, action) {
            state.searchQuery = action.payload;
        },
        setCardIdAndCardPage(state: GeneralStore, action) {
            state.cardId = action.payload;
            state.page = 'card'
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
        },
        setSelectedFeatureId(state: GeneralStore, action) {
            if (typeof action.payload !== 'string' && action.payload !== null) return;
            state.selectedFeatureId = action.payload;
        }
    },
});

export const {
    setRouteParams,
    setPage,
    setSearchQuery,
    setCardIdAndCardPage,
    setModal,
    settingURLParamsToResults,
    setShowSidebar,
    setAccessibility,
    setFirstVisitedUrl,
    setLoading,
    setSelectedFeatureId
} = generalSlice.actions;

export default generalSlice.reducer;
