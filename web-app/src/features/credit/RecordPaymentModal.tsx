import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Banknote, Smartphone, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { creditApi } from '@/api/credit.api';
import type { CreditLedger, AddCreditPaymentInput } from '@/types/credit.types';

interface RecordPaymentModalProps {
  open: boolean;
  ledger: CreditLedger;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_MODES: Array<{
  value: 'CASH' | 'UPI' | 'CARD';
  label: string;
  icon: React.ReactNode;
  gradient: string;
  active: string;
}> = [
  {
    value: 'CASH',
    label: 'Cash',
    icon: <Banknote className="w-4 h-4" />,
    gradient: 'from-emerald-500/15 to-green-500/10',
    active: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
  },
  {
    value: 'UPI',
    label: 'UPI',
    icon: <Smartphone className="w-4 h-4" />,
    gradient: 'from-violet-500/15 to-purple-500/10',
    active: 'border-violet-500 bg-violet-500/10 text-violet-500',
  },
  {
    value: 'CARD',
    label: 'Card',
    icon: <CreditCard className="w-4 h-4" />,
    gradient: 'from-blue-500/15 to-sky-500/10',
    active: 'border-blue-500 bg-blue-500/10 text-blue-500',
  },
];

export function RecordPaymentModal({ open, ledger, onClose, onSuccess }: RecordPaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [amount, setAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const outstanding = ledger.outstandingAmount;

  useEffect(() => {
    if (open) {
      setPaymentMode('CASH');
      setAmount(outstanding);
      setNotes('');
    }
  }, [open, outstanding]);

  const handleConfirm = async () => {
    if (typeof amount !== 'number' || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    if (amount > outstanding) {
      toast.error(`Amount cannot exceed outstanding balance of ${formatCurrency(outstanding)}`);
      return;
    }

    setIsProcessing(true);
    try {
      const payload: AddCreditPaymentInput = {
        amount,
        paymentMode,
        notes: notes.trim() || undefined,
      };
      const res = await creditApi.addPayment(ledger.id, payload);
      if (res.success) {
        const remaining = outstanding - amount;
        toast.success(
          remaining <= 0
            ? `✅ Credit fully settled for ${ledger.customer?.name ?? 'customer'}`
            : `Payment of ${formatCurrency(amount)} recorded. Remaining: ${formatCurrency(remaining)}`
        );
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const remaining = typeof amount === 'number' ? outstanding - amount : outstanding;
  const isFullPayment = typeof amount === 'number' && amount === outstanding;

  return (
    <Modal
      open={open}
      onClose={() => !isProcessing && onClose()}
      title="Record Credit Payment"
      description={`${ledger.customer?.name ?? 'Customer'} · ${ledger.customer?.phone ?? ''}`}
      showClose={!isProcessing}
    >
      <div className="space-y-5">
        {/* Outstanding banner */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: ledger.totalAmount, color: 'text-[var(--text-primary)]' },
            { label: 'Already Paid', value: ledger.paidAmount, color: 'text-emerald-500' },
            { label: 'Outstanding', value: outstanding, color: 'text-rose-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{formatCurrency(value)}</p>
            </div>
          ))}
        </div>

        {/* Payment mode */}
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Payment Method
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setPaymentMode(mode.value)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all bg-gradient-to-r ${mode.gradient} ${
                  paymentMode === mode.value ? mode.active : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                }`}
              >
                {mode.icon} {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Amount to Collect
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--text-muted)]">₹</span>
            <input
              type="number"
              min={0.01}
              max={outstanding}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              autoFocus
              className="w-full pl-8 pr-4 py-3.5 text-xl font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500/40 text-[var(--text-primary)] transition-all"
            />
          </div>

          {/* Quick amount buttons */}
          <div className="flex gap-2 mt-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => {
              const val = Math.round(outstanding * pct * 100) / 100;
              return (
                <button
                  key={pct}
                  onClick={() => setAmount(val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    amount === val
                      ? 'bg-primary-500 text-white border-primary-500'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-primary-500/50 hover:text-primary-400'
                  }`}
                >
                  {pct === 1 ? 'Full' : `${pct * 100}%`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Remaining balance preview */}
        <AnimatePresence>
          {typeof amount === 'number' && amount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className={`px-4 py-3 rounded-xl border flex items-center justify-between ${
                isFullPayment
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
              }`}
            >
              <div>
                <p className="text-xs text-[var(--text-muted)]">Balance after payment</p>
                <p className={`text-lg font-bold mt-0.5 ${isFullPayment ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isFullPayment ? 'Fully Settled ✓' : formatCurrency(remaining)}
                </p>
              </div>
              {isFullPayment && <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Payment reference, remarks…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500/30 resize-none"
          />
        </div>

        {/* CTA */}
        <Button
          className="w-full h-13 text-base font-bold"
          loading={isProcessing}
          onClick={handleConfirm}
          disabled={typeof amount !== 'number' || amount <= 0 || amount > outstanding || isProcessing}
        >
          {isProcessing ? 'Recording Payment…' : `Record ${formatCurrency(typeof amount === 'number' ? amount : 0)} Payment`}
        </Button>
      </div>
    </Modal>
  );
}
