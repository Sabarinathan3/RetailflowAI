import { BarChart3, Box, CreditCard, Bell, BrainCircuit, Zap } from 'lucide-react';
import { Card } from './Card';

export function FeaturesGrid() {
  const features = [
    { icon: Zap, title: 'Lightning POS', desc: 'Accept payments in seconds. Built for speed, reliability, and ease of use.' },
    { icon: Box, title: 'Smart Inventory', desc: 'Real-time tracking that alerts you before you run out. Automated reordering.' },
    { icon: BrainCircuit, title: 'AI Insights', desc: 'Turn data into decisions with demand forecasting and sales anomaly detection.' },
    { icon: CreditCard, title: 'Credit Ledger', desc: 'Manage customer credit balances, track history, and send automated reminders.' },
    { icon: BarChart3, title: 'Deep Analytics', desc: 'Visualize your store performance with beautiful, interactive reporting dashboards.' },
    { icon: Bell, title: 'Instant Alerts', desc: 'Stay in the loop with real-time notifications across all your devices.' },
  ];

  return (
    <section className="py-16 space-y-10">
      {/* Section Header */}
      <div className="text-center space-y-3">
        <p className="text-xs font-semibold text-[#22D3EE] uppercase tracking-widest">Core Platform</p>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Everything you need to scale.</h2>
        <p className="text-[var(--text-secondary)]">A unified toolkit designed to replace multiple disjointed systems.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <Card key={i} icon={feature.icon} title={feature.title} description={feature.desc} />
        ))}
      </div>
    </section>
  );
}
