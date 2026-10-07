import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../api/axios';
import { logout } from '../auth/authSlice';

function emptyBucket() {
  return {
    list: [],
    pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 },
    isLoading: false,
    error: null,
  };
}

export const fetchAppDownloads = createAsyncThunk(
  'appDownloads/fetch',
  async (params, { rejectWithValue }) => {
    try {
      const res = await adminAPI.getAppDownloads(params);
      return {
        audience: params.audience,
        data: res.data?.data ?? [],
        pagination: res.data?.pagination ?? {},
      };
    } catch (err) {
      return rejectWithValue({
        audience: params.audience,
        message: err.response?.data?.message || 'Failed to load phone numbers.',
      });
    }
  }
);

const initialState = {
  passenger: emptyBucket(),
  driver: emptyBucket(),
};

const appDownloadsSlice = createSlice({
  name: 'appDownloads',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAppDownloads.pending, (state, action) => {
        const audience = action.meta.arg?.audience;
        if (!state[audience]) return;
        state[audience].isLoading = true;
        state[audience].error = null;
      })
      .addCase(fetchAppDownloads.fulfilled, (state, action) => {
        const { audience, data, pagination } = action.payload;
        if (!state[audience]) return;
        state[audience].list = data ?? [];
        state[audience].pagination = {
          ...state[audience].pagination,
          ...pagination,
        };
        state[audience].isLoading = false;
        state[audience].error = null;
      })
      .addCase(fetchAppDownloads.rejected, (state, action) => {
        const audience = action.payload?.audience || action.meta.arg?.audience;
        if (!state[audience]) return;
        state[audience].isLoading = false;
        state[audience].error = action.payload?.message || 'Failed to load phone numbers.';
      })
      .addCase(logout.fulfilled, () => ({
        passenger: emptyBucket(),
        driver: emptyBucket(),
      }));
  },
});

export const selectAppDownloadBucket = (audience) => (state) => state.appDownloads[audience];
export default appDownloadsSlice.reducer;
