import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../api/axios';

export const fetchStats = createAsyncThunk(
  'stats/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await adminAPI.getStats();
      return res.data?.stats ?? res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load stats.');
    }
  }
);

const initialState = {
  data: null,
  isLoading: false,
  error: null,
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    clearStatsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStats.fulfilled, (state, { payload }) => {
        state.data = payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchStats.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      });
  },
});

export const { clearStatsError } = statsSlice.actions;
export const selectStats = (state) => state.stats.data;
export const selectStatsLoading = (state) => state.stats.isLoading;
export const selectStatsError = (state) => state.stats.error;
export default statsSlice.reducer;
