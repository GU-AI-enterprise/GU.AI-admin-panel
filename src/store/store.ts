import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import authReducer from '@/features/auth/authSlice';
import usersReducer from '@/features/users/usersSlice';
import uiReducer from '@/features/ui/uiSlice';
import modelsReducer from '@/features/models/modelsSlice';

export const store = configureStore({
  reducer: {
    app:    appReducer,
    auth:   authReducer,
    users:  usersReducer,
    ui:     uiReducer,
    models: modelsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
