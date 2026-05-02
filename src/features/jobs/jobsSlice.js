import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../api/axios';
import { logout } from '../auth/authSlice';

function jobsListQueryKey(params) {
  if (!params || typeof params !== 'object') return '{}';
  const { page = 1, limit = 10, search } = params;
  return JSON.stringify({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search: search ? String(search).trim() : '',
  });
}

export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async (params, { rejectWithValue }) => {
    try {
      const res = await adminAPI.getJobs(params);
      return {
        data: res.data?.data ?? res.data,
        pagination: res.data?.pagination ?? {},
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load jobs.');
    }
  },
  {
    condition: (params, { getState }) => {
      const key = jobsListQueryKey(params);
      if (getState().jobs.lastListQueryKey === key) return false;
      return true;
    },
  }
);

export const deleteJob = createAsyncThunk(
  'jobs/deleteJob',
  async (id, { rejectWithValue }) => {
    try {
      await adminAPI.deleteJob(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete job.');
    }
  }
);

const initialState = {
  list: [],
  pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
  lastListQueryKey: null,
  isLoading: false,
  error: null,
  actionLoading: null,
  actionError: null,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    clearJobsError: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        const { payload } = action;
        state.list = payload.data ?? [];
        state.pagination = payload.pagination ?? state.pagination;
        state.lastListQueryKey = jobsListQueryKey(action.meta.arg);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(deleteJob.pending, (state, { meta }) => {
        state.actionLoading = meta.arg;
        state.actionError = null;
      })
      .addCase(deleteJob.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((j) => j.id !== payload);
        state.actionLoading = null;
        state.actionError = null;
      })
      .addCase(deleteJob.rejected, (state, { payload }) => {
        state.actionLoading = null;
        state.actionError = payload;
      })
      .addCase(logout.fulfilled, () => ({ ...initialState }));
  },
});

export const { clearJobsError } = jobsSlice.actions;
export const selectJobsList = (state) => state.jobs.list;
export const selectJobsPagination = (state) => state.jobs.pagination;
export const selectJobsLoading = (state) => state.jobs.isLoading;
export const selectJobsError = (state) => state.jobs.error;
export const selectJobsActionLoading = (state) => state.jobs.actionLoading;
export const selectJobsActionError = (state) => state.jobs.actionError;
export default jobsSlice.reducer;
