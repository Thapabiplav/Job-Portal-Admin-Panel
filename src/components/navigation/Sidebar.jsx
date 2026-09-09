import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  UserCheck,
  ShoppingBag,
  ClipboardList,
  ExternalLink,
  LogOut,
  X,
  Star,
} from 'lucide-react';

const iconMap = {
  dashboard: LayoutDashboard,
  users: Users,
  jobs: Briefcase,
  companies: Building2,
  candidateVerification: UserCheck,
  orders: ShoppingBag,
  services: Briefcase,
  quota: ClipboardList,
  featured: Star,
};

export function Sidebar({ open, onClose, navItems, onViewSite, onLogout }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-ui min-h-[44px] touch-manipulation ${
      isActive
        ? 'bg-primary/15 text-accent border border-primary/20'
        : 'text-text-secondary hover:bg-hover hover:text-text-primary border border-transparent'
    }`;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-surface-soft border-r border-white/5 shadow-[var(--shadow-card)] transform transition-transform duration-200 ease-out lg:translate-x-0 lg:sticky lg:top-0 lg:shrink-0 lg:h-full lg:min-h-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full min-h-0 py-4">
          <div className="flex items-center justify-between px-4 mb-4 lg:hidden">
            <span className="font-semibold text-text-primary">Menu</span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-text-secondary hover:bg-hover min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 min-h-0 px-3 space-y-1 overflow-y-auto overflow-x-hidden admin-scroll">
            {navItems.map((item) => {
              if (item.type === "section") {
                return (
                  <div
                    key={`section-${item.label}`}
                    className="px-4 pt-2 pb-1 text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-text-muted"
                  >
                    {item.label}
                  </div>
                );
              }
              const Icon = iconMap[item.icon];
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={linkClass}
                  onClick={() => onClose()}
                  end={item.to === '/admin/dashboard'}
                >
                  {Icon ? <Icon className="w-5 h-5 shrink-0" /> : null}
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <div className="pt-2 mt-2 border-t border-white/5">
              <a
                href="#view-site"
                onClick={(e) => { e.preventDefault(); onViewSite(); }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-secondary hover:bg-hover hover:text-text-primary font-medium min-h-[44px] transition-ui"
              >
                <ExternalLink className="w-5 h-5 shrink-0" />
                View Site
              </a>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left text-red-400 hover:bg-red-500/10 font-medium min-h-[44px] transition-ui"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Logout
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
