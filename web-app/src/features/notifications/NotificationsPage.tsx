import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Bell, Check, Trash2, ShoppingCart, Package, CreditCard, 
  Settings, AlertTriangle, Info, CheckCircle, Tag 
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { notificationsApi } from '@/api/notifications.api';
import { formatRelativeTime } from '@/utils/format';
import type { Notification } from '@/types/notification.types';
import type { PaginationMeta } from '@/types/api.types';
import { cn } from '@/utils/cn';
import { useNotificationStore } from '@/store/notification.store';

type CategoryFilter = 'ALL' | 'sales' | 'inventory' | 'credit' | 'system';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');

  const { fetchUnreadCount, decrementUnread, clearUnread } = useNotificationStore();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getNotifications({ page, limit: 20 });
      if (res.success) {
        setNotifications(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch { 
      toast.error('Failed to load notifications'); 
    } finally { 
      setLoading(false); 
    }
  }, [page]);

  useEffect(() => { 
    loadNotifications(); 
    // Polling is handled centrally by the Sidebar for count, but we can also poll the list if needed
    const interval = setInterval(loadNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string, currentIsRead: boolean) => {
    if (currentIsRead) return;
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      decrementUnread();
    } catch { 
      toast.error('Failed to update notification'); 
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      clearUnread();
      toast.success('All notifications marked as read');
    } catch { 
      toast.error('Failed to update notifications'); 
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => {
        const notif = prev.find(n => n.id === id);
        if (notif && !notif.isRead) decrementUnread();
        return prev.filter(n => n.id !== id);
      });
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = useMemo(() => {
    if (categoryFilter === 'ALL') return notifications;
    return notifications.filter(n => n.category === categoryFilter);
  }, [notifications, categoryFilter]);

  const getIcon = (category: string, type: string) => {
    if (type === 'LOW_STOCK' || type === 'OUT_OF_STOCK') return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    if (type === 'SALE_COMPLETED') return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    if (type === 'BILLING_FAILURE') return <AlertTriangle className="h-5 w-5 text-rose-500" />;
    if (type === 'OVERDUE_PAYMENT' || type === 'DUE_REMINDER') return <CreditCard className="h-5 w-5 text-rose-500" />;
    if (type === 'DAILY_SUMMARY') return <ShoppingBag className="h-5 w-5 text-blue-500" />;
    if (type === 'PURCHASE_ORDER' || type === 'INVENTORY_UPDATE') return <Package className="h-5 w-5 text-purple-500" />;
    
    switch (category) {
      case 'sales': return <ShoppingCart className="h-5 w-5 text-blue-500" />;
      case 'inventory': return <Package className="h-5 w-5 text-purple-500" />;
      case 'credit': return <CreditCard className="h-5 w-5 text-rose-500" />;
      default: return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'LOW': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'CRITICAL': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const categories = [
    { id: 'ALL', label: 'All' },
    { id: 'sales', label: 'Sales' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'credit', label: 'Credit' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <PageHeader 
        title="Notifications Center" 
        subtitle="Real-time business alerts and updates"
        action={
          <Button 
            variant="outline" 
            icon={<Check className="h-4 w-4" />} 
            onClick={handleMarkAllRead}
            disabled={notifications.every(n => n.isRead)}
          >
            Mark all read
          </Button>
        } 
      />

      {/* Categories Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar mb-4">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={categoryFilter === cat.id ? 'primary' : 'secondary'}
            className="rounded-full px-5 whitespace-nowrap"
            onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-12 flex justify-center">
            <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16">
            <EmptyState 
              icon={<Bell className="h-12 w-12 opacity-50" />} 
              title="You're all caught up!" 
              description="No new notifications at the moment." 
            />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notif) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={notif.id} 
                  className={cn(
                    "group p-5 flex gap-4 transition-all hover:bg-[var(--bg-secondary)] cursor-default",
                    !notif.isRead && "bg-primary-500/5 hover:bg-primary-500/10"
                  )}
                  onClick={() => handleMarkAsRead(notif.id, notif.isRead)}
                >
                  {/* Icon & Unread Indicator */}
                  <div className="relative pt-1 flex-shrink-0">
                    {!notif.isRead && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                      </span>
                    )}
                    <div className="h-10 w-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center shadow-sm">
                      {getIcon(notif.category, notif.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={cn(
                          "text-[15px] font-semibold mb-1",
                          notif.isRead ? "text-[var(--text-primary)]" : "text-primary-700 dark:text-primary-400"
                        )}>
                          {notif.title}
                        </h4>
                        <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      
                      {/* Priority Badge */}
                      <div className={cn(
                        "px-2.5 py-1 text-[10px] font-bold rounded-full tracking-wider uppercase flex-shrink-0",
                        getPriorityColor(notif.priority)
                      )}>
                        {notif.priority}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[12px] font-medium text-[var(--text-muted)]">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                      
                      {/* Actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        {!notif.isRead && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs font-semibold text-primary-600 hover:text-primary-700"
                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id, notif.isRead); }}
                          >
                            Mark as read
                          </Button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                          className="h-8 w-8 rounded flex items-center justify-center text-[var(--text-muted)] hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-center">
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

// Temporary icon for ShoppingBag since we missed importing it at the top
function ShoppingBag(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
