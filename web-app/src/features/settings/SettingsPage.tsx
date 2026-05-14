import { useState, useEffect } from 'react';
import { Settings, Store, Users, Lock, Palette, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { branchesApi } from '@/api/branches.api';
import type { Branch } from '@/types/branch.types';
import { BranchModal } from './BranchModal';
import { useBranchStore } from '@/store/branch.store';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'branches' | 'appearance'>('general');
  const [branches, setBranchesState] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);

  const { setBranches: setGlobalBranches } = useBranchStore();

  const loadBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await branchesApi.list();
      if (res.success) {
        setBranchesState(res.data);
        setGlobalBranches(res.data);
      }
    } catch {
      toast.error('Failed to load branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'branches') {
      loadBranches();
    }
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await branchesApi.delete(id);
      toast.success('Branch deleted');
      loadBranches();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete branch');
    }
  };

  const handleEdit = (b: Branch) => {
    setBranchToEdit(b);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setBranchToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <PageHeader title="Settings" subtitle="Manage your shop preferences" />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-1">
          <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}>
            <Store className="h-5 w-5" /> General Info
          </button>
          <button onClick={() => setActiveTab('branches')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'branches' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}>
            <Users className="h-5 w-5" /> Branches
          </button>
          <button onClick={() => setActiveTab('appearance')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'appearance' ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}>
            <Palette className="h-5 w-5" /> Appearance
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <Card>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Shop Information</h3>
              <div className="space-y-4 max-w-md">
                <Input label="Shop Name" defaultValue="RetailFlow Demo" />
                <Input label="Support Email" defaultValue="support@retailflow.com" />
                <Input label="Contact Phone" defaultValue="+91 9876543210" />
                <Input label="GST Number" defaultValue="29XXXXX1234X1Z5" />
                <div className="pt-4">
                  <Button onClick={() => toast.success('Settings saved')}>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'branches' && (
            <Card>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Manage Branches</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Create and manage your shop locations</p>
                </div>
                <Button size="sm" onClick={handleAdd}>Add Branch</Button>
              </div>

              {loadingBranches ? (
                <div className="text-sm text-[var(--text-muted)] animate-pulse">Loading branches...</div>
              ) : branches.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] border border-dashed border-[var(--border-color)] rounded-xl">
                  No branches found. Add one to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {branches.map((branch) => (
                    <div key={branch.id} className="p-4 border border-[var(--border-color)] rounded-xl flex justify-between items-center bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/60 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--text-primary)]">{branch.name}</p>
                          {branch.isMain && <Badge variant="warning">Main</Badge>}
                          <Badge variant={branch.isActive ? 'success' : 'default'}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                          {branch.city ? `${branch.city}${branch.state ? `, ${branch.state}` : ''}` : 'No location specified'} 
                          {branch.phone ? ` • ${branch.phone}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(branch)} className="h-8 px-2">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!branch.isMain && (
                          <Button variant="outline" size="sm" onClick={() => handleDelete(branch.id)} className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Theme Preferences</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">Toggle between light and dark themes using the button in the top navigation bar.</p>
              <div className="p-4 border border-primary-500/30 bg-primary-500/5 rounded-xl text-sm text-primary-600 dark:text-primary-400">
                You are currently using the default RetailFlow AI theme. Custom branding will be available in the next major update.
              </div>
            </Card>
          )}
        </div>
      </div>

      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadBranches}
        branchToEdit={branchToEdit}
      />
    </div>
  );
}
