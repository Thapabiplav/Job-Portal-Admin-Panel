import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Building2, UserCheck, ShoppingBag } from 'lucide-react';

const iconMap = {
  dashboard: LayoutDashboard,
  users: Users,
  jobs: Briefcase,
  companies: Building2,
  candidateVerification: UserCheck,
  orders: ShoppingBag,
  services: Briefcase,
};

export function BottomNav({ navItems, visible = true }) {
  const linkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] min-h-[56px] rounded-xl touch-manipulation transition-ui ${
      isActive ? 'text-accent bg-primary/15' : 'text-text-secondary'
    }`;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-16 px-2 bg-surface-soft border-t border-white/5 shadow-[var(--shadow-card)] sm:hidden transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      role="navigation"
      aria-label="Bottom navigation"
    >
      {navItems.map((item) => {
        const Icon = iconMap[item.icon];
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={linkClass}
            end={item.to === '/admin/dashboard'}
          >
            {Icon ? <Icon className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> : null}
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
