import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  userRole: string | null;
  isAdmin: boolean;
  accessToken: string | null;
  isLoading: boolean;
}

const initialState: AuthState = {
  userId: null,
  email: null,
  displayName: null,
  avatarUrl: null,
  userRole: null,
  isAdmin: false,
  accessToken: null,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<Omit<AuthState, 'isLoading'>>) {
      return { ...action.payload, isLoading: false };
    },
    clearAuth(state) {
      return { ...initialState, isLoading: false };
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { setAuth, clearAuth, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
