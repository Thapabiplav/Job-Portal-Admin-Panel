import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsSuperAdmin } from '../features/auth/authSlice';

const JOB_PORTAL_DASHBOARD = '/job-portal/dashboard';

export function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to={JOB_PORTAL_DASHBOARD} replace />;
  }
  return children;
}

export function GuestOnlyRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/admin/dashboard';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }
  return children;
}
