import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
      <div className="flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#3B82F6] flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">RetailFlow</span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'Solutions', 'Pricing', 'Resources'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="group relative text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
            >
              <span>{item}</span>
              <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#3B82F6] transition-all duration-300 group-hover:w-full rounded-full" />
            </a>
          ))}
        </div>

        {/* Auth actions */}
        <div className="flex items-center gap-4 shrink-0">
          <Link to="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-[#3B82F6] transition-colors duration-200">
            Log in
          </Link>
          <Link to="/register">
            <motion.button 
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="bg-[#3B82F6] hover:bg-blue-500 text-white rounded-lg px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow-blue-500/20 transition-all duration-300"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
