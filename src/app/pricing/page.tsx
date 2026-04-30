import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  Eyebrow,
  FaqSection,
  MarketingPage,
  PricingCard,
} from '@/components/marketing/MarketingLayout';
import { pricingPlans } from '@/components/marketing/marketingData';

export default function PricingPage() {
  return (
    <MarketingPage>
      <section className="px-5 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Eyebrow tone="amber">Pricing</Eyebrow>
          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">Simple plans for serious learning operations.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Start with a focused branded workspace, then expand into more tenants, learners, certificates, reports, and support as your academy grows.
          </p>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Eyebrow tone="green">Included Value</Eyebrow>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950">Pricing that considers the complete learning operation.</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Your LMS cost should reflect more than hosting. Lebra.Ai supports the practical work of running a branded academy: setup, user structure, learning paths, completion proof, and reporting clarity.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'Workspace branding and setup guidance',
              'Admin, manager, and learner surfaces',
              'Course, module, lesson, and quiz delivery',
              'Certificate workflows and verification paths',
              'Tenant-aware reporting and team insights',
              'Upgrade path for multi-tenant growth',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm font-bold text-slate-700">
                <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[32px] bg-blue-600 p-8 text-white sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.6fr] lg:items-center">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">Need a custom MPA rollout?</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-blue-50">
                If you need custom tenant counts, migration help, content onboarding, special billing, or dedicated support, we can shape an enterprise plan around your operating model.
              </p>
            </div>
            <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-blue-700">
              Request Custom Quote <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <FaqSection />
    </MarketingPage>
  );
}
