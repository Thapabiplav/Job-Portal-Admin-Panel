import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import usersReducer from '../features/users/usersSlice';
import jobsReducer from '../features/jobs/jobsSlice';
import companiesReducer from '../features/companies/companiesSlice';
import statsReducer from '../features/stats/statsSlice';
import candidateVerificationsReducer from '../features/candidateVerifications/candidateVerificationsSlice';
import adminOrdersReducer from '../features/adminOrders/adminOrdersSlice';
import serviceBookingsReducer from '../features/serviceBookings/serviceBookingsSlice';
import appDownloadsReducer from '../features/appDownloads/appDownloadsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    jobs: jobsReducer,
    companies: companiesReducer,
    stats: statsReducer,
    candidateVerifications: candidateVerificationsReducer,
    adminOrders: adminOrdersReducer,
    serviceBookings: serviceBookingsReducer,
    appDownloads: appDownloadsReducer,
  },
});
