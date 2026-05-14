import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAdminStore } from '@/store/admin.store';
import { adminApi } from '@/api/admin.api';
import { AdminAuthLayout } from './AdminAuthLayout';

const adminLoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const login = useAdminStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setLoading(true);
    try {
      const response = await adminApi.login(data);
      login(response);
      localStorage.setItem('adminAccessToken', response.tokens.accessToken);
      localStorage.setItem('adminRefreshToken', response.tokens.refreshToken);
      toast.success('Signed in to admin console');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthLayout>
      <div className="p-8 md:p-10">
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-(--text-primary) tracking-tight leading-none mb-2">
            Welcome back
          </h2>
          <p className="text-[14px] font-medium text-(--text-secondary)">
            Sign in to the platform admin console.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email"
            type="email"
            placeholder="admin@example.com"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
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
          </div>
          <Button type="submit" className="w-full h-11 font-bold text-[15px]" loading={loading}>
            Sign in to admin
          </Button>
        </form>

        <div className="mt-8 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--border-color)" />
            </div>
            <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-widest text-(--text-secondary)">
              <span className="bg-(--bg-card) px-4">Demo access</span>
            </div>
          </div>
          <p className="text-center text-[12px] font-medium text-(--text-secondary) leading-relaxed">
            Seeded admin: <span className="font-bold text-(--text-primary)">admin@example.com</span>
            <br />
            Password: <span className="font-bold text-(--text-primary)">Password123!</span>
          </p>
        </div>

        <p className="text-center text-[13px] font-semibold text-(--text-secondary) mt-8">
          Need an admin account?{' '}
          <Link to="/admin/register" className="text-[#3B82F6] hover:text-[#22D3EE] font-bold">
            Create an account
          </Link>
        </p>
        <p className="text-center text-[12px] font-semibold text-(--text-secondary) mt-4">
          <Link to="/login" className="text-[#3B82F6] hover:text-[#22D3EE] font-bold">
            ← Shop / staff login
          </Link>
        </p>
      </div>
    </AdminAuthLayout>
  );
};

export default AdminLoginPage;
