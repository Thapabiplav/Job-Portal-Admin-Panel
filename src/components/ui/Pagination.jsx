import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const PER_PAGE_OPTIONS = [10, 20, 50];

function pageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages]);
  for (
    let i = Math.max(1, currentPage - 1);
    i <= Math.min(totalPages, currentPage + 1);
    i++
  ) {
    pages.add(i);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

function withEllipsis(pages) {
  const out = [];
  let prev = 0;
  for (const p of pages) {
    if (p > prev + 1) out.push("ellipsis");
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
  const end =
    total > 0 ? Math.min(currentPage * (itemsPerPage || 10), total) : 0;
  const pages = withEllipsis(pageNumbers(currentPage, totalPages));

  const btnClass =
    "min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg border text-sm font-medium transition-ui";
  const btnBase = `${btnClass} border-white/10 bg-input text-text-primary hover:bg-hover hover:border-accent/30`;
  const btnActive = `${btnClass} border-accent bg-primary/20 text-accent shadow-[var(--shadow-glow)]`;

  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 border-t border-white/5 bg-surface-soft/50 rounded-b-2xl">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-nowrap items-center gap-2">
          <label className="shrink-0 text-xs text-text-secondary whitespace-nowrap sm:text-sm">
            Rows per page
          </label>
          <div className="relative shrink-0">
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
              className="appearance-none min-h-9 min-w-13 pl-2.5 pr-7 text-xs font-medium sm:min-h-[38px] sm:min-w-0 sm:pl-3 sm:pr-8 sm:text-sm rounded-lg border border-white/10 bg-input text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none cursor-pointer"
              aria-label="Items per page"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted pointer-events-none sm:right-2 sm:h-4 sm:w-4" />
          </div>
        </div>
        {total > 0 && (
          <span className="shrink-0 whitespace-nowrap text-right text-xs text-text-muted tabular-nums sm:text-sm">
            <span className="hidden sm:inline">Showing </span>
            {start}–{end} of {total}
          </span>
        )}
      </div>

      <nav className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={prevDisabled}
          className={`${btnBase} disabled:opacity-50 disabled:pointer-events-none`}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5 px-0.5">
          {pages.map((p, i) =>
            p === "ellipsis" ? (
              <span
                key={`e-${i}`}
                className="min-w-[38px] flex justify-center text-text-muted"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={currentPage === p ? btnActive : btnBase}
                aria-label={
                  currentPage === p ? `Page ${p} (current)` : `Page ${p}`
                }
                aria-current={currentPage === p ? "page" : undefined}
              >
                {p}
              </button>
            ),
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
