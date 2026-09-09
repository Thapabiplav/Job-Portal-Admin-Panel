import { useState, useRef, useCallback, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { logout } from '../features/auth/authSlice';
import { fetchStats } from '../features/stats/statsSlice';
import { AppHeader } from '../components/layouts/AppHeader';
import { Sidebar } from '../components/navigation/Sidebar';
import { BottomNav } from '../components/navigation/BottomNav';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/jobs', label: 'Jobs', icon: 'jobs' },
  { to: '/admin/orders', label: 'Orders', icon: 'orders' },
  { to: "/admin/services", label: "Services", icon: "services" },
  {
    to: '/admin/featured-products',
    label: 'Featured Products',
    icon: 'featured',
  },
  { to: '/admin/companies', label: 'Approve Companies', icon: 'companies' },
  {
    to: '/admin/candidate-verifications',
    label: 'Approve Candidate',
    icon: 'candidateVerification',
  },
  { type: "section", label: "Listing quota requests" },
  {
    to: "/admin/quota-requests/products",
    label: "Product quota requests",
    icon: "quota",
  },
  {
    to: "/admin/quota-requests/services",
    label: "Service quota requests",
    icon: "quota",
  },
];

/** Shown in mobile bottom bar only; full list stays in the sidebar. */
const BOTTOM_NAV_ORDER = [
  '/admin/dashboard',
  '/admin/companies',
  '/admin/candidate-verifications',
  '/admin/orders',
];
const bottomNavItems = BOTTOM_NAV_ORDER.map((to) =>
  navItems.find((item) => item.to === to)
).filter(Boolean);

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomNavVisible, setBottomNavVisible] = useState(true);
  const mainRef = useRef(null);
  const lastScrollTop = useRef(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onMainScroll = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    const st = el.scrollTop;
    if (st <= 0) {
      setBottomNavVisible(true);
    } else if (st > lastScrollTop.current) {
      setBottomNavVisible(false);
    } else {
      setBottomNavVisible(true);
    }
    lastScrollTop.current = st;
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.addEventListener('scroll', onMainScroll, { passive: true });
    return () => el.removeEventListener('scroll', onMainScroll);
  }, [onMainScroll]);

  useEffect(() => {
    dispatch(fetchStats());
  }, [dispatch]);

  const handleViewSite = () => {
    const base = import.meta.env.VITE_CLIENT_URL || window.location.origin;
    window.open(base.replace(/\/admin.*$/, '') || base, '_blank');
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-0 h-screen max-h-screen flex-col overflow-hidden bg-surface">
      <header className="shrink-0 sticky top-0 z-30">
        <AppHeader onMenuClick={() => setSidebarOpen((o) => !o)} />
      </header>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          navItems={navItems}
          onViewSite={handleViewSite}
          onLogout={handleLogout}
        />
        <main
          ref={mainRef}
          className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden admin-scroll focus:outline-none"
        >
          <div className="p-4 sm:p-6 lg:p-8 min-h-0">
            <Outlet />
          </div>
          <div
            className="min-h-[calc(4.9rem+env(safe-area-inset-bottom,0px))] sm:min-h-0 sm:h-0"
            aria-hidden
          />
        </main>
      </div>
      <BottomNav navItems={bottomNavItems} visible={bottomNavVisible} />
    </div>
  );
}
