import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { useAuthStore } from '@/store/auth.store';
import { UPIPaymentModal } from './UPIPaymentModal';
import type { PaymentMode } from '@/types/enums';
import {
  Banknote,
  Smartphone,
  CreditCard,
  BookOpen,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

// ── Payment method config ─────────────────────────────────────────────────────
const PAYMENT_METHODS: Array<{
  mode: PaymentMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
}> = [
  {
    mode: 'CASH',
    label: 'Cash',
    description: 'Pay with physical currency',
    icon: <Banknote className="w-5 h-5" />,
    gradient: 'from-emerald-500/15 to-green-500/10',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    mode: 'UPI',
    label: 'UPI / QR Code',
    description: 'GPay · PhonePe · Paytm · any UPI app',
    icon: <Smartphone className="w-5 h-5" />,
    gradient: 'from-violet-500/15 to-purple-500/10',
    iconBg: 'bg-violet-500/20 text-violet-400',
  },
  {
    mode: 'CARD',
    label: 'Card',
    description: 'Credit or debit card',
    icon: <CreditCard className="w-5 h-5" />,
    gradient: 'from-blue-500/15 to-sky-500/10',
    iconBg: 'bg-blue-500/20 text-blue-400',
  },
  {
    mode: 'CREDIT',
    label: 'Credit / Due',
    description: 'Customer credit account',
    icon: <BookOpen className="w-5 h-5" />,
    gradient: 'from-amber-500/15 to-orange-500/10',
    iconBg: 'bg-amber-500/20 text-amber-400',
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  grandTotal: number;
  isProcessing: boolean;
  onConfirm: (paymentMode: PaymentMode, amountPaid: number | '') => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PaymentForm({ open, onClose, grandTotal, isProcessing, onConfirm }: PaymentFormProps) {
  // Step 1: choose method  |  Step 2: cash detail
  const [step, setStep] = useState<'choose' | 'cash-detail'>('choose');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [amountPaid, setAmountPaid] = useState<number | ''>(0);
  const [showUpiModal, setShowUpiModal] = useState(false);

  const user = useAuthStore((s) => s.user);
  const shopName = user?.name ?? 'RetailFlow';
  const savedUpiId = localStorage.getItem('retailflow_merchant_upi') ?? undefined;

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('choose');
      setPaymentMode('CASH');
      setAmountPaid(grandTotal);
      setShowUpiModal(false);
    }
  }, [open, grandTotal]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleMethodSelect = (mode: PaymentMode) => {
    setPaymentMode(mode);

    if (mode === 'UPI') {
      // Jump straight into UPI QR modal — skip the generic modal
      setShowUpiModal(true);
      return;
    }

    if (mode === 'CASH') {
      setAmountPaid(grandTotal);
      setStep('cash-detail');
      return;
    }

    // CARD / CREDIT → confirm immediately
    onConfirm(mode, grandTotal);
  };

  const handleCashConfirm = () => {
    onConfirm('CASH', amountPaid);
  };

  const handleUpiConfirm = () => {
    // Close UPI modal, pass processing to parent
    onConfirm('UPI', grandTotal);
  };

  const change = typeof amountPaid === 'number' ? amountPaid - grandTotal : 0;
  const cashValid = typeof amountPaid === 'number' && amountPaid >= grandTotal;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Main payment method chooser — hidden while UPI modal is open */}
      <Modal
        open={open && !showUpiModal}
        onClose={() => !isProcessing && onClose()}
        showClose={!isProcessing}
        size="sm"
      >
        <div className="space-y-4">
          {/* Amount Header */}
          <div className="text-center py-4 px-4 rounded-2xl bg-gradient-to-br from-primary-500/10 to-blue-500/5 border border-primary-500/20">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">
              Amount Due
            </p>
            <p className="text-5xl font-black text-[var(--text-primary)] tracking-tight">
              {formatCurrency(grandTotal)}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step 1: Choose Method ── */}
            {step === 'choose' && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-2.5"
              >
                <p className="text-sm font-semibold text-[var(--text-secondary)]">
                  Select Payment Method
                </p>

                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.mode}
                    onClick={() => handleMethodSelect(method.mode)}
                    disabled={isProcessing}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border border-[var(--border-color)] bg-gradient-to-r ${method.gradient} hover:border-[var(--text-muted)] active:scale-[0.99] transition-all group text-left`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${method.iconBg}`}>
                      {method.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {method.label}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {method.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" />
                  </button>
                ))}
              </motion.div>
            )}

            {/* ── Step 2: Cash Detail ── */}
            {step === 'cash-detail' && (
              <motion.div
                key="cash-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setStep('choose')}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change method
                </button>

                {/* Method badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">Cash Payment</span>
                </div>

                {/* Amount received input */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Amount Received
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[var(--text-muted)]">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={grandTotal}
                      step="0.5"
                      value={amountPaid}
                      onChange={(e) =>
                        setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      autoFocus
                      className="w-full pl-8 pr-4 py-3.5 text-xl font-bold rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 text-[var(--text-primary)] transition-all"
                    />
                  </div>
                </div>

                {/* Quick amount buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 10, 20, 50].map((extra) => {
                    const val = Math.ceil(grandTotal / 10) * 10 + extra;
                    return (
                      <button
                        key={extra}
                        onClick={() => setAmountPaid(val)}
                        className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                          amountPaid === val
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/50 hover:text-emerald-400'
                        }`}
                      >
                        ₹{val}
                      </button>
                    );
                  })}
                </div>

                {/* Change due */}
                <AnimatePresence>
                  {cashValid && change > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex justify-between items-center px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl"
                    >
                      <span className="text-sm font-medium text-emerald-400">Change Due</span>
                      <span className="text-xl font-black text-emerald-400">
                        {formatCurrency(change)}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Confirm button */}
                <Button
                  className="w-full h-13 text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/25"
                  onClick={handleCashConfirm}
                  loading={isProcessing}
                  disabled={!cashValid || isProcessing}
                >
                  Collect {cashValid ? formatCurrency(amountPaid as number) : '—'}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>

      {/* UPI QR Modal — separate, full-featured */}
      <UPIPaymentModal
        open={showUpiModal}
        onClose={() => {
          setShowUpiModal(false);
          // Don't close parent — let cashier pick another method
        }}
        amount={grandTotal}
        shopName={shopName}
        defaultUpiId={savedUpiId}
        isProcessing={isProcessing}
        onConfirm={handleUpiConfirm}
      />
    </>
  );
}
