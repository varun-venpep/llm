import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import {
  DashboardMockup,
  Eyebrow,
  FaqSection,
  FeatureCard,
  MarketingPage,
  ProcessBand,
} from '@/components/marketing/MarketingLayout';
import { featureGroups } from '@/components/marketing/marketingData';

export default function FeaturesPage() {
  return (
    <MarketingPage>
      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Eyebrow>Features</Eyebrow>
            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">A full LMS toolkit for branded training at scale.</h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Every feature is designed around real learning operations: multiple tenants, learner assignment, content structure, certificates, reports, admin workflows, and dependable learner access.
            </p>
            <div className="mt-8 grid gap-3">
              {['Tenant-aware portals', 'Role-based administration', 'Courses, modules, lessons, quizzes, and certificates'].map((item) => (
                <div key={item} className="flex gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <DashboardMockup />
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Eyebrow tone="green">Capability Map</Eyebrow>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950">Everything needed to run learning as an organized service.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureGroups.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {[
            ['For platform owners', 'Create tenants, publish global courses, monitor marketplace claims, manage staff, and keep platform settings consistent.'],
            ['For tenant admins', 'Upload content, organize teams, invite learners, assign courses, design certificates, and review workspace activity.'],
            ['For learners', 'Open a clean dashboard, continue assigned lessons, take quizzes, review notes, and collect verified certificates.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-3xl bg-slate-950 p-7 text-white">
              <h3 className="text-2xl font-bold">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <ProcessBand />
      <FaqSection />

      <section className="px-5 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold tracking-tight text-slate-950">Want the feature set shaped around your training model?</h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">Share your learner groups, content format, and reporting needs. We will help map the right workspace structure.</p>
          <Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-bold text-white">
            Discuss Requirements <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </MarketingPage>
  );
}
