import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, size = 'md', scrollable = false }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-lg' : 'max-w-md';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={onClose}
    >
      <div
        className={`bg-surface-soft rounded-2xl w-full border border-white/5 transition-all duration-200 ${scrollable ? 'max-h-[90vh] flex flex-col overflow-hidden' : 'overflow-hidden'}`}
        style={{ boxShadow: 'var(--shadow-hover)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between px-4 sm:px-6 py-4 border-b border-white/5">
            <h2 id="modal-title" className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-text-secondary hover:bg-hover transition-ui min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div
          className={`px-4 sm:px-6 py-4 ${sizeClass} w-full mx-auto ${scrollable ? 'min-h-0 max-h-[85vh] overflow-y-auto' : ''}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
