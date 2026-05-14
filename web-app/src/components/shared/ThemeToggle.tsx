import { Sun, Moon } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { Button } from '../ui/Button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore();
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
