import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: 'customer' | 'staff' | 'admin';
  status: 'active' | 'locked';
  provider: string | null;
  plan_type: string | null;
  current_credit: number;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total: number;
  active: number;
  locked: number;
  byRole: { customer: number; staff: number; admin: number };
}

interface UsersState {
  // Data
  users: AdminUser[];
  stats: UserStats | null;
  total: number;
  totalPages: number;
  // Filters / pagination
  page: number;
  limit: number;
  search: string;
  roleFilter: string;
  statusFilter: string;
  // Loading states
  isLoading: boolean;
  isStatsLoading: boolean;
  error: string | null;
  updatingId: string | null;
  // UI state (which user is shown in sheet / pending delete)
  sheetUserId: string | null;
  deleteTargetId: string | null;
}

// ── Async thunks ───────────────────────────────────────────────────────────────

export const fetchStats = createAsyncThunk(
  'users/fetchStats',
  async (_, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (!token) return rejectWithValue('No token');
    const res = await fetch(`${API_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) return rejectWithValue(json.error);
    return json.data as UserStats;
  }
);

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;
    if (!token) return rejectWithValue('No token');

    const { page, limit, search, roleFilter, statusFilter } = state.users;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(search && { search }),
      ...(roleFilter !== 'all' && { role: roleFilter }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
    });

    const res = await fetch(`${API_URL}/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) return rejectWithValue(json.error);
    return json.data as { users: AdminUser[]; total: number; totalPages: number };
  }
);

export const updateUserRole = createAsyncThunk(
  'users/updateRole',
  async ({ id, role }: { id: string; role: string }, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.accessToken;
    const res = await fetch(`${API_URL}/api/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (!json.success) return rejectWithValue(json.error);
    return json.data as Pick<AdminUser, 'id' | 'role' | 'status'>;
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateStatus',
  async ({ id, status }: { id: string; status: string }, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.accessToken;
    const res = await fetch(`${API_URL}/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) return rejectWithValue(json.error);
    return json.data as Pick<AdminUser, 'id' | 'role' | 'status'>;
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { getState, rejectWithValue }) => {
    const token = (getState() as RootState).auth.accessToken;
    const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) return rejectWithValue(json.error);
    return id;
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────────

const initialState: UsersState = {
  users: [],
  stats: null,
  total: 0,
  totalPages: 1,
  page: 1,
  limit: 20,
  search: '',
  roleFilter: 'all',
  statusFilter: 'all',
  isLoading: false,
  isStatsLoading: false,
  error: null,
  updatingId: null,
  sheetUserId: null,
  deleteTargetId: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setPage(state, action: PayloadAction<number>) { state.page = action.payload; },
    setLimit(state, action: PayloadAction<number>) { state.limit = action.payload; state.page = 1; },
    setSearch(state, action: PayloadAction<string>) { state.search = action.payload; state.page = 1; },
    setRoleFilter(state, action: PayloadAction<string>) { state.roleFilter = action.payload; state.page = 1; },
    setStatusFilter(state, action: PayloadAction<string>) { state.statusFilter = action.payload; state.page = 1; },
    openSheet(state, action: PayloadAction<string>) { state.sheetUserId = action.payload; },
    closeSheet(state) { state.sheetUserId = null; },
    openDeleteDialog(state, action: PayloadAction<string>) { state.deleteTargetId = action.payload; },
    closeDeleteDialog(state) { state.deleteTargetId = null; },
  },
  extraReducers: (builder) => {
    // fetchStats
    builder
      .addCase(fetchStats.pending, (state) => { state.isStatsLoading = true; })
      .addCase(fetchStats.fulfilled, (state, action) => { state.stats = action.payload; state.isStatsLoading = false; })
      .addCase(fetchStats.rejected, (state) => { state.isStatsLoading = false; });

    // fetchUsers
    builder
      .addCase(fetchUsers.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload.users;
        state.total = action.payload.total;
        state.totalPages = action.payload.totalPages;
        state.isLoading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.error = String(action.payload ?? action.error.message);
        state.isLoading = false;
      });

    // updateUserRole
    builder
      .addCase(updateUserRole.pending, (state, action) => { state.updatingId = action.meta.arg.id; })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx].role = action.payload.role as AdminUser['role'];
        state.updatingId = null;
      })
      .addCase(updateUserRole.rejected, (state) => { state.updatingId = null; });

    // updateUserStatus
    builder
      .addCase(updateUserStatus.pending, (state, action) => { state.updatingId = action.meta.arg.id; })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const idx = state.users.findIndex((u) => u.id === action.payload.id);
        if (idx !== -1) state.users[idx].status = action.payload.status as AdminUser['status'];
        state.updatingId = null;
      })
      .addCase(updateUserStatus.rejected, (state) => { state.updatingId = null; });

    // deleteUser
    builder
      .addCase(deleteUser.pending, (state) => {})
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
        state.deleteTargetId = null;
        state.sheetUserId = null;
        // Refetch stats after delete
      })
      .addCase(deleteUser.rejected, (state) => {});
  },
});

export const {
  setPage, setLimit, setSearch, setRoleFilter, setStatusFilter,
  openSheet, closeSheet, openDeleteDialog, closeDeleteDialog,
} = usersSlice.actions;

// ── Selectors ──────────────────────────────────────────────────────────────────

export const selectUsers = (s: RootState) => s.users.users;
export const selectStats = (s: RootState) => s.users.stats;
export const selectUsersLoading = (s: RootState) => s.users.isLoading;
export const selectUsersError = (s: RootState) => s.users.error;
export const selectPagination = (s: RootState) => ({
  page: s.users.page, limit: s.users.limit,
  total: s.users.total, totalPages: s.users.totalPages,
});
export const selectFilters = (s: RootState) => ({
  search: s.users.search,
  roleFilter: s.users.roleFilter,
  statusFilter: s.users.statusFilter,
});
export const selectUpdatingId = (s: RootState) => s.users.updatingId;
export const selectSheetUser = (s: RootState) =>
  s.users.sheetUserId ? s.users.users.find((u) => u.id === s.users.sheetUserId) ?? null : null;
export const selectDeleteTarget = (s: RootState) =>
  s.users.deleteTargetId ? s.users.users.find((u) => u.id === s.users.deleteTargetId) ?? null : null;

export default usersSlice.reducer;
