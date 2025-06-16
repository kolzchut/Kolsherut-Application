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
        }
    },
});

export const {
    setConnected,
    setDisconnected
} = generalSlice.actions;

export default generalSlice.reducer;
