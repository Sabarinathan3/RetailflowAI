import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#3B82F6] text-white hover:bg-blue-500 shadow-sm hover:shadow-md active:scale-[0.98]',
  secondary:
    'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] shadow-sm active:scale-[0.98]',
  ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] active:bg-[var(--bg-secondary)]',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-[0.98]',
  outline:
    'bg-transparent border border-[#3B82F6] text-[#3B82F6] hover:bg-blue-900/20 active:scale-[0.98]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-2',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-[15px] gap-2.5',
  icon: 'p-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

