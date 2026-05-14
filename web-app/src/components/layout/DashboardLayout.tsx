import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/utils/cn';
import { motion } from 'framer-motion';
import { branchesApi } from '@/api/branches.api';
import { useBranchStore } from '@/store/branch.store';

export function DashboardLayout() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const setBranches = useBranchStore((s) => s.setBranches);
  const didLoadBranches = useRef(false);

  useEffect(() => {
    if (didLoadBranches.current) return;
    didLoadBranches.current = true;

    branchesApi
      .list()
      .then((res) => {
        if (res.success) setBranches(res.data);
      })
      .catch(() => {
        // ignore — auth/refresh interceptor will handle session issues
      });
  }, [setBranches]);

  return (
    <div className="min-h-screen bg-(--bg-primary)">
      <Sidebar />
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-64')}>
        <Topbar />
        <main className="px-6 md:px-12 lg:px-20 py-6 md:py-8 text-(--text-primary)">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}

