import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  selectIsAuthenticated,
  selectIsSuperAdmin,
  selectAuthHydrated,
} from '../features/auth/authSlice';

function AuthRouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-surface">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-accent" />
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center bg-surface gap-3 p-6 text-center">
      <h2 className="text-xl font-semibold text-white">Access Denied</h2>
      <p className="text-sm text-white/60">This area is restricted to super admins only.</p>
      <a href="/admin/login" className="mt-2 text-sm text-accent underline">Back to login</a>
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
    return <AccessDenied />;
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
