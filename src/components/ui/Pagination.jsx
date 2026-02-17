import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const PER_PAGE_OPTIONS = [10, 20, 50];

function pageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages]);
  for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
    pages.add(i);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

function withEllipsis(pages) {
  const out = [];
  let prev = 0;
  for (const p of pages) {
    if (p > prev + 1) out.push('ellipsis');
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  totalItems,
}) {
  const total = totalItems ?? 0;
  const showBar = totalPages >= 1 || total > 0;
  if (!showBar) return null;

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;
  const start = total > 0 ? (currentPage - 1) * (itemsPerPage || 10) + 1 : 0;
  const end = total > 0 ? Math.min(currentPage * (itemsPerPage || 10), total) : 0;
  const pages = withEllipsis(pageNumbers(currentPage, totalPages));

  const btnClass =
    'min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border text-sm font-medium transition-ui';
  const btnBase = `${btnClass} border-white/10 bg-input text-text-primary hover:bg-hover hover:border-accent/30`;
  const btnActive = `${btnClass} border-accent bg-primary/20 text-accent shadow-[var(--shadow-glow)]`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-white/5 bg-surface-soft/50 rounded-b-2xl">
      <div className="flex items-center gap-3">
        <label className="text-sm text-text-secondary whitespace-nowrap">Rows per page</label>
        <div className="relative">
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
            className="appearance-none min-h-[38px] pl-3 pr-8 rounded-lg border border-white/10 bg-input text-text-primary text-sm font-medium focus:ring-2 focus:ring-accent focus:border-accent outline-none cursor-pointer"
            aria-label="Items per page"
          >
            {PER_PAGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
        {total > 0 && (
          <span className="text-sm text-text-muted hidden sm:inline">
            Showing {start}–{end} of {total}
          </span>
        )}
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={prevDisabled}
          className={`${btnBase} disabled:opacity-50 disabled:pointer-events-none`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e-${i}`} className="min-w-[38px] flex justify-center text-text-muted">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={currentPage === p ? btnActive : btnBase}
                aria-label={currentPage === p ? `Page ${p} (current)` : `Page ${p}`}
                aria-current={currentPage === p ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={nextDisabled}
          className={`${btnBase} disabled:opacity-50 disabled:pointer-events-none`}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </nav>
    </div>
  );
}
