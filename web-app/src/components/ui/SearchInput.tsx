import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SearchInputProps {
  value?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({ value: externalValue, onSearch, placeholder = 'Search...', debounceMs = 300, className }: SearchInputProps) {
  const [value, setValue] = useState(externalValue || '');

  useEffect(() => {
    if (externalValue !== undefined) setValue(externalValue);
  }, [externalValue]);

  const debouncedSearch = useCallback((() => {
    let timer: ReturnType<typeof setTimeout>;
    return (val: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => onSearch(val), debounceMs);
    };
  })(), [onSearch, debounceMs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    debouncedSearch(val);
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
      <input type="text" value={value} onChange={handleChange} placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] pl-10 pr-9 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all" />
      {value && (
        <button onClick={() => { setValue(''); onSearch(''); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
