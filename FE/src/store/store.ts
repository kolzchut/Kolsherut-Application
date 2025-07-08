import { configureStore } from '@reduxjs/toolkit';
import generalReducer from './general/generalSlice';
import dataReducer from './data/dataSlice';
import filterReducer from './filter/filterSlice';

export const store = configureStore({
  reducer: {
    general: generalReducer,
    data: dataReducer,
    filter: filterReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
