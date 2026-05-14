import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAdminStore } from '@/store/admin.store';
import { adminApi } from '@/api/admin.api';
import { AdminAuthLayout } from './AdminAuthLayout';

const adminRegisterSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional().or(z.literal('')),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AdminRegisterForm = z.infer<typeof adminRegisterSchema>;

export function AdminRegisterPage() {
  const navigate = useNavigate();
  const login = useAdminStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminRegisterForm>({
    resolver: zodResolver(adminRegisterSchema),
  });

  const onSubmit = async (data: AdminRegisterForm) => {
    setLoading(true);
    try {
      const response = await adminApi.register({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
      });
      login(response);
      localStorage.setItem('adminAccessToken', response.tokens.accessToken);
      localStorage.setItem('adminRefreshToken', response.tokens.refreshToken);
      toast.success('Admin account created');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthLayout>
      <div className="p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-(--text-primary)">Create admin account</h1>
          <p className="text-sm text-(--text-secondary) mt-1">Platform administrator access</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="John"
              icon={<User className="h-4 w-4" />}
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last name"
              placeholder="Doe"
              icon={<User className="h-4 w-4" />}
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Phone (optional)"
            placeholder="9876543210"
            icon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 8 characters"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat password"
            icon={<Lock className="h-4 w-4" />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" className="w-full h-11 font-bold text-[15px]" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-(--text-secondary) mt-6">
          Already have access?{' '}
          <Link to="/admin/login" className="text-[#3B82F6] hover:text-[#22D3EE] font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </AdminAuthLayout>
  );
}

export default AdminRegisterPage;
