import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Phone, Lock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';

const registerSchema = z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters').max(100),
  ownerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10).max(15).optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  branchName: z.string().optional().or(z.literal('')),
  gstNumber: z.string().max(20).optional().or(z.literal('')),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { branchName: 'Main Branch' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const clean = {
        ...data,
        phone: data.phone || undefined,
        branchName: data.branchName || undefined,
        gstNumber: data.gstNumber || undefined,
      };
      const res = await authApi.register(clean);
      if (res.success) {
        login(res.data.user, res.data.tokens.accessToken, res.data.tokens.refreshToken);
        toast.success('Shop registered successfully!');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Create your shop</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Get started in under a minute</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Shop Name" placeholder="My Store" icon={<Store className="h-4 w-4" />} error={errors.shopName?.message} {...register('shopName')} />
          <Input label="Owner Name" placeholder="John Doe" icon={<User className="h-4 w-4" />} error={errors.ownerName?.message} {...register('ownerName')} />
        </div>
        <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        <Input label="Phone (optional)" placeholder="9876543210" icon={<Phone className="h-4 w-4" />} error={errors.phone?.message} {...register('phone')} />
        <Input label="Password" type="password" placeholder="Min 6 characters" icon={<Lock className="h-4 w-4" />} error={errors.password?.message} {...register('password')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Branch Name" placeholder="Main Branch" icon={<MapPin className="h-4 w-4" />} {...register('branchName')} />
          <Input label="GST Number" placeholder="Optional" {...register('gstNumber')} />
        </div>
        <Button type="submit" className="w-full" loading={loading}>Create Account</Button>
      </form>

      <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-[#3B82F6] hover:text-[#22D3EE] font-medium transition-colors">Sign in</Link>
      </p>
    </div>
  );
}

