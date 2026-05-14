import {
  Navbar,
  Hero,
  SocialProof,
  FeaturesGrid,
  AIShowcase,
  POSShowcase,
  CTASection,
  Footer,
} from './components';

export function LandingPage() {
  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        <Navbar />
        <main className="space-y-16">
          <Hero />
          <SocialProof />
          <FeaturesGrid />
          <AIShowcase />
          <POSShowcase />
          <CTASection />
        </main>
        <Footer />
      </div>
    </div>
  );
}

