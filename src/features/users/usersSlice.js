import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../api/axios';
import { logout } from '../auth/authSlice';

function usersListQueryKey(params) {
  if (!params || typeof params !== 'object') return '{}';
  const { page = 1, limit = 10, role, search } = params;
  return JSON.stringify({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    role: role ? String(role) : '',
    search: search ? String(search).trim() : '',
  });
}

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const res = await adminAPI.getUsers(params);
      return {
        data: res.data?.data ?? res.data,
        pagination: res.data?.pagination ?? {},
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load users.');
    }
  },
  {
    condition: (params, { getState }) => {
      const key = usersListQueryKey(params);
      const { lastListQueryKey } = getState().users;
      if (lastListQueryKey === key) return false;
      return true;
    },
  }
);

export const updateUserRole = createAsyncThunk(
  'users/updateUserRole',
  async ({ id, role }, { rejectWithValue }) => {
    try {
      await adminAPI.updateUserRole(id, role);
      return { id, role };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update role.');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await adminAPI.deleteUser(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete user.');
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

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        const { payload } = action;
        state.list = payload.data ?? [];
        state.pagination = payload.pagination ?? state.pagination;
        state.lastListQueryKey = usersListQueryKey(action.meta.arg);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(updateUserRole.pending, (state) => {
        state.actionLoading = 'role';
        state.actionError = null;
      })
      .addCase(updateUserRole.fulfilled, (state, { payload }) => {
        const idx = state.list.findIndex((u) => u.id === payload.id);
        if (idx !== -1) state.list[idx] = { ...state.list[idx], role: payload.role };
        state.actionLoading = null;
        state.actionError = null;
      })
      .addCase(updateUserRole.rejected, (state, { payload }) => {
        state.actionLoading = null;
        state.actionError = payload;
      })
      .addCase(deleteUser.pending, (state, { meta }) => {
        state.actionLoading = meta.arg;
        state.actionError = null;
      })
      .addCase(deleteUser.fulfilled, (state, { payload }) => {
        state.list = state.list.filter((u) => u.id !== payload);
        state.actionLoading = null;
        state.actionError = null;
      })
      .addCase(deleteUser.rejected, (state, { payload }) => {
        state.actionLoading = null;
        state.actionError = payload;
      })
      .addCase(logout.fulfilled, () => ({ ...initialState }));
  },
});

export const { clearUsersError } = usersSlice.actions;
export const selectUsersList = (state) => state.users.list;
export const selectUsersPagination = (state) => state.users.pagination;
export const selectUsersLoading = (state) => state.users.isLoading;
export const selectUsersError = (state) => state.users.error;
export const selectUsersActionLoading = (state) => state.users.actionLoading;
export const selectUsersActionError = (state) => state.users.actionError;
export default usersSlice.reducer;
