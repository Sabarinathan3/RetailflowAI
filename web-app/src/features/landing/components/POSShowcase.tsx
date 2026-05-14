import { motion } from 'framer-motion';
import { ScanLine } from 'lucide-react';

// Import local video
import demoVideo from '@/assets/demo.mp4';

export function POSShowcase() {
  return (
    <section className="py-24 relative">
      {/* Background Glows */}
      <div className="absolute inset-0 bg-primary-500/5 dark:bg-primary-500/10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10 space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-700 dark:text-primary-400 text-xs font-bold uppercase tracking-widest shadow-sm"
          >
            <ScanLine className="h-4 w-4" /> Hardware Optimized
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight"
          >
            Checkout faster than ever.
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed"
          >
            A high-performance interface designed for speed. Full barcode support, keyboard shortcuts, and instant receipt printing.
          </motion.p>
        </div>

        {/* Video Preview Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="relative max-w-5xl mx-auto rounded-2xl md:rounded-[32px] p-2 md:p-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl shadow-primary-500/10"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-xl md:rounded-3xl bg-slate-900 shadow-inner">
            <video
              src={demoVideo}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover scale-[1.12] origin-center"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
