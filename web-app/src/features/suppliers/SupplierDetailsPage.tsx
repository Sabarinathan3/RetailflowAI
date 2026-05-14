import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Building, Star, Clock, AlertTriangle, FileText, CheckCircle2, Zap, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { suppliersApi } from '@/api/suppliers.api';
import type { Supplier, PurchaseOrder } from '@/types/supplier.types';
import { formatCurrency, formatDate } from '@/utils/format';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SupplierDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [supRes, poRes] = await Promise.all([
          suppliersApi.getSupplier(id),
          suppliersApi.getPurchaseOrders({ limit: 10, search: id }),
        ]);
        if (supRes.success) {
          setSupplier({
            ...supRes.data,
            balanceToPay: supRes.data.balanceToPay ?? 0,
            rating: supRes.data.rating ?? 4.5,
            aiRiskStatus: supRes.data.aiRiskStatus ?? 'LOW',
            tags: supRes.data.tags ?? ['Reliable'],
            leadTimeDays: supRes.data.leadTimeDays ?? null,
          });
        }
        if (poRes.success) {
          // Filter POs that belong to this supplier
          setPurchaseOrders(poRes.data.filter((po) => po.supplierId === id).slice(0, 10));
        }

        const ledgerRes = await suppliersApi.getLedgers(id, { limit: 10 });
        if (ledgerRes.success) {
          setLedgers(ledgerRes.data);
        }
      } catch {
        toast.error('Failed to load supplier details');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAnalyzeRisk = async () => {
    if (!id) return;
    setAnalyzing(true);
    try {
      const res = await suppliersApi.analyzeRisk(id);
      if (res.success) {
        toast.success('AI Analysis Complete', { description: res.data.insights });
        setSupplier(prev => prev ? { ...prev, aiRiskStatus: res.data.riskStatus, tags: res.data.tags } : null);
      }
    } catch {
      toast.error('Failed to analyze risk');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="space-y-4"><TableSkeleton rows={4} cols={2} /><TableSkeleton rows={5} cols={4} /></div>;
  }

  if (!supplier) {
    return <div className="text-center py-12">Supplier not found</div>;
  }

  // Mock Performance Data
  const performanceData = [
    { month: 'Jan', orders: 12, onTime: 12 },
    { month: 'Feb', orders: 15, onTime: 14 },
    { month: 'Mar', orders: 8, onTime: 8 },
    { month: 'Apr', orders: 20, onTime: 18 },
    { month: 'May', orders: 17, onTime: 17 },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/suppliers" className="p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            {supplier.name}
            {supplier.aiRiskStatus === 'LOW' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            {supplier.aiRiskStatus === 'HIGH' && <AlertTriangle className="w-5 h-5 text-rose-500" />}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
            Supplier ID: {supplier.id.split('-')[0].toUpperCase()}
            <Badge variant={supplier.aiRiskStatus === 'HIGH' ? 'danger' : 'success'} className="ml-2">
              {supplier.aiRiskStatus} Risk
            </Badge>
          </p>
        </div>
      </div>
      <div className="flex justify-end mb-4">
        <Button 
          onClick={handleAnalyzeRisk} 
          disabled={analyzing}
          className="bg-purple-600 hover:bg-purple-700 text-white border-none shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          icon={<Zap className={`w-4 h-4 ${analyzing ? 'animate-pulse text-amber-300' : 'text-amber-300'}`} />}
        >
          {analyzing ? 'Analyzing Risk...' : 'Run AI Risk Analysis'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card className="lg:col-span-1 space-y-6 border border-[var(--border-color)] bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-card)]">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{supplier.contactPerson || 'N/A'}</p>
                  <p className="text-xs text-[var(--text-secondary)]">Primary Contact</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
                <p className="text-sm font-medium">{supplier.phone}</p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
                <p className="text-sm font-medium">{supplier.email || '—'}</p>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
                <p className="text-sm font-medium">{supplier.address || '—'}</p>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{supplier.gstNumber || '—'}</p>
                  <p className="text-xs text-[var(--text-secondary)]">GST Number</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
              Business Terms
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Lead Time</p>
                <p className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--primary-color)]" />
                  {supplier.leadTimeDays} Days
                </p>
              </div>
              <div className="bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Supplier Rating</p>
                <p className="text-lg font-bold flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {supplier.rating} / 5
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Performance Chart */}
          <Card className="border border-[var(--border-color)]">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Delivery Performance
            </h3>
            <div className="h-64 min-w-0" style={{ minHeight: 256 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg-secondary)' }}
                    contentStyle={{ backgroundColor: 'var(--bg-popover)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="orders" name="Total Orders" fill="var(--bg-secondary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="onTime" name="On Time Delivery" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Purchase Orders */}
          <Card className="border border-[var(--border-color)]" padding="none">
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
              <h3 className="text-lg font-semibold">Recent Purchase Orders</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]/30">
                    <th className="px-6 py-3">Order No</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                  {purchaseOrders.length > 0 ? purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-[var(--text-primary)]">{po.orderNumber}</td>
                      <td className="px-6 py-3 text-sm text-[var(--text-secondary)]">{formatDate(po.createdAt)}</td>
                      <td className="px-6 py-3">
                        <Badge variant={po.status === 'RECEIVED' ? 'success' : po.status === 'ORDERED' ? 'warning' : 'default'} dot>
                          {po.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-[var(--text-primary)]">
                        {formatCurrency(po.totalAmount)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-muted)]">
                        No recent purchase orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Supplier Ledgers */}
          <Card className="border border-[var(--border-color)] mt-6" padding="none">
            <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-card)]">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--primary-color)]" />
                Payment Ledger
              </h3>
              <Button variant="ghost" size="sm">Add Payment</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]/30">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Total Amount</th>
                    <th className="px-6 py-3">Paid Amount</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                  {ledgers.length > 0 ? ledgers.map((ledger) => (
                    <tr key={ledger.id} className="hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-[var(--text-secondary)]">{formatDate(ledger.createdAt)}</td>
                      <td className="px-6 py-3 font-medium text-[var(--text-primary)]">{formatCurrency(ledger.totalAmount)}</td>
                      <td className="px-6 py-3 text-emerald-500 font-medium">{formatCurrency(ledger.paidAmount)}</td>
                      <td className="px-6 py-3">
                        <Badge variant={ledger.status === 'PAID' ? 'success' : ledger.status === 'PARTIAL' ? 'warning' : 'default'}>
                          {ledger.status}
                        </Badge>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-muted)]">
                        No ledger entries found. Sync a purchase order or create a ledger.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
