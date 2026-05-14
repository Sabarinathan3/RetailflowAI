import { useState, useEffect } from 'react';
import {
  CreditCard,
  MessageCircle,
  Calendar,
  ReceiptText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  Banknote,
  Smartphone,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/utils/format';
import { creditApi } from '@/api/credit.api';
import type { CreditLedger, CreditPayment } from '@/types/credit.types';

interface LedgerDetailModalProps {
  open: boolean;
  ledger: CreditLedger;
  onClose: () => void;
  onPay: (ledger: CreditLedger) => void;
  onReminder: (ledger: CreditLedger) => void;
}

const MODE_ICONS: Record<string, React.ReactNode> = {
  CASH: <Banknote className="w-3.5 h-3.5 text-emerald-400" />,
  UPI:  <Smartphone className="w-3.5 h-3.5 text-violet-400" />,
  CARD: <CreditCard className="w-3.5 h-3.5 text-blue-400" />,
};

export function LedgerDetailModal({ open, ledger: initialLedger, onClose, onPay, onReminder }: LedgerDetailModalProps) {
  const [ledger, setLedger] = useState<CreditLedger>(initialLedger);
  const [loading, setLoading] = useState(false);

  // Re-fetch fresh data (with full payments list) when the modal opens
  useEffect(() => {
    if (!open) return;
    setLedger(initialLedger);
    setLoading(true);
    creditApi.getLedgerById(initialLedger.id)
      .then((res) => { if (res.success) setLedger(res.data); })
      .catch(() => {/* use the passed data */})
      .finally(() => setLoading(false));
  }, [open, initialLedger.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isPaid    = ledger.status === 'PAID';
  const isOverdue = ledger.status === 'OVERDUE';
  const paidPct   = ledger.totalAmount > 0
    ? Math.min(100, (ledger.paidAmount / ledger.totalAmount) * 100)
    : 0;

  const statusBadge = () => {
    if (isPaid)    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Paid</span>;
    if (isOverdue) return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20"><AlertTriangle className="w-3 h-3" /> Overdue</span>;
    if (ledger.status === 'PARTIAL') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20"><Clock className="w-3 h-3" /> Partial</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20"><Clock className="w-3 h-3" /> Pending</span>;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Credit Ledger Details"
      size="md"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Customer header */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                isPaid ? 'bg-emerald-500/20 text-emerald-400' :
                isOverdue ? 'bg-rose-500/20 text-rose-400' :
                'bg-primary-500/20 text-primary-400'
              }`}>
                {ledger.customer?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="font-bold text-[var(--text-primary)] text-base">
                  {ledger.customer?.name ?? 'Unknown'}
                </p>
                <p className="text-sm text-[var(--text-muted)]">{ledger.customer?.phone ?? '—'}</p>
              </div>
            </div>
            {statusBadge()}
          </div>

          {/* Amount breakdown */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Credit', value: ledger.totalAmount, className: 'text-[var(--text-primary)]' },
              { label: 'Total Paid',   value: ledger.paidAmount,  className: 'text-emerald-500' },
              { label: 'Outstanding',  value: ledger.outstandingAmount, className: ledger.outstandingAmount > 0 ? 'text-rose-500' : 'text-emerald-500' },
            ].map(({ label, value, className }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
                <p className={`text-base font-bold ${className}`}>{formatCurrency(value)}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1.5">
              <span>Payment Progress</span>
              <span className="font-semibold">{paidPct.toFixed(0)}% paid</span>
            </div>
            <div className="h-2.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-color)]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isPaid ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'}`}
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {ledger.dueDate && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <Calendar className={`w-4 h-4 ${isOverdue ? 'text-rose-400' : 'text-[var(--text-muted)]'}`} />
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Due Date</p>
                  <p className={`font-semibold ${isOverdue ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
                    {formatDate(ledger.dueDate)}
                  </p>
                </div>
              </div>
            )}
            {ledger.invoice && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <ReceiptText className="w-4 h-4 text-[var(--text-muted)]" />
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Invoice</p>
                  <p className="font-semibold text-[var(--text-primary)]">{ledger.invoice.invoiceNumber}</p>
                </div>
              </div>
            )}
            {ledger.notes && (
              <div className="col-span-2 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">Notes</p>
                <p className="text-sm text-[var(--text-secondary)]">{ledger.notes}</p>
              </div>
            )}
          </div>

          {/* Payment history */}
          <div>
            <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Payment History ({ledger.payments?.length ?? 0} transactions)
            </p>
            {!ledger.payments || ledger.payments.length === 0 ? (
              <div className="text-center py-6 text-[var(--text-muted)] text-sm border border-dashed border-[var(--border-color)] rounded-xl">
                No payments recorded yet
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {[...ledger.payments]
                  .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
                  .map((payment, idx) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                          {MODE_ICONS[payment.paymentMode] ?? <Banknote className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-500">
                            +{formatCurrency(payment.amount)}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {payment.paymentMode} · {formatDate(payment.paidAt)}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-[var(--text-muted)] italic mt-0.5">{payment.notes}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-card)] px-2 py-0.5 rounded-full border border-[var(--border-color)]">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {!isPaid && (
            <div className="flex gap-3 pt-2 border-t border-[var(--border-color)]">
              {ledger.customer?.phone && (
                <Button
                  variant="secondary"
                  className="flex-1 gap-2"
                  onClick={() => onReminder(ledger)}
                >
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  WhatsApp Reminder
                </Button>
              )}
              <Button
                className="flex-1 gap-2 font-bold"
                onClick={() => onPay(ledger)}
              >
                <CreditCard className="w-4 h-4" />
                Record Payment
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
