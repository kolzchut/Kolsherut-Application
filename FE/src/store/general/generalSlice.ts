import {createSlice} from '@reduxjs/toolkit';
import {GeneralStore, initialState} from './initialState';

export const generalSlice = createSlice({
    name: 'general',
    initialState,
    reducers: {
        setConnected(state: GeneralStore) {
            state.connected = true;
        },
        setDisconnected(state: GeneralStore) {
            state.connected = false;
        },
        setSearchOptions(state: GeneralStore, action) {
            state.searchOptions = action.payload;
        },
        setPage(state: GeneralStore, action) {
            state.page = action.payload;
        }
    },
});

export const {
    setConnected,
    setDisconnected,
    setSearchOptions,
    setPage
} = generalSlice.actions;

export default generalSlice.reducer;
