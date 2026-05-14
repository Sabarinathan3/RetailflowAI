import { Link } from 'react-router-dom';

export function CTASection() {
  return (
    <section className="py-16">
      <div className="max-w-5xl mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl py-16 px-6 md:px-12 text-center space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Ready to transform your retail business?
        </h2>
        <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
          Join 5,000+ businesses using RetailFlow to drive efficiency and growth. Start your 14-day free trial today.
        </p>
        <div className="flex gap-4 justify-center flex-col sm:flex-row items-center">
          <Link to="/register">
            <button className="bg-[#3B82F6] text-white hover:bg-blue-500 rounded-lg px-6 py-3 font-medium w-full sm:w-auto transition-all duration-200">
              Get started for free
            </button>
          </Link>
          <button className="border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] rounded-lg px-6 py-3 font-medium w-full sm:w-auto transition-all duration-200">
            Contact sales
          </button>
        </div>
        <p className="text-[var(--text-secondary)] text-xs tracking-wide uppercase font-medium">
          No credit card required • 14-day free trial
        </p>
      </div>
    </section>
  );
}
