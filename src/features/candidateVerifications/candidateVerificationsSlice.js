import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../api/axios';
import { logout } from '../auth/authSlice';

function listQueryKey(params) {
  if (!params || typeof params !== 'object') return '{}';
  const { page = 1, limit = 10, status } = params;
  return JSON.stringify({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    status: status ? String(status) : '',
  });
}

export const fetchCandidateVerifications = createAsyncThunk(
  'candidateVerifications/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const res = await adminAPI.getCandidateVerificationRequests(params);
      return {
        data: res.data?.data ?? [],
        pagination: res.data?.pagination ?? {},
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message ||
          'Failed to load candidate verification requests.',
      );
    }
  },
  {
    condition: (params, { getState }) => {
      const s = getState().candidateVerifications;
      const key = listQueryKey(params);
      if (s.lastListQueryKey === key) return false;
      if (s.isLoading) return false;
      return true;
    },
  }
);

export const verifyCandidate = createAsyncThunk(
  'candidateVerifications/verify',
  async (id, { rejectWithValue }) => {
    try {
      await adminAPI.verifyCandidateRequest(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to approve user request.',
      );
    }
  }
);

const initialState = {
  list: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  },
  lastListQueryKey: null,
  isLoading: false,
  error: null,
  actionLoading: null,
  actionError: null,
};

const candidateVerificationsSlice = createSlice({
  name: 'candidateVerifications',
  initialState,
  reducers: {
    clearCandidateVerificationErrors: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidateVerifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCandidateVerifications.fulfilled, (state, action) => {
        const { payload } = action;
        state.list = payload.data ?? [];
        state.pagination = {
          currentPage: payload.pagination?.currentPage ?? 1,
          totalPages: payload.pagination?.totalPages ?? 1,
          totalItems: payload.pagination?.totalItems ?? 0,
          itemsPerPage: payload.pagination?.itemsPerPage ?? state.pagination.itemsPerPage,
        };
        state.lastListQueryKey = listQueryKey(action.meta.arg);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchCandidateVerifications.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(verifyCandidate.pending, (state, { meta }) => {
        state.actionLoading = meta.arg;
        state.actionError = null;
      })
      .addCase(verifyCandidate.fulfilled, (state, { payload: id }) => {
        state.list = state.list.map((item) =>
          item.id === id
            ? { ...item, status: 'verified', isVerified: true }
            : item
        );
        state.actionLoading = null;
        state.actionError = null;
      })
      .addCase(verifyCandidate.rejected, (state, { payload }) => {
        state.actionLoading = null;
        state.actionError = payload;
      })
      .addCase(logout.fulfilled, () => ({ ...initialState }));
  },
});

export const { clearCandidateVerificationErrors } =
  candidateVerificationsSlice.actions;
export const selectCvList = (state) => state.candidateVerifications.list;
export const selectCvPagination = (state) =>
  state.candidateVerifications.pagination;
export const selectCvLoading = (state) => state.candidateVerifications.isLoading;
export const selectCvError = (state) => state.candidateVerifications.error;
export const selectCvActionLoading = (state) =>
  state.candidateVerifications.actionLoading;
export const selectCvActionError = (state) =>
  state.candidateVerifications.actionError;
export default candidateVerificationsSlice.reducer;
