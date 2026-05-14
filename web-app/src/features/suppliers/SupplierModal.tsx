import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { suppliersApi } from '@/api/suppliers.api';
import type { Supplier } from '@/types/supplier.types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: Supplier | null;
}

export function SupplierModal({ isOpen, onClose, onSuccess, supplier }: SupplierModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    gstNumber: '',
    address: '',
    leadTimeDays: 0,
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        gstNumber: supplier.gstNumber || '',
        address: supplier.address || '',
        leadTimeDays: supplier.leadTimeDays || 0,
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        gstNumber: '',
        address: '',
        leadTimeDays: 0,
      });
    }
  }, [supplier, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        contactPerson: formData.contactPerson || undefined,
        gstNumber: formData.gstNumber || undefined,
        address: formData.address || undefined,
      };

      if (supplier) {
        await suppliersApi.updateSupplier(supplier.id, payload);
        toast.success('Supplier updated successfully');
      } else {
        await suppliersApi.createSupplier(payload);
        toast.success('Supplier added successfully');
      }
      onSuccess();
      onClose();
    } catch {
      toast.error(supplier ? 'Failed to update supplier' : 'Failed to add supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={supplier ? 'Edit Supplier' : 'Add New Supplier'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Supplier Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Acme Corp"
          />
          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            placeholder="e.g. John Doe"
          />
          <Input
            label="Phone Number"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. 9876543210"
          />
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="e.g. contact@acme.com"
          />
          <Input
            label="GST Number"
            value={formData.gstNumber}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
            placeholder="e.g. 22AAAAA0000A1Z5"
          />
          <Input
            label="Lead Time (Days)"
            type="number"
            min="0"
            value={formData.leadTimeDays.toString()}
            onChange={(e) => setFormData({ ...formData, leadTimeDays: parseInt(e.target.value) || 0 })}
            placeholder="e.g. 3"
          />
        </div>
        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Full business address"
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {supplier ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
