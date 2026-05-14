import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard, Package, Receipt, Warehouse, Users, CreditCard,
  Truck, Bell, Settings, ChevronLeft, Sparkles, ShieldCheck,
} from 'lucide-react';
import type { Role } from '@/types/enums';
import { useEffect } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: Role[];
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Products', path: '/products', icon: <Package className="h-5 w-5" /> },
  { label: 'Billing', path: '/billing', icon: <Receipt className="h-5 w-5" /> },
  { label: 'POS', path: '/pos', icon: <Sparkles className="h-5 w-5" />, badge: 'New' },
  { label: 'Inventory', path: '/inventory', icon: <Warehouse className="h-5 w-5" /> },
  { label: 'Customers', path: '/customers', icon: <Users className="h-5 w-5" /> },
  { label: 'Credit Ledger', path: '/credit', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Suppliers', path: '/suppliers', icon: <Truck className="h-5 w-5" />, roles: ['OWNER', 'MANAGER'] },
  { label: 'Purchase Orders', path: '/purchase-orders', icon: <Package className="h-5 w-5" />, roles: ['OWNER', 'MANAGER'] },
  { label: 'Notifications', path: '/notifications', icon: <Bell className="h-5 w-5" /> },
  { label: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" />, roles: ['OWNER', 'ADMIN'] },
  { label: 'Admin', path: '/admin', icon: <ShieldCheck className="h-5 w-5" />, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  const filteredItems = navItems.map((item) => {
    if (item.label === 'Notifications') {
      return { ...item, badge: unreadCount > 0 ? unreadCount.toString() : undefined };
    }
    return item;
  }).filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 lg:z-30 flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-card)] transition-all duration-300',
          sidebarCollapsed ? 'w-[72px]' : 'w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 border-b border-[var(--border-color)] px-6', sidebarCollapsed && 'justify-center px-0')}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-bold text-[var(--text-primary)] text-[17px] tracking-tight">
                RetailFlow
              </motion.span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <NavLink
                key={item.path} to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-semibold transition-all duration-300',
                  isActive
                    ? 'bg-blue-900/20 text-[#3B82F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_12px_rgba(59,130,246,0.25)] border border-blue-500/20'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-transparent',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <span className={cn('flex-shrink-0 transition-colors', isActive ? 'text-[#3B82F6]' : 'text-[var(--text-secondary)]')}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="flex-1">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#3B82F6] text-white rounded-md tracking-wider uppercase">{item.badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex border-t border-[var(--border-color)] p-4">
          <button
            onClick={toggleSidebarCollapsed}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

