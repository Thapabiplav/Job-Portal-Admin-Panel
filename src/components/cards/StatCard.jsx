export function StatCard({ title, value, subtitle, icon, trend, compact, className = '' }) {
  const pad = compact ? 'p-2.5 sm:p-4 lg:p-5' : 'p-3.5 sm:p-5 lg:p-6';
  const rounded = compact ? 'rounded-xl sm:rounded-2xl' : 'rounded-2xl';
  const iconWrap = compact
    ? 'h-9 w-9 sm:h-11 sm:w-11 rounded-[10px] sm:rounded-xl'
    : 'h-11 w-11 sm:h-12 sm:w-12 rounded-xl sm:rounded-[14px]';

  return (
    <div
      className={`
        group relative overflow-hidden
        bg-linear-to-br         from-white/[0.07] via-surface-soft to-[#0c0c10]
        ${rounded}
        border border-white/9
        shadow-(--shadow-soft)
        ring-1 ring-inset ring-white/4
        ${pad}
        transition-all duration-300 ease-out
        hover:border-accent/22
        hover:shadow-[0_10px_40px_rgba(0,0,0,0.42),0_0_0_1px_rgba(251,146,60,0.06)]
        hover:-translate-y-px
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      <div
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-accent/45 to-transparent opacity-80 sm:inset-x-4"
        aria-hidden
      />
      <div
        className={`relative flex flex-row items-center justify-between gap-2 sm:gap-3 ${compact ? 'min-h-14 sm:min-h-0' : 'min-h-16 sm:min-h-0'}`}
      >
        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-medium text-text-secondary ${compact ? 'text-[10px] uppercase tracking-wide sm:normal-case sm:tracking-normal sm:text-sm' : 'text-xs sm:text-sm'}`}
          >
            {title}
          </p>
          <p
            className={`font-bold tracking-tight tabular-nums leading-none text-text-primary ${compact ? 'mt-1 text-lg sm:mt-1.5 sm:text-2xl sm:leading-tight' : 'mt-1.5 text-2xl sm:text-3xl sm:leading-none'}`}
          >
            {value}
          </p>
          {(subtitle || trend) && (
            <p className="mt-1.5 text-[11px] leading-snug text-text-muted line-clamp-2 sm:text-xs">
              {subtitle || trend}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`
              shrink-0 ${iconWrap}
              flex items-center justify-center
              bg-linear-to-br from-accent/22 via-primary/12 to-primary/5
              border border-accent/25 shadow-inner shadow-black/40
              text-accent
              transition-colors duration-300
              group-hover:border-accent/40 group-hover:from-accent/30 group-hover:via-primary/18
              [&_svg]:shrink-0
              ${compact ? '[&_svg]:h-[0.95rem] [&_svg]:w-[0.95rem] sm:[&_svg]:h-[1.15rem] sm:[&_svg]:w-[1.15rem]' : '[&_svg]:h-[1.1rem] [&_svg]:w-[1.1rem] sm:[&_svg]:h-6 sm:[&_svg]:w-6'}
            `.trim().replace(/\s+/g, ' ')}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
