import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminShops } from './AdminShops';
import { useAdminStore } from '@/store/admin.store';
import { Card } from '@/components/ui/Card';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'shops'>('analytics');
  const platformAdmin = useAdminStore((s) => s.isAuthenticated);

  if (!platformAdmin) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <PageHeader title="Admin" subtitle="Platform controls" />
        <Card className="p-6 space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Overview and shop management for the platform run in the admin portal. Sign in with your
            platform administrator account to load live data here.
          </p>
          <Link
            to="/admin/login"
            className="inline-flex items-center justify-center rounded-lg font-medium px-4 py-2 text-sm bg-[#3B82F6] text-white hover:bg-blue-500 shadow-sm"
          >
            Open admin portal
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="System overview and master controls" />

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
          }`}
        >
          Overview & Analytics
        </button>
        <button
          onClick={() => setActiveTab('shops')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'shops'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-color)]'
          }`}
        >
          Manage Shops
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'shops' && <AdminShops />}
      </div>
    </div>
  );
}
