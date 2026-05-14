import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Delete, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { branchesApi } from '@/api/branches.api';
import { useBranchStore } from '@/store/branch.store';

export function PinLoginPage() {
  const [shopId, setShopId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'shopId' | 'pin'>('shopId');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const setBranches = useBranchStore((s) => s.setBranches);
  const setActiveBranch = useBranchStore((s) => s.setActiveBranch);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) setPin((p) => p + digit);
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
  };

  const handleSubmitPin = async () => {
    if (pin.length !== 4) return;
    setLoading(true);
    try {
      const res = await authApi.pinLogin({ shopId, pin });
      if (res.success) {
        login(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
        // Load branches immediately so X-Branch-Id is valid for inventory/pos calls
        try {
          const b = await branchesApi.list();
          if (b.success) {
            setBranches(b.data);
            if (res.data.user.branchId && b.data.some((br) => br.id === res.data.user.branchId)) {
              setActiveBranch(res.data.user.branchId);
            }
          }
        } catch {
          // ignore; branch will be loaded by layout later
        }
        toast.success(`Welcome, ${res.data.user.name}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid PIN');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when 4 digits entered
  if (pin.length === 4 && !loading) {
    handleSubmitPin();
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-(--text-primary)">Cashier Login</h1>
        <p className="text-sm text-(--text-secondary) mt-1">
          {step === 'shopId' ? 'Enter your Shop ID' : 'Enter your 4-digit PIN'}
        </p>
      </div>

      {step === 'shopId' ? (
        <div className="space-y-4">
          <Input
            label="Shop ID"
            placeholder="Enter shop UUID"
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
          />
          <Button className="w-full" onClick={() => { if (shopId.trim()) setStep('pin'); else toast.error('Enter a Shop ID'); }}>
            Continue
          </Button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
          {/* PIN dots */}
          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: pin.length > i ? 1.2 : 1 }}
                className={cn(
                  'w-4 h-4 rounded-full border-2 transition-all duration-200',
                  pin.length > i
                    ? 'bg-[#3B82F6] border-[#3B82F6] shadow-lg shadow-blue-500/30'
                    : 'border-(--border-color)'
                )}
              />
            ))}
          </div>

          {/* Number pad */}
          <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
            {['1','2','3','4','5','6','7','8','9','','0','del'].map((key) => {
              if (key === '') return <div key="empty" />;
              if (key === 'del') {
                return (
                  <button key="del" onClick={handleDelete}
                    className="h-14 rounded-xl flex items-center justify-center text-(--text-secondary) hover:bg-(--bg-card) transition-colors cursor-pointer">
                    <Delete className="h-5 w-5" />
                  </button>
                );
              }
              return (
                <button key={key} onClick={() => handleDigit(key)}
                  className="h-14 rounded-xl text-xl font-semibold text-(--text-primary) hover:bg-blue-500/10 hover:text-[#3B82F6] active:scale-95 transition-all cursor-pointer">
                  {key}
                </button>
              );
            })}
          </div>

          <button onClick={() => { setStep('shopId'); setPin(''); }}
            className="flex items-center justify-center gap-2 w-full text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </motion.div>
      )}

      <div className="mt-6 pt-4 border-t border-(--border-color)">
        <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-(--text-secondary) hover:text-[#3B82F6] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to email login
        </Link>
      </div>
    </div>
  );
}

