import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({ children, className, hover = false, glass = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--border-color)] relative overflow-hidden',
        glass ? 'glass' : 'bg-[var(--bg-card)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
        paddingClasses[padding],
        hover 
          ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-500/50' 
          : 'shadow-sm transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="space-y-1">
        <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)]">{title}</h3>
        {subtitle && (
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

