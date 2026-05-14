import { Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="h-10 w-10 rounded-xl bg-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">RetailFlow</h1>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xl shadow-black/50 overflow-hidden">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <p className="text-[12px] font-semibold text-[var(--text-secondary)]">© 2026 RetailFlow AI</p>
          <div className="flex gap-4">
            <a href="#" className="text-[12px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest">Support</a>
            <a href="#" className="text-[12px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest">Privacy</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

