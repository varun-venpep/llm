import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  CapabilityGrid,
  CtaSection,
  FaqSection,
  HeroDashboardImage,
  HowItWorks,
  MarketingPage,
  PillBadge,
  RolesSection,
} from '@/components/marketing/MarketingLayout';

export const metadata: Metadata = {
  title: 'LMS Features for AI Training Academies | Lebra.AI',
  description: 'Explore LMS features with AI course creation, learning management software, training management software, learning analytics, and certificates.',
  keywords: [
    'lms features',
    'ai course creation',
    'training management software',
    'learning analytics platform',
    'lms learning management system',
    'learning management software',
    'best learning management system'
  ],
  alternates: {
    canonical: 'https://lebra.ai/features',
  },
};

export default function FeaturesPage() {
  return (
    <MarketingPage>
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <PillBadge>Features</PillBadge>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
              A full LMS toolkit for branded training at scale.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Build courses with AI, launch tenant-specific workspaces, manage learners, issue certificates, and measure training outcomes without splitting the work across tools.
            </p>
            <div className="mt-8 grid gap-3">
              {['AI-assisted course and quiz creation', 'Tenant-aware portals and role-based access', 'Courses, modules, lessons, quizzes, certificates, and reports'].map((item) => (
                <div key={item} className="flex gap-3 text-sm font-bold text-foreground/80">
                  <CheckCircle2 className="h-5 w-5 flex-none text-accent" />
                  {item}
                </div>
              ))}
            </div>
            <Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-glow px-7 py-4 text-sm font-bold text-white">
              Discuss Requirements <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <HeroDashboardImage />
        </div>
      </section>
      <CapabilityGrid />
      <RolesSection />
      <HowItWorks />
      <FaqSection />
      <CtaSection />
    </MarketingPage>
  );
}
