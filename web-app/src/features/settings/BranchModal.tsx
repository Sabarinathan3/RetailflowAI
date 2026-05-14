import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { branchesApi } from '@/api/branches.api';
import { toast } from 'sonner';
import type { Branch } from '@/types/branch.types';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branchToEdit?: Branch | null;
}

export function BranchModal({ isOpen, onClose, onSuccess, branchToEdit }: BranchModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (branchToEdit) {
      setFormData({
        name: branchToEdit.name,
        address: branchToEdit.address || '',
        city: branchToEdit.city || '',
        state: branchToEdit.state || '',
        phone: branchToEdit.phone || '',
        isActive: branchToEdit.isActive,
      });
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        isActive: true,
      });
    }
  }, [branchToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Branch name is required');
      return;
    }

    setLoading(true);
    try {
      if (branchToEdit) {
        await branchesApi.update(branchToEdit.id, formData);
        toast.success('Branch updated successfully');
      } else {
        await branchesApi.create(formData);
        toast.success('Branch created successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] rounded-xl w-full max-w-md shadow-2xl border border-[var(--border-color)] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {branchToEdit ? 'Edit Branch' : 'Add New Branch'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <Input
            label="Branch Name *"
            placeholder="e.g. Downtown Store"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoFocus
          />
          <Input
            label="Phone Number"
            placeholder="e.g. +1 234 567 890"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Address"
            placeholder="Street address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="State"
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--border-color)] text-primary-600 focus:ring-primary-500 bg-[var(--bg-secondary)]"
            />
            <label htmlFor="isActive" className="text-sm text-[var(--text-primary)]">
              Branch is Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : branchToEdit ? 'Update Branch' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
