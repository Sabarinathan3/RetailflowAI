import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-bold text-[var(--text-primary)] tracking-tight"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[#3B82F6] transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border bg-[var(--bg-primary)] py-2.5 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all duration-200 outline-none',
              icon ? 'pl-11' : 'pl-4',
              'border-[var(--border-color)] focus:border-[#3B82F6] focus:ring-[3px] focus:ring-blue-500/10',
              'hover:border-[#3B82F6]',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[12px] font-medium text-red-500 mt-1">{error}</p>}
        {helperText && !error && (
          <p className="text-[12px] text-[var(--text-secondary)] mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

