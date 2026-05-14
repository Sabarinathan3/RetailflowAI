import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Bell,
  ReceiptText,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  IndianRupee,
  Users,
  Filter,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { creditApi } from '@/api/credit.api';
import { formatCurrency, formatDate } from '@/utils/format';
import type { CreditLedger, CreditSummary } from '@/types/credit.types';
import type { PaginationMeta } from '@/types/api.types';
import type { CreditStatus } from '@/types/enums';
import { RecordPaymentModal } from './RecordPaymentModal.tsx';
import { LedgerDetailModal } from './LedgerDetailModal.tsx';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<CreditStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info'; icon: React.ReactNode; color: string }> = {
  PAID:    { label: 'Paid',    variant: 'success', icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-emerald-500' },
  PARTIAL: { label: 'Partial', variant: 'warning', icon: <Clock className="w-3 h-3" />,        color: 'text-amber-500'   },
  OVERDUE: { label: 'Overdue', variant: 'danger',  icon: <AlertTriangle className="w-3 h-3" />,color: 'text-rose-500'    },
  PENDING: { label: 'Pending', variant: 'info',    icon: <Clock className="w-3 h-3" />,        color: 'text-blue-500'    },
};

const FILTER_TABS: Array<{ label: string; value: string }> = [
  { label: 'All',     value: ''        },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Partial', value: 'PARTIAL' },
  { label: 'Overdue', value: 'OVERDUE' },
  { label: 'Paid',    value: 'PAID'    },
];

// ── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({
  label, value, icon, color, loading,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
        {loading ? (
          <div className="h-6 w-20 mt-1 rounded bg-[var(--bg-secondary)] animate-pulse" />
        ) : (
          <p className="text-xl font-bold text-[var(--text-primary)] mt-0.5 truncate">{value}</p>
        )}
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function CreditPage() {
  const [ledgers, setLedgers]           = useState<CreditLedger[]>([]);
  const [meta, setMeta]                 = useState<PaginationMeta | null>(null);
  const [loading, setLoading]           = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [payingLedger, setPayingLedger] = useState<CreditLedger | null>(null);
  const [viewingLedger, setViewingLedger] = useState<CreditLedger | null>(null);
  const [summary, setSummary]           = useState<CreditSummary>({
    totalCredit: 0, totalOutstanding: 0, totalPaid: 0,
    overdueCount: 0, pendingCount: 0, paidCount: 0,
  });
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  // ── Debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // ── Load ledgers ───────────────────────────────────────────────────────────
  const loadLedgers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await creditApi.getLedgers({
        page,
        limit: 15,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      });
      if (res.success) {
        setLedgers(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch { toast.error('Failed to load credit records'); }
    finally { setLoading(false); }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => { loadLedgers(); }, [loadLedgers]);

  // ── Load summary stats ─────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const [allRes, outRes] = await Promise.all([
        creditApi.getLedgers({ limit: 1000 }), // for breakdown by status
        creditApi.getOutstanding(),
      ]);

      if (allRes.success && outRes.success) {
        const all = allRes.data;
        const totalCredit = all.reduce((s, l) => s + l.totalAmount, 0);
        const totalPaid   = all.reduce((s, l) => s + l.paidAmount,  0);
        setSummary({
          totalCredit,
          totalOutstanding: outRes.data.outstandingTotal,
          totalPaid,
          overdueCount: all.filter((l) => l.status === 'OVERDUE').length,
          pendingCount: all.filter((l) => l.status === 'PENDING' || l.status === 'PARTIAL').length,
          paidCount:    all.filter((l) => l.status === 'PAID').length,
        });
      }
    } catch { /* non-critical */ }
    finally { setSummaryLoading(false); }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  // Reset page when filter/search changes
  useEffect(() => { setPage(1); }, [statusFilter, debouncedSearch]);

  // ── WhatsApp Reminder ──────────────────────────────────────────────────────
  const handleSendReminder = async (ledger: CreditLedger) => {
    if (!ledger.customer?.phone) {
      toast.error('Customer phone number is required to send a reminder');
      return;
    }
    setSendingReminder(ledger.id);
    try {
      const res = await creditApi.getReminder(ledger.id);
      if (res.success && res.data?.whatsappLink) {
        window.open(res.data.whatsappLink, '_blank');
        toast.success(`WhatsApp opened for ${ledger.customer.name}`);
      }
    } catch {
      // Fallback: build the link client-side
      const phone = ledger.customer.phone.replace(/\D/g, '');
      const msg = encodeURIComponent(
        `Hi ${ledger.customer?.name},\n\nThis is a payment reminder.\nOutstanding Amount: ${formatCurrency(ledger.outstandingAmount)}\n${ledger.dueDate ? `Due Date: ${formatDate(ledger.dueDate)}\n` : ''}\nPlease clear your balance at your earliest convenience.\n\nThank you!`
      );
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
      toast.success('WhatsApp opened');
    } finally {
      setSendingReminder(null);
    }
  };

  // ── Days overdue helper ────────────────────────────────────────────────────
  const daysOverdue = (dueDate: string | null) => {
    if (!dueDate) return 0;
    const diff = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  // ── Status badge ───────────────────────────────────────────────────────────
  const renderStatus = (ledger: CreditLedger) => {
    const cfg = STATUS_CONFIG[ledger.status as CreditStatus] ?? STATUS_CONFIG.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
        ledger.status === 'OVERDUE'  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
        ledger.status === 'PAID'     ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
        ledger.status === 'PARTIAL'  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                                       'bg-blue-500/10 border-blue-500/30 text-blue-500'
      }`}>
        {cfg.icon} {cfg.label}
        {ledger.status === 'OVERDUE' && daysOverdue(ledger.dueDate) > 0 && (
          <span className="ml-0.5 opacity-70">·{daysOverdue(ledger.dueDate)}d</span>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Ledger"
        subtitle="Track and manage customer dues and outstanding payments"
      />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Credit Issued"
          value={formatCurrency(summary.totalCredit)}
          icon={<IndianRupee className="w-5 h-5 text-white" />}
          color="bg-blue-500/20"
          loading={summaryLoading}
        />
        <SummaryCard
          label="Outstanding Balance"
          value={formatCurrency(summary.totalOutstanding)}
          icon={<TrendingDown className="w-5 h-5 text-white" />}
          color="bg-rose-500/20"
          loading={summaryLoading}
        />
        <SummaryCard
          label="Overdue / Pending"
          value={`${summary.overdueCount + summary.pendingCount} customers`}
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          color="bg-amber-500/20"
          loading={summaryLoading}
        />
        <SummaryCard
          label="Fully Paid"
          value={`${summary.paidCount} records`}
          icon={<CheckCircle2 className="w-5 h-5 text-white" />}
          color="bg-emerald-500/20"
          loading={summaryLoading}
        />
      </div>

      {/* ── Main Table Card ── */}
      <Card padding="none">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border-color)] flex flex-col gap-3">
          {/* Search row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer name or phone…"
                className="w-full pl-9 pr-9 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 ml-auto">
              <Filter className="w-3.5 h-3.5" />
              {meta?.total ?? 0} records
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab.value
                    ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                }`}
              >
                {tab.label}
                {tab.value === 'OVERDUE' && summary.overdueCount > 0 && (
                  <span className="ml-1.5 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                    {summary.overdueCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : ledgers.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-8 w-8" />}
            title="No credit records found"
            description={
              search
                ? `No records match "${search}"`
                : statusFilter
                ? `No ${statusFilter.toLowerCase()} credits`
                : 'Credit records will appear here when customers purchase on credit from POS.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-secondary)]/50">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Remaining</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {ledgers.map((ledger) => {
                  const isOverdue = ledger.status === 'OVERDUE';
                  const isPaid = ledger.status === 'PAID';
                  const overduedays = daysOverdue(ledger.dueDate);
                  return (
                    <motion.tr
                      key={ledger.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`hover:bg-[var(--bg-secondary)]/50 transition-colors group cursor-pointer ${
                        isOverdue ? 'bg-rose-500/3' : ''
                      }`}
                      onClick={() => setViewingLedger(ledger)}
                    >
                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isOverdue ? 'bg-rose-500/20 text-rose-400' :
                            isPaid    ? 'bg-emerald-500/20 text-emerald-400' :
                                        'bg-primary-500/20 text-primary-400'
                          }`}>
                            {ledger.customer?.name?.charAt(0).toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                              {ledger.customer?.name ?? 'Unknown'}
                              {isOverdue && overduedays > 0 && (
                                <span className="ml-2 text-[10px] font-bold bg-rose-500/15 text-rose-500 px-1.5 py-0.5 rounded-md">
                                  {overduedays}d late
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {ledger.customer?.phone ?? '—'}
                            </p>
                            {ledger.invoice && (
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                INV: {ledger.invoice.invoiceNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 text-right">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {formatCurrency(ledger.totalAmount)}
                        </p>
                      </td>

                      {/* Paid */}
                      <td className="px-4 py-3.5 text-right">
                        <p className="text-sm text-emerald-500 font-medium">
                          {formatCurrency(ledger.paidAmount)}
                        </p>
                      </td>

                      {/* Remaining */}
                      <td className="px-4 py-3.5 text-right">
                        <p className={`text-sm font-bold ${
                          ledger.outstandingAmount > 0 ? 'text-rose-500' : 'text-emerald-500'
                        }`}>
                          {formatCurrency(ledger.outstandingAmount)}
                        </p>
                        {ledger.totalAmount > 0 && (
                          <div className="mt-1 h-1 w-16 ml-auto rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(100, (ledger.paidAmount / ledger.totalAmount) * 100)}%` }}
                            />
                          </div>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3.5">
                        {ledger.dueDate ? (
                          <p className={`text-sm ${isOverdue ? 'text-rose-500 font-semibold' : 'text-[var(--text-secondary)]'}`}>
                            {formatDate(ledger.dueDate)}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)]">—</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        {renderStatus(ledger)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* View Details */}
                          <button
                            onClick={() => setViewingLedger(ledger)}
                            title="View Details"
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            <ReceiptText className="w-4 h-4" />
                          </button>

                          {/* Record Payment */}
                          {!isPaid && (
                            <button
                              onClick={() => setPayingLedger(ledger)}
                              title="Record Payment"
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-[var(--text-muted)] hover:text-emerald-500 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}

                          {/* WhatsApp Reminder */}
                          {!isPaid && ledger.customer?.phone && (
                            <button
                              onClick={() => handleSendReminder(ledger)}
                              title="Send WhatsApp Reminder"
                              disabled={sendingReminder === ledger.id}
                              className="p-1.5 rounded-lg hover:bg-green-500/10 text-[var(--text-muted)] hover:text-green-500 transition-colors disabled:opacity-50"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[var(--border-color)] flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              Showing {ledgers.length} of {meta.total} records
            </p>
            <Pagination page={page} totalPages={meta.totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* ── Modals ── */}
      {payingLedger && (
        <RecordPaymentModal
          open={!!payingLedger}
          ledger={payingLedger}
          onClose={() => setPayingLedger(null)}
          onSuccess={() => {
            setPayingLedger(null);
            loadLedgers();
            loadSummary();
          }}
        />
      )}

      {viewingLedger && (
        <LedgerDetailModal
          open={!!viewingLedger}
          ledger={viewingLedger}
          onClose={() => setViewingLedger(null)}
          onPay={(l: CreditLedger) => { setViewingLedger(null); setPayingLedger(l); }}
          onReminder={handleSendReminder}
        />
      )}
    </div>
  );
}
