import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

export function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
  };

  const badgeVariants: Variants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: "easeOut" } 
    },
    float: {
      y: [0, -4, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }
  };

  const words = "The intelligent operating system for".split(" ");

  return (
    <section className="py-16 space-y-10 relative">
      {/* Background micro-effect (very subtle gradient spot) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center space-y-8"
      >
        {/* Badge */}
        <motion.div 
          variants={badgeVariants}
          animate={["visible", "float"]}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-medium shadow-sm transition-all hover:shadow-md hover:border-primary-500/20"
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-[#3B82F6] animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          Trusted by 5,000+ modern retailers
        </motion.div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] max-w-3xl flex flex-wrap justify-center gap-x-2">
          {words.map((word, i) => (
            <motion.span key={i} variants={itemVariants} className="inline-block">
              {word}
            </motion.span>
          ))}
          <motion.span variants={itemVariants} className="text-[#3B82F6] inline-block">
            modern retail.
          </motion.span>
        </h1>

        {/* Sub-text */}
        <motion.p 
          variants={itemVariants}
          className="text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed"
        >
          Supercharge your store with an AI-powered POS, automated inventory, and real-time insights that actually make sense.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="flex gap-4 flex-col sm:flex-row w-full sm:w-auto pt-2">
          <Link to="/register" className="w-full sm:w-auto block">
            <motion.button 
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="group bg-[#3B82F6] hover:bg-blue-500 text-white rounded-lg px-6 py-3 font-medium flex items-center justify-center gap-2 w-full shadow-sm hover:shadow-blue-500/20 transition-all duration-300"
            >
              Start free trial 
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
          </Link>
          <motion.button 
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] rounded-lg px-6 py-3 font-medium w-full sm:w-auto shadow-sm hover:shadow-md transition-all duration-300"
          >
            Book a demo
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
}
