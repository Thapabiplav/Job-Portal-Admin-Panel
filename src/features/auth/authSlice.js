import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../api/axios';
import {
  clearAllTokens,
  setAccessToken,
  setSessionProbe,
  getAccessToken,
  hasSessionProbe,
  clearLegacyAuthStorage,
} from '../../utils/authStore';

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await authAPI.login(credentials);
      const { user } = res.data;
      const accessToken = res.data?.access_token || res.data?.accessToken || null;
      if (accessToken) setAccessToken(accessToken);
      setSessionProbe();
      return user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed.');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authAPI.logout();
  } catch {
    // ignore — still clear client state
  } finally {
    clearAllTokens();
  }
  return null;
});

/** Pass `{ force: true }` to call `/auth/me` even if user is already in state. */
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_arg, { rejectWithValue }) => {
    if (!getAccessToken()) {
      return null;
    }
    try {
      const res = await authAPI.getMe();
      const user = res.data?.user ?? res.data;
      return user;
    } catch (err) {
      clearAllTokens();
      return rejectWithValue(err.response?.data?.message || 'Session expired.');
    }
  },
  {
    condition: (arg, { getState }) => {
      if (arg?.force) return true;
      if (!getAccessToken()) return false;
      if (getState().auth.user?.id) return false;
      if (getState().auth.sessionRestoring) return false;
      return true;
    },
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  /** True while `/auth/me` is in flight (dedupes Strict Mode / duplicate dispatches). */
  sessionRestoring: false,
  /** False until first session check finishes (avoids login flash on refresh). */
  authHydrated: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, { payload }) => {
      state.user = payload;
      state.isAuthenticated = !!payload?.id;
    },
    /** No session hint — nothing to ask the server; mark ready without calling `/auth/me`. */
    markAuthHydrated: (state) => {
      state.authHydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.isAuthenticated = true;
        state.isLoading = false;
        state.error = null;
        state.authHydrated = true;
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.sessionRestoring = false;
        state.authHydrated = true;
      })
      .addCase(fetchMe.pending, (state) => {
        state.sessionRestoring = true;
      })
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.isAuthenticated = !!payload?.id;
        state.sessionRestoring = false;
        state.authHydrated = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.sessionRestoring = false;
        state.authHydrated = true;
      });
  },
});

export const { clearError, setUser, markAuthHydrated } = authSlice.actions;

/** First load: migrate legacy storage, optional refresh (HttpOnly cookie), then /auth/me. */
export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrap',
  async (_, { dispatch }) => {
    clearLegacyAuthStorage();
    try {
      if (!hasSessionProbe() && !getAccessToken()) return;
      if (!getAccessToken()) {
        try {
          const res = await authAPI.refresh();
          const newAccess = res.data?.access_token || res.data?.accessToken || null;
          if (newAccess) setAccessToken(newAccess);
        } catch {
          clearAllTokens();
          return;
        }
      }
      if (!getAccessToken()) {
        clearAllTokens();
        return;
      }
      await dispatch(fetchMe());
    } finally {
      dispatch(markAuthHydrated());
    }
  }
);

export const selectAuthUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsSuperAdmin = (state) => state.auth.user?.role === 'superadmin';
export const selectAuthHydrated = (state) => state.auth.authHydrated;
export const selectAuthLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export default authSlice.reducer;
