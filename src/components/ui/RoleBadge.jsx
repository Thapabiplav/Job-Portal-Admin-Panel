import { User, Building2, Shield } from 'lucide-react';

const roleConfig = {
  candidate: {
    label: 'Candidate',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Icon: User,
  },
  employer: {
    label: 'Employer',
    className: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    Icon: Building2,
  },
  superadmin: {
    label: 'Super Admin',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Icon: Shield,
  },
};

export function RoleBadge({ role, className = '' }) {
  const config = roleConfig[role?.toLowerCase()] || {
    label: role || '—',
    className: 'bg-white/10 text-text-secondary border-white/10',
    Icon: null,
  };
  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {config.label}
    </span>
  );
}
