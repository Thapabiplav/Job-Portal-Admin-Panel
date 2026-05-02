import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectIsSuperAdmin,
  selectAuthHydrated,
} from '../features/auth/authSlice';

const JOB_PORTAL_DASHBOARD = '/job-portal/dashboard';

function AuthRouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-accent" />
    </div>
  );
}

export function ProtectedRoute({ children, requireSuperAdmin = false }) {
  const authHydrated = useSelector(selectAuthHydrated);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isSuperAdmin = useSelector(selectIsSuperAdmin);
  const location = useLocation();

  if (!authHydrated) {
    return <AuthRouteFallback />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to={JOB_PORTAL_DASHBOARD} replace />;
  }
  return children;
}

export function GuestOnlyRoute({ children }) {
  const authHydrated = useSelector(selectAuthHydrated);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/admin/dashboard';

  if (!authHydrated) {
    return <AuthRouteFallback />;
  }
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }
  return children;
}
