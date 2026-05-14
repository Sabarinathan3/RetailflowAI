import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
  primary: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  success: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  danger: 'bg-red-500/10 text-red-400',
  info: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  outline: 'border border-[var(--border-color)] text-[var(--text-secondary)]',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#9CA3AF]',
  primary: 'bg-[#3B82F6]',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-[#3B82F6]',
  outline: 'bg-[#9CA3AF]',
};

export function Badge({ children, variant = 'default', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

