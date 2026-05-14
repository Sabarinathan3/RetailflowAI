import { cn } from '@/utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10', className)}>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] tracking-tight leading-none">{title}</h1>
        {subtitle && <p className="text-lg text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-3 pb-0.5">{action}</div>}
    </div>
  );
}

