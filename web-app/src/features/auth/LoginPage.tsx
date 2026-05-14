import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { branchesApi } from '@/api/branches.api';
import { useBranchStore } from '@/store/branch.store';

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, 'Email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const setBranches = useBranchStore((s) => s.setBranches);
  const setActiveBranch = useBranchStore((s) => s.setActiveBranch);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
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
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-10">
      <div className="mb-8">
        <h2 className="text-[22px] font-bold text-(--text-primary) tracking-tight leading-none mb-2">Welcome back</h2>
        <p className="text-[14px] font-medium text-(--text-secondary)">Sign in to manage your retail business.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email or Phone"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.emailOrPhone?.message}
          {...register('emailOrPhone')}
        />
        <div className="space-y-1.5">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex justify-end">
            <button type="button" className="text-[12px] font-bold text-[#3B82F6] hover:text-[#22D3EE] transition-colors">
              Forgot password?
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full h-11 font-bold text-[15px]" loading={loading}>
          Sign in to account
        </Button>
      </form>

      <div className="mt-8 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-(--border-color)" /></div>
          <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-widest text-(--text-secondary)">
            <span className="bg-(--bg-card) px-4">Secure Access</span>
          </div>
        </div>

        <Link to="/pin-login">
          <Button variant="secondary" className="w-full h-11 font-bold text-[13px] gap-2.5">
            <KeyRound className="h-4 w-4 text-(--text-secondary)" /> Cashier PIN Access
          </Button>
        </Link>

        <p className="text-center text-[13px] font-semibold text-(--text-secondary)">
          New to RetailFlow?{' '}
          <Link to="/register" className="text-[#3B82F6] hover:text-[#22D3EE] font-bold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}

