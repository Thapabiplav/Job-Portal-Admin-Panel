import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../api/axios';

export const fetchOrganizations = createAsyncThunk(
  'companies/fetchOrganizations',
  async (params, { rejectWithValue }) => {
    try {
      const res = await adminAPI.getOrganizations(params);
      return {
        data: res.data?.data ?? res.data,
        pagination: res.data?.pagination ?? {},
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load companies.');
    }
  }
);

export const verifyOrganization = createAsyncThunk(
  'companies/verifyOrganization',
  async (id, { rejectWithValue }) => {
    try {
      await adminAPI.verifyOrganization(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to verify company.');
    }
  }
);

const initialState = {
  list: [],
  pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
  isLoading: false,
  error: null,
  actionLoading: null,
  actionError: null,
};

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    clearCompaniesError: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrganizations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrganizations.fulfilled, (state, { payload }) => {
        state.list = payload.data ?? [];
        state.pagination = payload.pagination ?? state.pagination;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchOrganizations.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(verifyOrganization.pending, (state, { meta }) => {
        state.actionLoading = meta.arg;
        state.actionError = null;
      })
      .addCase(verifyOrganization.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((c) => c.id === payload);
        if (idx !== -1) {
          state.list[idx] = { ...state.list[idx], isVerified: true, status: 'verified' };
        }
        state.actionLoading = null;
        state.actionError = null;
      })
      .addCase(verifyOrganization.rejected, (state, { payload }) => {
        state.actionLoading = null;
        state.actionError = payload;
      });
  },
});

export const { clearCompaniesError } = companiesSlice.actions;
export const selectCompaniesList = (state) => state.companies.list;
export const selectCompaniesPagination = (state) => state.companies.pagination;
export const selectCompaniesLoading = (state) => state.companies.isLoading;
export const selectCompaniesError = (state) => state.companies.error;
export const selectCompaniesActionLoading = (state) => state.companies.actionLoading;
export const selectCompaniesActionError = (state) => state.companies.actionError;
export default companiesSlice.reducer;
