import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm', message, loading, confirmLabel = 'Delete' }) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center gap-5 py-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-100">
          <AlertTriangle size={22} className="text-red-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs">{message}</p>
        </div>
        <div className="flex w-full gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant="danger" className="flex-1" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
