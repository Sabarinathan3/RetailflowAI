import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'relative w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl overflow-hidden',
              sizeClasses[size]
            )}
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
                  )}
                  {description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">{description}</p>
                  )}
                </div>
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
