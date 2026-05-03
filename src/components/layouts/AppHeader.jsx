import { Menu } from 'lucide-react';

export function AppHeader({ onMenuClick }) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-14 sm:h-16 px-4 bg-surface-soft border-b border-white/5 transition-shadow"
      style={{ boxShadow: 'var(--shadow-soft)' }}
      role="banner"
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-xl text-text-secondary hover:bg-hover focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface-soft lg:hidden transition-ui min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      <h1 className="text-lg sm:text-xl font-semibold text-text-primary truncate tracking-tight">
        Sindhuli Bazar  Admin Panel
      </h1>
      <div className="w-10 lg:hidden" aria-hidden />
    </header>
  );
}
