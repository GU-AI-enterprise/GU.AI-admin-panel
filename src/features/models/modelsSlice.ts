import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store/store';
import { apiFetch } from '@/lib/apiFetch';

// ── Types ──────────────────────────────────────────────────────────────────────

export type PlanTier = 'free' | 'basic' | 'pro';

export interface AppModel {
  id: string;
  name: string;
  image_url: string;
  gender: 'male' | 'female' | 'unisex' | null;
  tags: string[] | null;
  required_tier: PlanTier;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ModelsState {
  models: AppModel[];
  isLoading: boolean;
  error: string | null;
  savingId: string | null; // 'new' khi đang tạo, id khi đang update/delete
}

const initialState: ModelsState = {
  models: [],
  isLoading: false,
  error: null,
  savingId: null,
};

// ── Async thunks ───────────────────────────────────────────────────────────────

export const fetchModels = createAsyncThunk(
  'models/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await apiFetch('/api/admin/models');
    const json = await res.json();
    if (!json.success) return rejectWithValue(json.error);
    return json.data as AppModel[];
  }
);

export const createModel = createAsyncThunk(
  'models/create',
  async (formData: FormData, { rejectWithValue }) => {
    const res = await apiFetch('/api/admin/models', { method: 'POST', body: formData });
    const json = await res.json();
    if (!json.success) return rejectWithValue(json.error);
    return json.data as AppModel;
  }
);

export const updateModel = createAsyncThunk(
  'models/update',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    const res = await apiFetch(`/api/admin/models/${id}`, { method: 'PUT', body: formData });
    const json = await res.json();
    if (!json.success) return rejectWithValue(json.error);
    return json.data as AppModel;
  }
);

export const deleteModel = createAsyncThunk(
  'models/delete',
  async (id: string, { rejectWithValue }) => {
    const res = await apiFetch(`/api/admin/models/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!json.success) return rejectWithValue(json.error);
    return id;
  }
);

// ── Slice ──────────────────────────────────────────────────────────────────────

const modelsSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchModels.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchModels.fulfilled, (state, action: PayloadAction<AppModel[]>) => {
        state.models = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchModels.rejected, (state, action) => {
        state.error = String(action.payload ?? action.error.message);
        state.isLoading = false;
      });

    builder
      .addCase(createModel.pending, (state) => { state.savingId = 'new'; })
      .addCase(createModel.fulfilled, (state, action) => {
        state.models.push(action.payload);
        state.savingId = null;
      })
      .addCase(createModel.rejected, (state, action) => {
        state.error = String(action.payload ?? action.error.message);
        state.savingId = null;
      });

    builder
      .addCase(updateModel.pending, (state, action) => { state.savingId = action.meta.arg.id; })
      .addCase(updateModel.fulfilled, (state, action) => {
        const idx = state.models.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.models[idx] = action.payload;
        state.savingId = null;
      })
      .addCase(updateModel.rejected, (state, action) => {
        state.error = String(action.payload ?? action.error.message);
        state.savingId = null;
      });

    builder
      .addCase(deleteModel.pending, (state, action) => { state.savingId = action.meta.arg; })
      .addCase(deleteModel.fulfilled, (state, action) => {
        state.models = state.models.filter((m) => m.id !== action.payload);
        state.savingId = null;
      })
      .addCase(deleteModel.rejected, (state, action) => {
        state.error = String(action.payload ?? action.error.message);
        state.savingId = null;
      });
  },
});

export const selectModels = (s: RootState) => s.models.models;
export const selectModelsLoading = (s: RootState) => s.models.isLoading;
export const selectModelsError = (s: RootState) => s.models.error;
export const selectSavingId = (s: RootState) => s.models.savingId;

export default modelsSlice.reducer;
