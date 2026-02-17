export function Card({ children, className = '', padding = true, ...rest }) {
  return (
    <div
      className={`bg-surface-soft rounded-2xl border-2 border-accent sm:border sm:border-white/5 overflow-hidden transition-shadow duration-200 hover:shadow-[var(--shadow-card)] ${padding ? 'p-4 sm:p-5' : ''} ${className}`}
      style={{ boxShadow: 'var(--shadow-soft)' }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-2 ${className}`}>
      <div>
        {title && <h2 className="text-lg font-semibold text-text-primary tracking-tight">{title}</h2>}
        {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
