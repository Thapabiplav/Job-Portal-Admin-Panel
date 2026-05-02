import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../api/axios';
import { logout } from '../auth/authSlice';

function ordersListQueryKey(params) {
  if (!params || typeof params !== 'object') return '{}';
  const { page = 1, limit = 10, status, search } = params;
  return JSON.stringify({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    status: status ? String(status) : '',
    search: search ? String(search).trim() : '',
  });
}

export const fetchAdminOrders = createAsyncThunk(
  'adminOrders/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const res = await adminAPI.getOrders(params);
      return {
        data: res.data?.data || [],
        pagination: res.data?.pagination || {},
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load orders.',
      );
    }
  },
  {
    condition: (params, { getState }) => {
      const s = getState().adminOrders;
      const key = ordersListQueryKey(params);
      if (s.lastListQueryKey === key) return false;
      if (s.isLoading) return false;
      return true;
    },
  }
);

export const updateAdminOrderStatus = createAsyncThunk(
  'adminOrders/updateStatus',
  async ({ orderId, nextStatus }, { rejectWithValue }) => {
    try {
      const res = await adminAPI.updateOrderStatus(orderId, nextStatus);
      const updated = res.data?.data;
      return {
        orderId,
        status: updated?.status || nextStatus,
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update order.',
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

const adminOrdersSlice = createSlice({
  name: 'adminOrders',
  initialState,
  reducers: {
    clearAdminOrdersError: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        const { payload } = action;
        state.list = payload.data ?? [];
        const p = payload.pagination || {};
        state.pagination = {
          currentPage: p.currentPage ?? 1,
          totalPages: p.totalPages ?? 1,
          totalItems: p.totalItems ?? 0,
          itemsPerPage: p.itemsPerPage ?? state.pagination.itemsPerPage,
        };
        state.lastListQueryKey = ordersListQueryKey(action.meta.arg);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchAdminOrders.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(updateAdminOrderStatus.pending, (state, { meta }) => {
        state.actionLoading = meta.arg.orderId;
        state.actionError = null;
      })
      .addCase(updateAdminOrderStatus.fulfilled, (state, { payload }) => {
        const { orderId, status } = payload;
        state.list = state.list.map((item) =>
          item.id === orderId ? { ...item, status } : item
        );
        state.actionLoading = null;
        state.actionError = null;
      })
      .addCase(updateAdminOrderStatus.rejected, (state, { payload }) => {
        state.actionLoading = null;
        state.actionError = payload;
      })
      .addCase(logout.fulfilled, () => ({ ...initialState }));
  },
});

export const { clearAdminOrdersError } = adminOrdersSlice.actions;
export const selectAdminOrdersList = (state) => state.adminOrders.list;
export const selectAdminOrdersPagination = (state) =>
  state.adminOrders.pagination;
export const selectAdminOrdersLoading = (state) => state.adminOrders.isLoading;
export const selectAdminOrdersError = (state) => state.adminOrders.error;
export const selectAdminOrdersActionLoading = (state) =>
  state.adminOrders.actionLoading;
export const selectAdminOrdersActionError = (state) =>
  state.adminOrders.actionError;
export default adminOrdersSlice.reducer;
