import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { customersApi } from '@/api/customers.api';
import type { Customer } from '@/types/customer.types';

const optNum = z.preprocess(
  (v) => (v === '' || v === undefined ? undefined : Number(v)),
  z.number().min(0).optional()
);

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().min(10, 'Phone is required').max(15),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  gstNumber: z.string().max(20).optional().or(z.literal('')),
  creditLimit: optNum,
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CustomerForm({ open, customer, onClose, onSuccess }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!customer;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema) as never,
    defaultValues: customer ? {
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      gstNumber: customer.gstNumber || '',
      creditLimit: customer.creditLimit,
    } : { creditLimit: 0 },
  });

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    try {
      const clean = {
        ...data,
        email: data.email || undefined,
        address: data.address || undefined,
        gstNumber: data.gstNumber || undefined,
      };

      if (isEditing) {
        await customersApi.update(customer.id, clean);
        toast.success('Customer updated');
      } else {
        await customersApi.create(clean);
        toast.success('Customer created');
      }
      reset();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save customer');
    } finally { setLoading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Customer' : 'Add Customer'} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name *" error={errors.name?.message} {...register('name')} />
          <Input label="Phone *" error={errors.phone?.message} {...register('phone')} />
        </div>
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Address" {...register('address')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="GST Number" {...register('gstNumber')} />
          <Input label="Credit Limit" type="number" step="1" error={errors.creditLimit?.message} {...register('creditLimit')} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{isEditing ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </Modal>
  );
}
