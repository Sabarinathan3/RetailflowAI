import { useState, useEffect } from 'react';
import { Users, ShoppingCart, Store, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { adminApi } from '@/api/admin.api';
import type { AdminUsageAnalytics } from '@/types/admin.types';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdminUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await adminApi.getUsageAnalytics();
        setAnalytics(data);
      } catch {
        toast.error('Failed to load admin analytics');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-(--text-muted) animate-pulse">Loading analytics...</div>;
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex flex-col items-center justify-center text-center py-6">
          <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-4">
            <Store className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-3xl text-(--text-primary)">{analytics.totalShops}</h3>
          <p className="text-sm text-(--text-secondary)">Total Shops ({analytics.activeShops} Active)</p>
        </Card>
        
        <Card className="flex flex-col items-center justify-center text-center py-6">
          <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-3xl text-(--text-primary)">{analytics.totalUsers}</h3>
          <p className="text-sm text-(--text-secondary)">Platform Users</p>
        </Card>

        <Card className="flex flex-col items-center justify-center text-center py-6">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center mb-4">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-3xl text-(--text-primary)">{analytics.totalInvoices}</h3>
          <p className="text-sm text-(--text-secondary)">Total Invoices</p>
        </Card>
        
        <Card className="flex flex-col items-center justify-center text-center py-6">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center mb-4">
            <DollarSign className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-3xl text-(--text-primary)">{formatCurrency(analytics.monthlyPlatformRevenue.totalAmount)}</h3>
          <p className="text-sm text-(--text-secondary)">Monthly Platform Revenue</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-(--text-primary) mb-4">Subscription Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.subscriptionBreakdown.map(s => (
            <div key={s.plan} className="p-4 border border-(--border-color) rounded-lg text-center bg-(--bg-secondary)/30">
              <span className="block text-xs uppercase tracking-wider text-(--text-muted) font-semibold mb-1">{s.plan}</span>
              <span className="block text-2xl font-bold text-(--text-primary)">{s.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
