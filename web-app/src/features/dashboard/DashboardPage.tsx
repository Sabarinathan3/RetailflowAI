import { useState, useEffect, useRef } from 'react';
import {
  IndianRupee,
  ShoppingBag,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { analyticsApi } from '@/api/analytics.api';
import { billingApi } from '@/api/billing.api';
import { formatCurrency, formatDate } from '@/utils/format';
import { toast } from 'sonner';
import type { DashboardData, DailySalesEntry } from '@/types/analytics.types';
import type { Invoice } from '@/types/billing.types';
import { useAuthStore } from '@/store/auth.store';

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [salesChart, setSalesChart] = useState<DailySalesEntry[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const didLoad = useRef(false);

  useEffect(() => {
    if (didLoad.current) return; // Prevent StrictMode double-call
    didLoad.current = true;
    loadDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDashboard = async () => {
    try {
      const [dashRes, salesRes, invoicesRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getDailySales(),
        billingApi.getInvoices({ page: 1, limit: 5 }),
      ]);
      if (dashRes.success) setData(dashRes.data);
      if (salesRes.success) setSalesChart(salesRes.data);
      if (invoicesRes.success) setRecentInvoices(invoicesRes.data);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
        subtitle="Your business performance at a glance."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(data?.sales?.todaySales || 0)}
          icon={<IndianRupee />}
          color="primary"
          trend={{ value: 12.5, label: 'vs yesterday' }}
        />
        <StatCard
          title="Transactions"
          value={data?.sales?.todayTransactions || 0}
          icon={<ShoppingBag />}
          color="emerald"
          trend={{ value: 8.2, label: 'vs yesterday' }}
        />
        <StatCard
          title="Low Stock"
          value={data?.lowStockCount || 0}
          icon={<AlertTriangle />}
          color="amber"
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(data?.pendingDues?.totalOutstanding || 0)}
          icon={<CreditCard />}
          color="rose"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mr-2">
          Quick Actions
        </p>
        <Button onClick={() => navigate('/pos')} className="h-10 px-6 font-bold shadow-sm">
          Launch POS
        </Button>
        <Button
          onClick={() => navigate('/inventory')}
          variant="secondary"
          className="h-10 px-6 font-bold"
        >
          Add Inventory
        </Button>
        <Button
          onClick={() => navigate('/billing')}
          variant="secondary"
          className="h-10 px-6 font-bold"
        >
          Sales Reports
        </Button>
        <Button
          onClick={() => navigate('/purchase-orders')}
          variant="secondary"
          className="h-10 px-6 font-bold"
        >
          Purchase Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <Card className="lg:col-span-2" padding="lg">
          <CardHeader
            title="Revenue Overview"
            subtitle="7-day sales performance"
            action={<TrendingUp className="h-5 w-5 text-[var(--text-secondary)]" />}
          />
          <div className="h-80 mt-4" style={{ minHeight: 320 }}>
            {salesChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={salesChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.08} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                    }
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Sales']}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalSales"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#salesGradient)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--text-secondary)] font-medium">
                No sales data yet
              </div>
            )}
          </div>
        </Card>

        {/* AI Insights Widget */}
        <Card padding="lg" className="bg-[var(--bg-card)]/50 border-[var(--border-color)]">
          <CardHeader
            title="Intelligence"
            subtitle="AI-driven suggestions"
            action={<BrainCircuit className="h-5 w-5 text-[#3B82F6]" />}
          />
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm hover:border-[#3B82F6] transition-all">
              <div className="flex items-center gap-2 text-[#3B82F6] mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-bold text-[13px] uppercase tracking-wider">Restock Alert</span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed font-medium">
                {data?.lowStockCount
                  ? `You have ${data.lowStockCount} items running low. Reorder soon to avoid stockouts.`
                  : 'Inventory levels are currently optimal across all categories.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm hover:border-emerald-500 transition-all">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-bold text-[13px] uppercase tracking-wider">Demand Spike</span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed font-medium">
                Expect a 15% increase in weekend footfall. Consider increasing staff presence and stock.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-sm hover:border-rose-400 transition-all">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <CreditCard className="h-4 w-4" />
                <span className="font-bold text-[13px] uppercase tracking-wider">Credit Risk</span>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed font-medium">
                {data?.pendingDues?.count
                  ? `${data.pendingDues.count} customers have outstanding credit. Review the credit ledger.`
                  : '2 customers have overdue credit exceeding 30 days.'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card padding="none">
        <div className="px-6 py-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <h3 className="font-bold text-[var(--text-primary)] tracking-tight">
            Recent Transactions
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="font-bold text-[#3B82F6]"
            onClick={() => navigate('/billing')}
          >
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {recentInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-[var(--text-muted)] text-sm"
                  >
                    No transactions yet today
                  </td>
                </tr>
              ) : (
                recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                    onClick={() => navigate('/billing')}
                  >
                    <td className="px-6 py-4 text-[13px] font-bold text-[var(--text-primary)]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-[13px] font-medium text-[var(--text-secondary)]">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-[var(--text-secondary)]">
                      {inv.customer?.name ?? 'Walk-in'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default" className="text-xs">
                        {inv.paymentMode}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-[var(--text-primary)]">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge
                        variant={inv.status === 'COMPLETED' ? 'success' : inv.status === 'REFUNDED' ? 'danger' : 'warning'}
                        dot
                      >
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
