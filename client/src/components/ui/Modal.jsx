import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md', footer }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`relative w-full ${sizes[size]} bg-white border border-slate-200 flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-scale-in shadow-xl rounded-t-2xl sm:rounded-xl`}
      >
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-100 shrink-0">
            <h2 id="modal-title" className="text-base font-semibold text-slate-900 pr-2">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 overscroll-contain">{children}</div>
        {footer && (
          <div className="px-4 sm:px-5 py-4 border-t border-slate-100 shrink-0 bg-slate-50/50 rounded-b-xl safe-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
