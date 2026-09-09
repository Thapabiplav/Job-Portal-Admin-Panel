import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestOnlyRoute } from './ProtectedRoute';

const LoginPage = lazy(() => import('../pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
const JobsPage = lazy(() => import('../pages/admin/JobsPage'));
const CompaniesPage = lazy(() => import('../pages/admin/CompaniesPage'));
const OrdersPage = lazy(() => import('../pages/admin/OrdersPage'));
const ServicesPage = lazy(() => import("../pages/admin/ServicesPage"));
const ProductQuotaRequestsPage = lazy(() => import("../pages/admin/ProductQuotaRequestsPage"));
const ServiceQuotaRequestsPage = lazy(() => import("../pages/admin/ServiceQuotaRequestsPage"));
const FeaturedMarketplaceProductsPage = lazy(() => import("../pages/admin/FeaturedMarketplaceProductsPage"));
const CandidateVerificationPage = lazy(() => import('../pages/CandidateVerification'));
const AdminLayout = lazy(() => import('../layouts/AdminLayout'));

function PageFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-slate-600" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/admin/login" element={
          <GuestOnlyRoute>
            <LoginPage />
          </GuestOnlyRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requireSuperAdmin>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="featured-products" element={<FeaturedMarketplaceProductsPage />} />
          <Route path="quota-requests/products" element={<ProductQuotaRequestsPage />} />
          <Route path="quota-requests/services" element={<ServiceQuotaRequestsPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="candidate-verifications" element={<CandidateVerificationPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </Suspense>
  );
}
