import {
  CtaSection,
  FeaturesShowcase,
  HeroSection,
  HowItWorks,
  MarketingPage,
  PricingSection,
  ProblemSolution,
  RolesSection,
  TestimonialsSection,
  FaqSection,
} from '@/components/marketing/MarketingLayout';

export default function LandingPage() {
  return (
    <MarketingPage>
      <HeroSection />
      <ProblemSolution />
      <FeaturesShowcase />
      <HowItWorks />
      <RolesSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <CtaSection />
    </MarketingPage>
  );
}
