import {createSlice} from '@reduxjs/toolkit';
import {DataStore, initialState} from './initialState';

export const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        setSearchOptions(state: DataStore, action) {
            state.searchOptions = action.payload;
        },
    },
});

export const {
    setSearchOptions,
} = dataSlice.actions;

export default dataSlice.reducer;
