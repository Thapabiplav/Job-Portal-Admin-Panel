export function StatCard({ title, value, subtitle, icon, trend }) {
  return (
    <div
      className="bg-surface-soft rounded-xl sm:rounded-2xl border-2 border-accent sm:border sm:border-white/5 p-2 sm:p-4 lg:p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-card)]"
      style={{ boxShadow: 'var(--shadow-soft)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-sm font-medium text-text-secondary truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-text-primary mt-0.5 sm:mt-1 tracking-tight">{value}</p>
          {(subtitle || trend) && (
            <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none">{subtitle || trend}</p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-accent self-start sm:self-auto">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
