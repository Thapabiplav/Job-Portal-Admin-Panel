import { useState, useRef, useCallback, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { logout } from '../features/auth/authSlice';
import { AppHeader } from '../components/layouts/AppHeader';
import { Sidebar } from '../components/navigation/Sidebar';
import { BottomNav } from '../components/navigation/BottomNav';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/users', label: 'Users', icon: 'users' },
  { to: '/admin/jobs', label: 'Jobs', icon: 'jobs' },
  { to: '/admin/companies', label: 'Approve Companies', icon: 'companies' },
];

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
    <div className="h-screen bg-surface flex flex-col overflow-hidden">
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
        <main ref={mainRef} className="flex-1 min-w-0 overflow-auto focus:outline-none">
          <div className="p-4 sm:p-6 lg:p-8 min-h-full">
            <Outlet />
          </div>
          <div className="h-16 sm:h-0" aria-hidden />
        </main>
      </div>
      <BottomNav navItems={navItems} onViewSite={handleViewSite} onLogout={handleLogout} visible={bottomNavVisible} />
    </div>
  );
}
