import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/utils/format';
import type { PaymentMode } from '@/types/enums';
import { creditApi } from '@/api/credit.api';
import { toast } from 'sonner';

interface PaymentFormProps {
  open: boolean;
  onClose: () => void;
  ledgerId: string;
  balance: number;
  onSuccess: () => void;
}

export function PaymentForm({ open, onClose, ledgerId, balance, onSuccess }: PaymentFormProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [amount, setAmount] = useState<number | ''>('');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setPaymentMode('CASH');
      setAmount(balance);
      setReferenceId('');
      setNotes('');
    }
  }, [open, balance]);

  const handleConfirm = async () => {
    if (typeof amount !== 'number' || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount > balance) {
      toast.error('Amount cannot be greater than balance');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await creditApi.payCredit({
        ledgerId,
        amount,
        paymentMode,
        referenceId: referenceId || undefined,
        notes: notes || undefined,
      });
      
      if (res.success) {
        toast.success('Payment recorded successfully');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !isProcessing && onClose()} title="Record Credit Payment">
      <div className="space-y-6">
        <div className="text-center p-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-secondary)] font-medium mb-1">Outstanding Balance</p>
          <p className="text-4xl font-bold text-primary-500 tracking-tight">{formatCurrency(balance)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            {(['CASH', 'UPI', 'CARD'] as PaymentMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setPaymentMode(mode)}
                className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  paymentMode === mode 
                    ? 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400' 
                    : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Input 
            label="Amount to Pay" 
            type="number" 
            value={amount} 
            onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
            max={balance}
            autoFocus
          />
          
          {(paymentMode === 'UPI' || paymentMode === 'CARD') && (
            <Input 
              label="Reference ID (Optional)" 
              value={referenceId} 
              onChange={e => setReferenceId(e.target.value)}
              placeholder={`Enter ${paymentMode} reference number`}
            />
          )}

          <Input 
            label="Notes (Optional)" 
            value={notes} 
            onChange={e => setNotes(e.target.value)}
            placeholder="Any additional notes..."
          />
        </div>

        <div className="pt-2">
          <Button 
            className="w-full h-14 text-lg font-bold" 
            loading={isProcessing} 
            onClick={handleConfirm}
            disabled={typeof amount !== 'number' || amount <= 0 || amount > balance}
          >
            Confirm Payment of {formatCurrency(typeof amount === 'number' ? amount : 0)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
