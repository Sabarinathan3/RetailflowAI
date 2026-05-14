import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Smartphone,
  Copy,
  RefreshCw,
  ShieldCheck,
  Wifi,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface UPIPaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  shopName: string;
  /** UPI VPA of the merchant — can be overridden by the cashier */
  defaultUpiId?: string;
  isProcessing: boolean;
  /** Called when cashier clicks "Confirm Payment Received" */
  onConfirm: () => void;
}

// ── UPI URI builder ───────────────────────────────────────────────────────────
function buildUpiUri(upiId: string, name: string, amount: number) {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: `RetailFlow Sale`,
  });
  return `upi://pay?${params.toString()}`;
}

// ── Deep-link URLs for popular UPI apps ───────────────────────────────────────
function buildAppDeepLink(app: 'gpay' | 'phonepe' | 'paytm', uri: string) {
  const encoded = encodeURIComponent(uri);
  switch (app) {
    case 'gpay':
      return `tez://upi/pay?${new URLSearchParams(uri.replace('upi://pay?', '')).toString()}`;
    case 'phonepe':
      return `phonepe://pay?${new URLSearchParams(uri.replace('upi://pay?', '')).toString()}`;
    case 'paytm':
      return `paytmmp://pay?${new URLSearchParams(uri.replace('upi://pay?', '')).toString()}`;
    default:
      return encoded;
  }
}

// ── Poll tick — creates a visible "heartbeat" effect ─────────────────────────
const POLL_INTERVAL = 3000; // ms between status ticks
const MAX_POLLS = 40;       // ~2 min before auto-expire

// ── Status states ─────────────────────────────────────────────────────────────
type PaymentStatus = 'waiting' | 'confirming' | 'success' | 'expired';

// ── Component ─────────────────────────────────────────────────────────────────
export function UPIPaymentModal({
  open,
  onClose,
  amount,
  shopName,
  defaultUpiId = 'retailflow@upi',
  isProcessing,
  onConfirm,
}: UPIPaymentModalProps) {
  const [upiId, setUpiId] = useState(defaultUpiId);
  const [editingUpiId, setEditingUpiId] = useState(false);
  const [tempUpiId, setTempUpiId] = useState(defaultUpiId);
  const [status, setStatus] = useState<PaymentStatus>('waiting');
  const [pollCount, setPollCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [pulseKey, setPulseKey] = useState(0); // forces pulse animation restart
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upiUri = buildUpiUri(upiId, shopName, amount);

  // Reset every time the modal opens
  useEffect(() => {
    if (open) {
      setUpiId(defaultUpiId);
      setTempUpiId(defaultUpiId);
      setEditingUpiId(false);
      setStatus('waiting');
      setPollCount(0);
      setPulseKey((k) => k + 1);
    }
  }, [open, defaultUpiId]);

  // Heartbeat poll — simulates "checking payment" every few seconds
  useEffect(() => {
    if (!open || status !== 'waiting') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(() => {
      setPollCount((c) => {
        const next = c + 1;
        if (next >= MAX_POLLS) {
          setStatus('expired');
          clearInterval(pollRef.current!);
        }
        setPulseKey((k) => k + 1);
        return next;
      });
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, status]);

  const handleCopyUpiId = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  }, [upiId]);

  const handleCopyAmount = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(amount.toFixed(2));
    } catch {/* */}
  }, [amount]);

  const handleConfirmPayment = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatus('confirming');
    onConfirm();
  }, [onConfirm]);

  const handleRefreshQR = useCallback(() => {
    setPollCount(0);
    setStatus('waiting');
    setPulseKey((k) => k + 1);
  }, []);

  const handleSaveUpiId = useCallback(() => {
    const trimmed = tempUpiId.trim();
    if (trimmed && trimmed.includes('@')) {
      setUpiId(trimmed);
      localStorage.setItem('retailflow_merchant_upi', trimmed);
    }
    setEditingUpiId(false);
  }, [tempUpiId]);

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (editingUpiId) setTimeout(() => inputRef.current?.focus(), 50);
  }, [editingUpiId]);

  // Progress percentage for the timer ring
  const progress = Math.round((pollCount / MAX_POLLS) * 100);
  const secondsLeft = Math.round(((MAX_POLLS - pollCount) * POLL_INTERVAL) / 1000);

  return (
    <Modal
      open={open}
      onClose={() => status !== 'confirming' && !isProcessing && onClose()}
      title="UPI Payment"
      description={`Total: ${formatCurrency(amount)}`}
      size="sm"
      showClose={status !== 'confirming' && !isProcessing}
    >
      <div className="space-y-5 py-1">
        {/* ── Amount Banner ── */}
        <div className="text-center px-4 py-4 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-500/20">
          <p className="text-xs font-medium text-violet-400 uppercase tracking-widest mb-1">
            Amount to Pay
          </p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-4xl font-black text-[var(--text-primary)] tracking-tight">
              {formatCurrency(amount)}
            </p>
            <button
              onClick={handleCopyAmount}
              className="text-[var(--text-muted)] hover:text-violet-400 transition-colors p-1"
              title="Copy amount"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── QR Code / Status Area ── */}
        <AnimatePresence mode="wait">
          {status === 'waiting' && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-3"
            >
              {/* QR Frame */}
              <div className="relative">
                {/* Animated border */}
                <div className="absolute -inset-[3px] rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 animate-[spin_4s_linear_infinite] opacity-70" />
                <div className="relative bg-white rounded-xl p-4 shadow-xl">
                  <QRCodeSVG
                    value={upiUri}
                    size={192}
                    level="H"
                    marginSize={0}
                    fgColor="#1e1b4b"
                    imageSettings={{
                      src: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzdDM0FFRCIvPjx0ZXh0IHg9IjE2IiB5PSIyMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+VTwvdGV4dD48L3N2Zz4=',
                      height: 28,
                      width: 28,
                      excavate: true,
                    }}
                  />
                </div>

                {/* Pulse indicator */}
                <AnimatePresence>
                  <motion.div
                    key={pulseKey}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.15, opacity: 0 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="absolute -inset-1 rounded-2xl bg-violet-500 pointer-events-none"
                  />
                </AnimatePresence>
              </div>

              {/* Timer ring */}
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="13" fill="none" stroke="var(--border-color)" strokeWidth="3" />
                    <circle
                      cx="16" cy="16" r="13" fill="none"
                      stroke={progress > 80 ? '#ef4444' : '#8b5cf6'}
                      strokeWidth="3"
                      strokeDasharray={`${Math.PI * 26}`}
                      strokeDashoffset={`${Math.PI * 26 * (progress / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[var(--text-secondary)]">
                    {secondsLeft > 99 ? '∞' : secondsLeft}
                  </span>
                </div>
                <span>Expires in {secondsLeft}s</span>
                <button
                  onClick={handleRefreshQR}
                  className="ml-1 p-1 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-violet-400 transition-colors"
                  title="Refresh QR"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {/* Polling status */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <motion.div
                  key={pulseKey + '_dot'}
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-2 h-2 rounded-full bg-amber-400"
                />
                <Wifi className="w-3.5 h-3.5" />
                <span>Waiting for payment…</span>
              </div>
            </motion.div>
          )}

          {status === 'expired' && (
            <motion.div
              key="expired"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <XCircle className="w-16 h-16 text-rose-500" />
              <div className="text-center">
                <p className="font-semibold text-[var(--text-primary)]">QR Code Expired</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  Generate a new QR to continue
                </p>
              </div>
              <Button onClick={handleRefreshQR} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh QR Code
              </Button>
            </motion.div>
          )}

          {status === 'confirming' && (
            <motion.div
              key="confirming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <Loader2 className="w-14 h-14 text-violet-500 animate-spin" />
              <p className="font-medium text-[var(--text-primary)]">Creating Invoice…</p>
              <p className="text-xs text-[var(--text-muted)]">
                Saving payment and updating inventory
              </p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              </motion.div>
              <p className="font-semibold text-lg text-[var(--text-primary)]">Payment Confirmed!</p>
              <p className="text-sm text-emerald-500">{formatCurrency(amount)} received via UPI</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── UPI ID Row ── */}
        {(status === 'waiting' || status === 'expired') && (
          <div className="px-3 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
              Merchant UPI ID
            </p>
            {editingUpiId ? (
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={tempUpiId}
                  onChange={(e) => setTempUpiId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveUpiId()}
                  className="flex-1 text-sm bg-[var(--bg-card)] border border-violet-500/50 rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  placeholder="yourname@upi"
                />
                <button
                  onClick={handleSaveUpiId}
                  className="text-xs bg-violet-600 text-white px-3 rounded-lg hover:bg-violet-700 transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingUpiId(false)}
                  className="text-xs text-[var(--text-muted)] px-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-violet-400 font-mono">{upiId}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyUpiId}
                    className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-violet-400 transition-colors"
                    title="Copy UPI ID"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => { setTempUpiId(upiId); setEditingUpiId(true); }}
                    className="text-[10px] text-[var(--text-muted)] hover:text-violet-400 transition-colors px-1.5 py-1 rounded-md hover:bg-[var(--bg-card)]"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Quick Pay Buttons ── */}
        {status === 'waiting' && (
          <div>
            <p className="text-xs text-[var(--text-muted)] text-center mb-2">
              Or open directly in
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'GPay', emoji: '🟢', app: 'gpay' as const, color: 'hover:border-green-500/50 hover:text-green-400' },
                { label: 'PhonePe', emoji: '🟣', app: 'phonepe' as const, color: 'hover:border-violet-500/50 hover:text-violet-400' },
                { label: 'Paytm', emoji: '🔵', app: 'paytm' as const, color: 'hover:border-blue-500/50 hover:text-blue-400' },
              ].map(({ label, emoji, app, color }) => (
                <a
                  key={app}
                  href={buildAppDeepLink(app, upiUri)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] transition-all text-xs font-medium cursor-pointer ${color}`}
                >
                  <span className="text-lg">{emoji}</span>
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Instruction Steps ── */}
        {status === 'waiting' && (
          <ol className="space-y-1.5 text-xs text-[var(--text-secondary)]">
            {[
              { icon: <Smartphone className="w-3.5 h-3.5" />, text: 'Open any UPI app on your phone' },
              { icon: <ShieldCheck className="w-3.5 h-3.5" />, text: 'Scan the QR code above' },
              { icon: <CheckCircle2 className="w-3.5 h-3.5" />, text: 'Confirm the payment in your UPI app' },
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-violet-400">{step.icon}</span>
                  {step.text}
                </span>
              </li>
            ))}
          </ol>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isProcessing || status === 'confirming'}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-violet-500/25 border-0"
            onClick={handleConfirmPayment}
            loading={isProcessing || status === 'confirming'}
            disabled={status === 'expired' || status === 'success' || status === 'confirming' || isProcessing}
          >
            {status === 'confirming' || isProcessing ? 'Processing…' : '✓ Confirm Paid'}
          </Button>
        </div>

        {/* ── Footer note ── */}
        <p className="text-center text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3" />
          Powered by UPI · Secured by NPCI
        </p>
      </div>
    </Modal>
  );
}
