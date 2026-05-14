import { type LucideIcon } from 'lucide-react';

interface CardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function Card({ icon: Icon, title, description }: CardProps) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-color)] flex h-full flex-col justify-between transition-all duration-200 hover:border-[#3B82F6]">
      <div>
        <div className="h-10 w-10 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[#22D3EE] flex items-center justify-center mb-4">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
