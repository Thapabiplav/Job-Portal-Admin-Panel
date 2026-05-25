import { FileText } from 'lucide-react';
import { profilePublicUrl } from '../../utils/storefrontUrl';

const DESKTOP_LINK =
  'inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-hover px-3 py-2 text-sm font-medium text-text-primary transition-ui hover:bg-white/10';

const MOBILE_LINK =
  'inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 text-sm font-semibold text-accent transition-ui hover:bg-accent/15';

function ViewLink({ href, label, icon: Icon, className }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
      {label}
    </a>
  );
}

/**
 * "View CV" always points to /:slug
 */
export function ProfileViewActions({ slug, variant = 'desktop' }) {
  const cvUrl = profilePublicUrl(slug);
  const linkClass = variant === 'mobile' ? MOBILE_LINK : DESKTOP_LINK;
  const emptyClass =
    variant === 'mobile'
      ? 'inline-flex min-h-[44px] shrink-0 items-center rounded-xl border border-white/5 bg-white/2 px-3 text-xs font-medium text-text-muted'
      : 'text-xs text-text-muted';

  return cvUrl ? (
    <ViewLink href={cvUrl} label="View CV" icon={FileText} className={linkClass} />
  ) : (
    <span className={emptyClass}>No CV</span>
  );
}
