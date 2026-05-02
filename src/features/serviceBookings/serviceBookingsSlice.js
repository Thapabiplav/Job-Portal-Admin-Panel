import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../api/axios';
import { logout } from '../auth/authSlice';

function serviceBookingsListQueryKey(params) {
  if (!params || typeof params !== 'object') return '{}';
  const { page = 1, limit = 10, status, search } = params;
  return JSON.stringify({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    status: status ? String(status) : '',
    search: search ? String(search).trim() : '',
  });
}

export const fetchServiceBookings = createAsyncThunk(
  'serviceBookings/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const res = await adminAPI.getServiceBookings(params);
      return {
        data: res.data?.data || [],
        pagination: res.data?.pagination || {},
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load service bookings.',
      );
    }
  },
  {
    condition: (params, { getState }) => {
      const s = getState().serviceBookings;
      const key = serviceBookingsListQueryKey(params);
      if (s.lastListQueryKey === key) return false;
      if (s.isLoading) return false;
      return true;
    },
  }
);

export const updateServiceBookingStatusThunk = createAsyncThunk(
  'serviceBookings/updateStatus',
  async ({ id, nextStatus }, { rejectWithValue }) => {
    try {
      const res = await adminAPI.updateServiceBookingStatus(id, nextStatus);
      const updated = res.data?.data;
      return {
        id,
        status: updated?.status || nextStatus,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update booking.',
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

const serviceBookingsSlice = createSlice({
  name: 'serviceBookings',
  initialState,
  reducers: {
    clearServiceBookingsError: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceBookings.fulfilled, (state, action) => {
        const { payload } = action;
        state.list = payload.data ?? [];
        const p = payload.pagination || {};
        state.pagination = {
          currentPage: p.currentPage ?? 1,
          totalPages: p.totalPages ?? 1,
          totalItems: p.totalItems ?? 0,
          itemsPerPage: p.itemsPerPage ?? state.pagination.itemsPerPage,
        };
        state.lastListQueryKey = serviceBookingsListQueryKey(action.meta.arg);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchServiceBookings.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(updateServiceBookingStatusThunk.pending, (state, { meta }) => {
        state.actionLoading = meta.arg.id;
        state.actionError = null;
      })
      .addCase(updateServiceBookingStatusThunk.fulfilled, (state, { payload }) => {
        const { id, status } = payload;
        state.list = state.list.map((item) =>
          item.id === id ? { ...item, status } : item
        );
        state.actionLoading = null;
        state.actionError = null;
      })
      .addCase(updateServiceBookingStatusThunk.rejected, (state, { payload }) => {
        state.actionLoading = null;
        state.actionError = payload;
      })
      .addCase(logout.fulfilled, () => ({ ...initialState }));
  },
});

export const { clearServiceBookingsError } = serviceBookingsSlice.actions;
export const selectServiceBookingsList = (state) => state.serviceBookings.list;
export const selectServiceBookingsPagination = (state) =>
  state.serviceBookings.pagination;
export const selectServiceBookingsLoading = (state) =>
  state.serviceBookings.isLoading;
export const selectServiceBookingsError = (state) =>
  state.serviceBookings.error;
export const selectServiceBookingsActionLoading = (state) =>
  state.serviceBookings.actionLoading;
export const selectServiceBookingsActionError = (state) =>
  state.serviceBookings.actionError;
export default serviceBookingsSlice.reducer;
