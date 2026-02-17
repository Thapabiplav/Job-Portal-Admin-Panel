const statusConfig = {
  accepted: { label: 'Accepted', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'Rejected', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  shortlisted: { label: 'Shortlisted', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  pending: { label: 'Pending', className: 'bg-white/10 text-text-secondary border-white/10' },
  reviewed: { label: 'Reviewed', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
};

export function ApplicationStatusBadge({ status, className = '' }) {
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
