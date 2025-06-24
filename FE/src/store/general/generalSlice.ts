import {createSlice} from '@reduxjs/toolkit';
import {GeneralStore, initialState} from './initialState';

export const generalSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setRouteParams(state: GeneralStore, action) {
            state.page = action.payload.p || state.page;
        },
        setPage(state: GeneralStore, action) {
            state.page = action.payload;
        },
    },
});

export const {
    setRouteParams,
} = generalSlice.actions;

export default generalSlice.reducer;
