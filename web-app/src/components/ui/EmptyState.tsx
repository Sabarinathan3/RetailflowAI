import { PackageOpen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-muted)] mb-4">
        {icon || <PackageOpen className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-secondary)] text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
