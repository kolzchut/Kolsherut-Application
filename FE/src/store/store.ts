import { configureStore } from '@reduxjs/toolkit';
import generalReducer from './general/generalSlice';
import dataReducer from './data/dataSlice';
export const store = configureStore({
  reducer: {
    general: generalReducer,
    data: dataReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
