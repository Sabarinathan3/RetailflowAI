import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Same shell as the main app AuthLayout (theme + motion + card), for platform admin routes only.
 */
export function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-(--bg-primary) flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="h-10 w-10 rounded-xl bg-[#3B82F6] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-(--text-primary) tracking-tight">RetailFlow</h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-(--text-secondary) mt-2">
            Platform admin
          </p>
        </div>

        <div className="rounded-xl border border-(--border-color) bg-(--bg-card) shadow-xl shadow-black/50 overflow-hidden">
          {children}
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
          <p className="text-[12px] font-semibold text-(--text-secondary)">© 2026 RetailFlow AI</p>
          <div className="flex gap-4">
            <span className="text-[12px] font-bold text-(--text-secondary) uppercase tracking-widest">
              Admin console
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
