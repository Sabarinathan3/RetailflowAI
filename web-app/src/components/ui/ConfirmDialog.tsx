import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" showClose={false}>
      <div className="text-center py-2">
        <div
          className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            variant === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
          }`}
        >
          <AlertTriangle
            className={`h-6 w-6 ${variant === 'danger' ? 'text-red-500' : 'text-amber-500'}`}
          />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{description}</p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
