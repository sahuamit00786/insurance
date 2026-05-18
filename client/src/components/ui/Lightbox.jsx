import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';

export default function Lightbox({ open, onClose, src, filename, fileType }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || !src) return null;

  const isPDF = fileType?.includes('pdf');

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative z-10 flex flex-col items-center gap-3 max-w-5xl w-full px-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-white/80 text-sm truncate">{filename}</span>
          <div className="flex gap-2">
            <a
              href={src}
              download={filename}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <Download size={16} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        {isPDF ? (
          <iframe src={src} className="w-full rounded-xl" style={{ height: '80vh' }} title={filename} />
        ) : (
          <img src={src} alt={filename} className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl" />
        )}
      </div>
    </div>,
    document.body
  );
}
