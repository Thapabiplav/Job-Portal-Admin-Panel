import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Building2, UserCheck, ShoppingBag } from 'lucide-react';

/** Same horizontal inset as main `<Outlet>` wrapper in AdminLayout (`p-4` → 1rem). */
const CONTENT_GUTTER_X = 'px-4';

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
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 pointer-events-none sm:hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${CONTENT_GUTTER_X} ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <nav
        className="pointer-events-auto relative flex w-full items-end justify-around gap-x-2 rounded-2xl border border-white/10 bg-[rgba(10,10,12,0.94)] px-2 pt-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] backdrop-blur-3xl backdrop-saturate-180 shadow-[0_-8px_36px_rgba(0,0,0,0.5),0_12px_24px_rgba(0,0,0,0.35)]"
        role="navigation"
        aria-label="Bottom navigation"
      >
        <div
          className="pointer-events-none absolute inset-x-3 top-0 z-10 h-px bg-linear-to-r from-transparent via-white/14 to-transparent rounded-t-2xl"
          aria-hidden
        />
        {navItems.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin/dashboard'}
              title={item.label}
              className={({ isActive }) =>
                [
                  'relative flex min-h-[52px] min-w-0 flex-1 max-w-28 flex-col items-center justify-end gap-0.5 px-0.5 pb-1.5 pt-0.5 rounded-xl outline-none transition-colors duration-150 ease-out touch-manipulation focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
                  isActive ? 'text-accent' : 'text-text-muted',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative flex h-9 min-w-9 items-center justify-center rounded-2xl bg-transparent transition-all duration-200 ease-out">
                    {Icon ? (
                      <Icon
                        className={`h-[22px] w-[22px] shrink-0 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-[0.72]'}`}
                        strokeWidth={isActive ? 2.35 : 1.85}
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <span className="max-w-21 truncate text-center text-[10px] font-semibold leading-tight tracking-wide">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
