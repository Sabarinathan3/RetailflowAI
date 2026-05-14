import { Menu, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useBranchStore } from '@/store/branch.store';
import { ThemeToggle } from '../shared/ThemeToggle';
import { Button } from '../ui/Button';
import { getInitials } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export function Topbar() {
  const { user, logout } = useAuthStore();
  const { setSidebarOpen } = useUIStore();
  const { branches, activeBranchId, setActiveBranch, reset: resetBranch } = useBranchStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    resetBranch();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-(--border-color) bg-(--bg-card)/95 backdrop-blur-md flex items-center px-6 gap-4">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Branch selector */}
       {branches.length > 1 && (
         <div className="relative group">
           <select
             value={activeBranchId || ''}
             onChange={(e) => setActiveBranch(e.target.value)}
             className="appearance-none rounded-lg border border-(--border-color) bg-(--bg-primary) pl-3 pr-8 py-1.5 text-[13px] font-bold text-(--text-primary) focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 outline-none transition-all cursor-pointer"
           >
             {branches.map((b) => (
               <option key={b.id} value={b.id}>{b.name}</option>
             ))}
           </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-(--text-secondary)">
             <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
           </div>
         </div>
       )}

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* User menu */}
         <div className="relative" ref={menuRef}>
           <button
             onClick={() => setShowMenu(!showMenu)}
             className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-full hover:bg-(--bg-secondary) transition-all cursor-pointer group"
           >
             <div className="h-8 w-8 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
               {user ? getInitials(user.name) : '?'}
             </div>
             <div className="hidden sm:block text-left mr-1">
              <p className="text-[13px] font-bold text-(--text-primary) leading-none mb-1">{user?.name}</p>
              <p className="text-[11px] font-semibold text-(--text-secondary) leading-none capitalize">{user?.role?.toLowerCase()}</p>
             </div>
           </button>

           {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-(--border-color) bg-(--bg-card) shadow-xl py-1.5 z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-(--border-color) mb-1">
                <p className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-wider mb-0.5">Account</p>
                <p className="text-[13px] font-semibold text-(--text-primary) truncate">{user?.email}</p>
               </div>
               <button
                 onClick={() => { setShowMenu(false); navigate('/settings'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-semibold text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-secondary) transition-colors cursor-pointer"
               >
                 <User className="h-4 w-4 text-(--text-secondary)" /> Profile Settings
               </button>
               <button
                 onClick={handleLogout}
                 className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
               >
                 <LogOut className="h-4 w-4" /> Sign Out
               </button>
             </div>
           )}
         </div>
      </div>
    </header>
  );
}

