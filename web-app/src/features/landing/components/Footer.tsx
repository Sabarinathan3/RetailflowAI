import { 
  Sparkles, 
  Mail, 
  ArrowRight,
  CircleDot
} from 'lucide-react';
import { motion } from 'framer-motion';

const footerLinks = {
  Product: [
    'POS Billing',
    'Inventory Management',
    'Credit Ledger',
    'Notifications',
    'Analytics Dashboard',
    'Purchase Orders',
    'Supplier Management'
  ],
  Solutions: [
    'Retail Stores',
    'Supermarkets',
    'Pharmacies',
    'Restaurants',
    'Small Businesses',
    'Enterprise Retail'
  ],
  Resources: [
    'Documentation',
    'API Reference',
    'Help Center',
    'Tutorials',
    'Blog',
    'System Status'
  ],
  Company: [
    'About Us',
    'Careers',
    'Contact',
    'Pricing',
    'Partners',
    'Customers'
  ],
  Legal: [
    'Privacy Policy',
    'Terms of Service',
    'Cookie Policy',
    'Security',
    'Compliance'
  ]
};

const GithubIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const socialLinks = [
  { icon: <TwitterIcon className="h-4 w-4" />, href: '#' },
  { icon: <LinkedinIcon className="h-4 w-4" />, href: '#' },
  { icon: <GithubIcon className="h-4 w-4" />, href: '#' },
  { icon: <Mail className="h-4 w-4" />, href: '#' },
];

export function Footer() {
  return (
    <footer className="relative bg-[var(--bg-primary)] overflow-hidden border-t border-[var(--border-color)]">
      {/* Background Subtle Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/10 dark:bg-primary-500/5 blur-[120px] rounded-full pointer-events-none transform -translate-y-1/2" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none transform -translate-y-1/2" />

      {/* Top Gradient Divider */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--border-color)] to-transparent opacity-50" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-12 relative z-10">
        
        {/* Top Section: Newsletter & Call to Action (Optional premium feature) */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-20 pb-12 border-b border-[var(--border-color)] border-opacity-50">
          <div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
              Ready to transform your retail business?
            </h3>
            <p className="text-[var(--text-secondary)]">
              Join thousands of retailers using AI to grow faster.
            </p>
          </div>
          <div className="flex w-full lg:w-auto items-center gap-3">
            <div className="relative w-full sm:w-72">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
              />
            </div>
            <button className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl py-3 px-5 flex items-center justify-center transition-colors shrink-0 font-medium text-sm shadow-lg shadow-primary-500/25">
              Subscribe
            </button>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column (Left) */}
          <div className="col-span-2 lg:col-span-2 flex flex-col items-start pr-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2.5 mb-6"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">RetailFlow</span>
            </motion.div>
            
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8">
              The modern AI-powered operating system for retail businesses. Smart POS, inventory, billing, analytics, and automation in one seamless platform.
            </p>

            <div className="flex items-center gap-4">
              {socialLinks.map((social, i) => (
                <a 
                  key={i} 
                  href={social.href}
                  className="h-9 w-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-primary-500 hover:border-primary-500/50 hover:bg-primary-500/5 transition-all duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([title, links], idx) => (
            <div key={title} className="col-span-1">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-5 tracking-tight">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a 
                      href="#" 
                      className="group relative inline-flex text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
                    >
                      <span>{link}</span>
                      {/* Animated hover underline */}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-primary-500/50 transition-all duration-300 group-hover:w-full" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border-color)] border-opacity-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              © 2026 RetailFlow AI. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Built with AI</span>
            </div>
            
            <div className="h-4 w-px bg-[var(--border-color)] hidden sm:block" />
            
            <div className="px-2.5 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-mono text-[var(--text-secondary)]">
              v2.1.0
            </div>

            <div className="h-4 w-px bg-[var(--border-color)] hidden sm:block" />

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CircleDot className="h-3 w-3 fill-emerald-500" />
              All systems operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
