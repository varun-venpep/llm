import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  ChevronRight,
  FileText,
  GraduationCap,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import {
  DashboardMockup,
  Eyebrow,
  FeatureCard,
  MarketingPage,
  MetricStrip,
  ProcessBand,
  TrustBand,
} from '@/components/marketing/MarketingLayout';
import { homeHighlights } from '@/components/marketing/marketingData';

export default function LandingPage() {
  return (
    <MarketingPage>
      <section className="relative overflow-hidden bg-slate-950 px-5 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.22),_transparent_30%)]" />
        <div className="pointer-events-none absolute -bottom-16 right-6 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl sm:right-16" />
        <div className="pointer-events-none absolute -bottom-14 left-6 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl sm:left-10" />
        <div className="mx-auto grid w-full max-w-7xl gap-10 py-10 sm:py-14 lg:grid-cols-[0.84fr_1.16fr] lg:items-center lg:py-8">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 shadow-sm shadow-slate-950/20">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              MPA Home
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.03] tracking-tight text-white sm:text-5xl lg:text-[64px]">
              AI-powered learning, built for every academy.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Deliver smarter education with an AI chat tutor, automated question generation, and intelligent learning workflows.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 px-7 py-4 text-sm font-semibold text-white shadow-2xl shadow-blue-500/20 transition duration-200 hover:-translate-y-0.5">
                Setup Your Workspace <ChevronRight className="h-5 w-5" />
              </Link>
              <Link href="/features" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-4 text-sm font-semibold text-white transition-colors hover:bg-white/15">
                Explore Features <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="mt-8 grid gap-3 rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-lg shadow-slate-950/10 sm:grid-cols-3">
              {[
                ['10 min', 'workspace kickoff'],
                ['4 roles', 'owner to learner'],
                ['100%', 'brand controlled'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-3xl bg-slate-900/60 p-6 text-white shadow-sm shadow-slate-950/10">
                  <div className="text-xl font-bold">{value}</div>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              {[
                ['Brand', 'Logo, color, domain'],
                ['Learn', 'Courses and quizzes'],
                ['Measure', 'Reports and certificates'],
              ].map(([title, text]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-slate-950/10">
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="mt-1 text-xs text-slate-300">{text}</div>
                </div>
              ))}
            </div>
            <DashboardMockup />
          </div>
        </div>
      </section>

      <MetricStrip />

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <Eyebrow tone="green">What You Get</Eyebrow>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">A complete front office for modern learning operations.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              The platform is built for teams that need more than a course library. It supports the operational details behind real training delivery: branding, enrollment, content, reporting, certificates, and learner support.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {homeHighlights.map((item) => (
              <FeatureCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Eyebrow tone="amber">Built For MPA Teams</Eyebrow>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950">One system for platform owners, admins, managers, and learners.</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              Whether you are training employees, customers, partners, franchise teams, or student cohorts, Lebra.Ai gives every audience a clean experience while keeping operations centralized.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [Building2, 'Platform Owners', 'Control tenants, marketplace content, global settings, staff access, and growth reporting.'],
              [UsersRound, 'Tenant Admins', 'Manage learners, teams, roles, courses, certificates, announcements, and workspace branding.'],
              [GraduationCap, 'Learners', 'View courses, continue lessons, complete quizzes, track progress, and download certificates.'],
              [BookOpenCheck, 'Managers', 'Monitor assigned teams, review progress, and keep learning aligned with team goals.'],
            ].map(([Icon, title, text]) => (
              <div key={title as string} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon className="h-7 w-7 text-blue-700" />
                <h3 className="mt-5 font-bold text-slate-950">{title as string}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProcessBand />

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70 sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div>
              <Eyebrow tone="rose">Ready To Launch</Eyebrow>
              <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950">Create a learning portal that looks owned, managed, and trustworthy from day one.</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Get the structure of an enterprise LMS with the flexibility of a modern SaaS platform. We can help you shape the first workspace, content model, user roles, and reporting rhythm.
              </p>
              <Link href="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-transform hover:scale-[1.02]">
                Plan My Launch <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="grid gap-4">
              {[
                [Sparkles, 'Branded academy experience'],
                [FileText, 'Course and certificate workflows'],
                [BadgeCheck, 'Admin-ready reporting'],
              ].map(([Icon, label]) => (
                <div key={label as string} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-950 shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-slate-950">{label as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TrustBand />
    </MarketingPage>
  );
}
