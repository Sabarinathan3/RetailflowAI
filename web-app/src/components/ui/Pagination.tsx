import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const delta = 1;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-[var(--text-muted)]">
            ···
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(p)}
            className="min-w-[32px]"
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
