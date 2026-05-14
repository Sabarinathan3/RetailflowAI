import { CheckCircle2, Globe, Laptop, Smartphone } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

export function SocialProof() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.6 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const icons = [
    { icon: Globe, label: "GLOBAL" },
    { icon: Laptop, label: "TECH" },
    { icon: Smartphone, label: "MOBILE" },
    { icon: CheckCircle2, label: "TRUST" }
  ];

  return (
    <section className="py-8 border-y border-[var(--border-color)] bg-[var(--bg-card)]">
      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-sm text-[var(--text-secondary)]"
      >
        {icons.map(({ icon: Icon, label }) => (
          <motion.div 
            key={label}
            variants={item}
            whileHover={{ y: -2, color: "var(--text-primary)" }}
            className="group flex items-center gap-2 font-medium cursor-default transition-colors duration-300"
          >
            <Icon className="h-4 w-4 text-[#22D3EE] transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" /> 
            {label}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
