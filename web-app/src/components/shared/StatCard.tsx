import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: 'primary' | 'emerald' | 'amber' | 'rose';
  className?: string;
}

const colorMap = {
  primary: { bg: 'bg-[#3B82F6]/10', icon: 'text-[#3B82F6]' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/10', icon: 'text-amber-400' },
  rose: { bg: 'bg-red-500/10', icon: 'text-red-400' },
};

export function StatCard({ title, value, icon, trend, color = 'primary', className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#3B82F6]', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={cn('text-sm font-bold', trend.value >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm font-medium text-[var(--text-secondary)]">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-lg flex-shrink-0', c.bg)}>
          <div className={cn('h-5 w-5', c.icon)}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

