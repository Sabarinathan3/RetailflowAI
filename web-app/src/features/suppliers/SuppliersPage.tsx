import { useState, useEffect, useCallback, useMemo } from 'react';
import { Truck, Search, Plus, AlertTriangle, TrendingUp, DollarSign, Star, Info, Zap } from 'lucide-react';
import { SupplierExportButton } from './SupplierExportButton';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { suppliersApi } from '@/api/suppliers.api';
import type { Supplier } from '@/types/supplier.types';
import type { PaginationMeta } from '@/types/api.types';
import { formatCurrency } from '@/utils/format';
import { SupplierModal } from './SupplierModal';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await suppliersApi.getSuppliers({ page, limit: 20, search });
      if (res.success) {
        const enrichedSuppliers: Supplier[] = res.data.map((s) => ({
          ...s,
          balanceToPay: s.balanceToPay ?? 0,
          rating: s.rating ?? 5.0,
          aiRiskStatus: s.aiRiskStatus ?? 'LOW',
          tags: Array.isArray(s.tags) ? s.tags : [],
        }));
        setSuppliers(enrichedSuppliers);
        if (res.meta) setMeta(res.meta);
      }
    } catch {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { 
    const debounce = setTimeout(() => {
      loadSuppliers(); 
    }, 300);
    return () => clearTimeout(debounce);
  }, [loadSuppliers]);

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await suppliersApi.deleteSupplier(id);
      toast.success('Supplier deleted');
      loadSuppliers();
    } catch {
      toast.error('Failed to delete supplier');
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await suppliersApi.getRecommendations();
      if (res.success) {
        toast.success('AI Recommendations loaded');
        setSuppliers(res.data.map(s => ({
          ...s, 
          balanceToPay: s.balanceToPay ?? 0,
          rating: s.rating ?? 5.0,
          aiRiskStatus: s.aiRiskStatus ?? 'LOW',
          tags: Array.isArray(s.tags) ? s.tags : []
        })));
        setMeta(null); // Remove pagination for recommendations
      }
    } catch {
      toast.error('Failed to load recommendations');
      setLoading(false);
    }
  };

  // Mock Data for Charts
  const chartData = [
    { name: 'Jan', spend: 4000, risk: 2400 },
    { name: 'Feb', spend: 3000, risk: 1398 },
    { name: 'Mar', spend: 2000, risk: 9800 },
    { name: 'Apr', spend: 2780, risk: 3908 },
    { name: 'May', spend: 1890, risk: 4800 },
    { name: 'Jun', spend: 2390, risk: 3800 },
    { name: 'Jul', spend: 3490, risk: 4300 },
  ];

  const totalSpend = useMemo(() => suppliers.reduce((sum, s) => sum + (s.balanceToPay || 0), 0), [suppliers]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Supplier Intelligence" 
          subtitle="Manage vendors, track performance, and monitor AI risk alerts" 
        />
        <div className="flex gap-2">
          <SupplierExportButton suppliers={suppliers} search={search} />
          <Button onClick={handleAdd} icon={<Plus className="w-4 h-4" />}>Add Supplier</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="h-full flex flex-col justify-between hover:shadow-md transition-all group border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary-color)]/50" padding="none">
          <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-[var(--text-muted)] font-medium truncate pr-2">Total Active Suppliers</p>
              <div className="p-2 bg-[var(--bg-secondary)] rounded-lg text-[var(--primary-color)] group-hover:scale-110 transition-transform flex-shrink-0">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <h3 className="text-3xl font-bold text-[var(--text-primary)] truncate">{meta?.total || suppliers.length}</h3>
            </div>
            <p className="text-xs text-emerald-500 mt-4 flex items-center gap-1 truncate">
              <TrendingUp className="w-3 h-3 flex-shrink-0" /> <span className="truncate">+2 this month</span>
            </p>
          </div>
        </Card>

        <Card className="h-full flex flex-col justify-between hover:shadow-md transition-all group border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary-color)]/50" padding="none">
          <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-[var(--text-muted)] font-medium truncate pr-2">Total Outstanding</p>
              <div className="p-2 bg-[var(--bg-secondary)] rounded-lg text-amber-500 group-hover:scale-110 transition-transform flex-shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <h3 className="text-3xl font-bold text-[var(--text-primary)] truncate">{formatCurrency(totalSpend)}</h3>
            </div>
            <p className="text-xs text-rose-500 mt-4 flex items-center gap-1 truncate">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" /> <span className="truncate">Due next 7 days</span>
            </p>
          </div>
        </Card>

        <Card className="h-full flex flex-col justify-between hover:shadow-md transition-all group border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary-color)]/50" padding="none">
          <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-[var(--text-muted)] font-medium truncate pr-2">Avg Supplier Rating</p>
              <div className="p-2 bg-[var(--bg-secondary)] rounded-lg text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
                <Star className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <h3 className="text-3xl font-bold text-[var(--text-primary)] truncate">4.2</h3>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-4 flex items-center gap-1 truncate">
              <Info className="w-3 h-3 flex-shrink-0" /> <span className="truncate">Based on 124 deliveries</span>
            </p>
          </div>
        </Card>

        <Card className="h-full flex flex-col justify-between hover:shadow-md transition-all group border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-rose-500/50" padding="none">
          <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-[var(--text-muted)] font-medium truncate pr-2">AI Risk Alerts</p>
              <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500 group-hover:scale-110 transition-transform flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 flex items-center">
              <h3 className="text-3xl font-bold text-rose-500 truncate">
                {suppliers.filter(s => s.aiRiskStatus === 'HIGH').length}
              </h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-4 flex items-center gap-1 truncate">
              <Info className="w-3 h-3 flex-shrink-0" /> <span className="truncate">High risk suppliers identified</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Analytics Chart */}
      <Card className="p-5 border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--primary-color)]" />
          Spend & Risk Forecast (AI Insights)
        </h3>
        <div className="h-64 w-full min-w-0" style={{ minHeight: 256 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-popover)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Area type="monotone" dataKey="spend" stroke="var(--primary-color)" fillOpacity={1} fill="url(#colorSpend)" name="Total Spend" />
              <Area type="monotone" dataKey="risk" stroke="#ef4444" fillOpacity={1} fill="url(#colorRisk)" name="Risk Exposure" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Data Table */}
      <Card padding="none" className="overflow-hidden border border-[var(--border-color)]">
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row gap-4 justify-between bg-[var(--bg-card)]">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers by name, contact, or GST..."
              className="pl-9 bg-[var(--bg-secondary)] border-none focus:ring-1"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={loadSuppliers}>All</Button>
            <Button variant="ghost" size="sm" className="text-rose-500" onClick={() => setSearch('HIGH')}>High Risk</Button>
            <Button variant="ghost" size="sm" className="text-[var(--primary-color)]" onClick={fetchRecommendations}>
              <Zap className="w-4 h-4 inline-block mr-1" /> Recommended
            </Button>
          </div>
        </div>

        {loading ? <TableSkeleton rows={6} cols={6} /> : suppliers.length === 0 ? (
          <EmptyState 
            icon={<Truck className="h-12 w-12 text-[var(--text-muted)]" />} 
            title="No suppliers found"
            description="Start by adding your first supplier or adjusting your search filters." 
            action={{ label: 'Add Supplier', onClick: handleAdd }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]/30">
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">AI Risk</th>
                  <th className="px-6 py-4 text-right">Outstanding</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary-color)] to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{s.name}</p>
                          <div className="flex gap-1 mt-1">
                            {s.tags?.map((tag, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{s.contactPerson || 'N/A'}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{s.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{s.rating || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={s.aiRiskStatus === 'HIGH' ? 'danger' : s.aiRiskStatus === 'MEDIUM' ? 'warning' : 'success'}>
                        {s.aiRiskStatus || 'LOW'} Risk
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[var(--text-primary)]">
                      {formatCurrency(s.balanceToPay ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/suppliers/${s.id}`}>
                          <Button size="sm" variant="ghost" className="text-[var(--primary-color)]">View</Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(s)}>Edit</Button>
                        <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-500" onClick={() => handleDelete(s.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/20">
            <p className="text-sm text-[var(--text-muted)]">Showing {suppliers.length} of {meta.total} records</p>
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <SupplierModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadSuppliers} 
        supplier={editingSupplier} 
      />
    </div>
  );
}
