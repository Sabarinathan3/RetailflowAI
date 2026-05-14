import { CheckCircle2, BrainCircuit } from 'lucide-react';

export function AIShowcase() {
  return (
    <section className="py-16 space-y-10 bg-[var(--bg-primary)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-[#22D3EE] uppercase tracking-widest">Advanced AI</p>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] leading-tight">
              Make decisions with <span className="text-[#3B82F6]">confidence.</span>
            </h2>
            <p className="text-[var(--text-secondary)]">
              Stop guessing and start growing. Our AI analyzes your historical data to predict future trends, identify risks, and optimize your operations automatically.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Demand Prediction', desc: 'Know exactly what will sell next week.' },
              { title: 'Credit Risk Scoring', desc: 'Identify risky customer accounts instantly.' },
              { title: 'Sales Anomalies', desc: 'Spot unusual drops or spikes in real-time.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 text-[#3B82F6] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Chart Card */}
        <div className="bg-[var(--bg-card)] rounded-xl shadow-sm p-6 border border-[var(--border-color)] h-full">
          {/* Chart header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
              <p className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-widest">Inventory Forecast</p>
            </div>
            <span className="text-xs font-medium text-[#22D3EE] bg-[var(--bg-primary)] border border-[var(--border-color)] px-2 py-0.5 rounded">98.4% Accuracy</span>
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-1.5 h-36 mb-5 border-b border-[var(--border-color)] pb-2">
            {[30, 45, 25, 60, 80, 50, 70, 90, 40, 60, 55, 75].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 bg-[var(--bg-primary)] rounded-t-sm relative group overflow-hidden border border-[var(--border-color)] border-b-0"
              >
                <div className="absolute inset-0 bg-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            ))}
          </div>

          {/* AI recommendation */}
          <div className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-start gap-3">
            <div className="h-9 w-9 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center shrink-0 text-[#22D3EE]">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">AI Recommendation</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Increase stock of "Essential Headphones" by 12% for next week.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
