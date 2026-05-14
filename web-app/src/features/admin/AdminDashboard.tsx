import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  Package,
  Users,
  ShoppingBag,
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAdminStore } from '@/store/admin.store';
import { adminApi } from '@/api/admin.api';
import type { DashboardAnalytics } from '@/types/admin.types';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/utils/format';

const CHART_COLORS = ['#f59e0b', '#f87171', '#34d399'];

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const admin = useAdminStore((s) => s.admin);
  const { isAuthenticated, hasPermission } = useAdminStore();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }

    if (!hasPermission('ANALYTICS_VIEW')) {
      setError('Your account does not have permission to view platform analytics.');
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getDashboard();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [isAuthenticated, hasPermission, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bg-primary) px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <div className="max-w-[1600px] mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-(--bg-primary) px-6 md:px-12 lg:px-20 py-6 md:py-8 flex items-center justify-center">
        <Card padding="lg" className="max-w-md text-center">
          <p className="font-bold text-(--text-primary) mb-2">Unable to load dashboard</p>
          <p className="text-sm text-(--text-secondary)">{error}</p>
          <Button variant="secondary" className="mt-6" onClick={() => navigate('/admin/login')}>
            Back to sign in
          </Button>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-(--bg-primary) px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <p className="text-(--text-secondary) font-medium">No data available</p>
      </div>
    );
  }

  const salesData = [
    { name: 'Today', sales: analytics.salesMetrics.todaySales },
    { name: 'Week', sales: analytics.salesMetrics.weekSales },
    { name: 'Month', sales: analytics.salesMetrics.monthSales },
  ];

  const available = Math.max(
    0,
    analytics.inventoryMetrics.totalProducts -
      analytics.inventoryMetrics.lowStockCount -
      analytics.inventoryMetrics.outOfStockCount
  );

  const inventoryData = [
    { name: 'Low stock', value: analytics.inventoryMetrics.lowStockCount },
    { name: 'Out of stock', value: analytics.inventoryMetrics.outOfStockCount },
    { name: 'Available', value: available },
  ];

  return (
    <div className="min-h-screen bg-(--bg-primary) text-(--text-primary)">
      <div className="px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="max-w-[1600px] mx-auto space-y-8"
        >
          <PageHeader
            title={`Welcome back, ${admin?.firstName || 'Admin'}`}
            subtitle="Platform performance at a glance."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Today's sales"
              value={formatCurrency(analytics.salesMetrics.todaySales)}
              icon={<IndianRupee />}
              color="primary"
              trend={{ value: analytics.salesMetrics.growthPercent, label: 'vs yesterday' }}
            />
            <StatCard
              title="Total products"
              value={analytics.inventoryMetrics.totalProducts}
              icon={<Package />}
              color="emerald"
            />
            <StatCard
              title="Platform users"
              value={analytics.userMetrics.totalUsers}
              icon={<Users />}
              color="amber"
            />
            <StatCard
              title="Transactions"
              value={analytics.transactionMetrics.totalTransactions}
              icon={<ShoppingBag />}
              color="rose"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[12px] font-bold text-(--text-secondary) uppercase tracking-widest mr-2">
              Quick actions
            </p>
            <Button onClick={() => navigate('/admin/users')} className="h-10 px-6 font-bold shadow-sm">
              Manage admins
            </Button>
            <Button
              onClick={() => navigate('/admin/reports')}
              variant="secondary"
              className="h-10 px-6 font-bold"
            >
              Reports
            </Button>
            <Button
              onClick={() => navigate('/admin/logs')}
              variant="secondary"
              className="h-10 px-6 font-bold"
            >
              Activity logs
            </Button>
            <Button
              onClick={() => navigate('/admin')}
              variant="secondary"
              className="h-10 px-6 font-bold"
            >
              Shops & analytics
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card padding="lg">
              <CardHeader
                title="Sales overview"
                subtitle="Today, week, and month"
                action={<BarChart3 className="h-5 w-5 text-(--text-secondary)" />}
              />
              <div className="h-80 mt-4" style={{ minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={salesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 600 }}
                      tickFormatter={(v) => `₹${(Number(v) / 1000).toFixed(0)}k`}
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
                    <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={56} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card padding="lg">
              <CardHeader
                title="Inventory mix"
                subtitle="Across all shops"
                action={<PieChartIcon className="h-5 w-5 text-(--text-secondary)" />}
              />
              <div className="h-80 mt-4 flex flex-col" style={{ minHeight: 280 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={inventoryData}
                      cx="50%"
                      cy="42%"
                      innerRadius={52}
                      outerRadius={88}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      stroke="var(--border-color)"
                      strokeWidth={1}
                    >
                      {inventoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 16 }}
                      formatter={(value) => {
                        const row = inventoryData.find((d) => d.name === value);
                        return `${value}: ${row?.value ?? 0}`;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card padding="lg" className="bg-(--bg-card)/50 border-(--border-color)">
            <CardHeader
              title="Snapshot"
              subtitle="Averages and pipeline health"
              action={<TrendingUp className="h-5 w-5 text-[#3B82F6]" />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-(--bg-secondary) border border-(--border-color) shadow-sm">
                <p className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-widest mb-1">
                  Avg ticket
                </p>
                <p className="text-xl font-bold text-(--text-primary)">
                  {formatCurrency(analytics.transactionMetrics.avgTransactionValue)}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-(--bg-secondary) border border-(--border-color) shadow-sm">
                <p className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-widest mb-1">
                  Active users
                </p>
                <p className="text-xl font-bold text-(--text-primary)">
                  {analytics.userMetrics.activeUsers}
                  <span className="text-sm font-medium text-(--text-secondary) ml-2">
                    / {analytics.userMetrics.totalUsers}
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-(--bg-secondary) border border-(--border-color) shadow-sm">
                <p className="text-[11px] font-bold text-(--text-secondary) uppercase tracking-widest mb-1">
                  Inventory value
                </p>
                <p className="text-xl font-bold text-(--text-primary)">
                  {formatCurrency(analytics.inventoryMetrics.totalValue)}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
