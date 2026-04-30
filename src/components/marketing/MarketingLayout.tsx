import Image from 'next/image';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import {
  BarChart3,
  BookOpenCheck,
  Building2,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileCheck2,
  Globe2,
  GraduationCap,
  Layers3,
  LifeBuoy,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquareText,
  MonitorPlay,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from 'lucide-react';
import { MarketingHeader } from './MarketingHeader';

const marketingFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const brand = {
  name: 'Lebra.Ai',
  logo: '/lebra_ai_logo_transparent.png',
  footerLogo: '/lebra_ai_logo_footer.png',
};

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr] lg:px-8">
        <div className="space-y-5">
          <Link href="/landing" className="inline-flex items-center">
            <Image
              src={brand.footerLogo}
              alt={`${brand.name} logo`}
              width={1340}
              height={382}
              className="h-14 w-[250px] object-contain"
            />
          </Link>
          <p className="max-w-sm text-sm leading-6 text-slate-300">
            A white-label learning platform for teams that need branded training portals, structured content delivery, certificates, analytics, and learner support in one managed system.
          </p>
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-300">
            <span className="rounded-full border border-white/15 px-3 py-1">Multi-tenant LMS</span>
            <span className="rounded-full border border-white/15 px-3 py-1">White-label ready</span>
            <span className="rounded-full border border-white/15 px-3 py-1">Built for scale</span>
          </div>
        </div>
        <FooterColumn title="Platform" links={[['Home', '/landing'], ['Features', '/features'], ['Pricing', '/pricing'], ['Contact', '/contact']]} />
        <FooterColumn title="Use Cases" links={[['Employee training', '/features'], ['Customer academies', '/features'], ['Compliance learning', '/features'], ['Partner enablement', '/features']]} />
        <FooterColumn title="Access" links={[['Admin login', '/admin/login'], ['Learner login', '/login'], ['Request demo', '/contact'], ['Support', '/contact']]} />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-xs text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Copyright 2026 {brand.name}. All rights reserved.</p>
          <p>Privacy minded. Enterprise ready. Designed for modern learning teams.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="mt-4 grid gap-3 text-sm text-slate-300">
        {links.map(([label, href]) => (
          <Link key={label} href={href} className="transition-colors hover:text-white">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MarketingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${marketingFont.className} min-h-screen bg-slate-50 text-slate-950 overflow-x-hidden`}>
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function Eyebrow({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'green' | 'amber' | 'rose' }) {
  const tones = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${tones[tone]}`}>
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

export function DashboardMockup() {
  const courses = [
    ['Cybersecurity Basics', '86%', 'bg-blue-500'],
    ['Sales Enablement', '72%', 'bg-emerald-500'],
    ['Workplace Safety', '94%', 'bg-amber-500'],
  ];

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-950 p-3 shadow-xl shadow-slate-300/50">
      <div className="rounded-2xl bg-white">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="h-2 w-28 rounded-full bg-slate-200" />
        </div>
        <div className="grid min-h-[420px] grid-cols-1 gap-4 sm:grid-cols-[150px_1fr]">
          <aside className="border-r border-slate-200 bg-slate-50 p-4">
            <div className="mb-6 h-8 w-20 rounded-lg bg-slate-900" />
            <div className="space-y-3">
              {[BookOpenCheck, UsersRound, BarChart3, FileCheck2].map((Icon, index) => (
                <div key={index} className={`flex h-10 items-center gap-3 rounded-xl px-3 ${index === 0 ? 'bg-blue-600 text-white' : 'bg-white text-slate-500'}`}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden h-2 w-16 rounded-full bg-current opacity-30 sm:block" />
                </div>
              ))}
            </div>
          </aside>
          <section className="p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 h-4 w-28 rounded-full bg-blue-100" />
                <div className="h-7 w-48 rounded-lg bg-slate-900" />
              </div>
              <div className="h-10 w-32 rounded-full bg-slate-950" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Learners', '12,480', 'bg-blue-50 text-blue-700'],
                ['Completion', '88%', 'bg-emerald-50 text-emerald-700'],
                ['Certificates', '3,216', 'bg-amber-50 text-amber-700'],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className={`mb-5 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>{label}</div>
                  <div className="text-2xl font-bold">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-4 w-32 rounded-full bg-slate-200" />
                  <div className="h-8 w-20 rounded-full bg-slate-100" />
                </div>
                <div className="flex h-44 items-end gap-3">
                  {[42, 58, 49, 78, 66, 92, 83].map((height, index) => (
                    <div key={index} className="flex flex-1 items-end rounded-full bg-slate-100">
                      <div className="w-full rounded-full bg-blue-500" style={{ height: `${height}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-4 h-4 w-28 rounded-full bg-slate-200" />
                <div className="space-y-3">
                  {courses.map(([title, progress, color]) => (
                    <div key={title} className="rounded-xl bg-slate-50 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold">
                        <span className="truncate">{title}</span>
                        <span>{progress}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200">
                        <div className={`h-2 rounded-full ${color}`} style={{ width: progress }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export const homeHighlights = [
  { icon: Palette, title: 'White-label portals', text: 'Launch every academy with your logo, colors, domain, and learner-facing identity.' },
  { icon: Layers3, title: 'Multi-tenant control', text: 'Manage multiple organizations, teams, admins, learners, and catalogs from one command center.' },
  { icon: MonitorPlay, title: 'Content-rich courses', text: 'Deliver videos, documents, quizzes, modules, certificates, resources, and progress tracking.' },
  { icon: ShieldCheck, title: 'Operational governance', text: 'Keep access, reporting, user roles, and platform controls structured for serious teams.' },
];

export const featureGroups = [
  { icon: Building2, title: 'Tenant Management', text: 'Create branded workspaces for companies, schools, franchises, or departments with separate users, catalogs, settings, and analytics.' },
  { icon: GraduationCap, title: 'Learner Experience', text: 'Give learners a focused dashboard with assigned courses, progress, certificates, notes, achievements, and mobile-friendly course playback.' },
  { icon: BookOpenCheck, title: 'Course Authoring', text: 'Organize learning into courses, modules, lessons, videos, PDFs, resources, quizzes, reviews, and marketplace-ready global content.' },
  { icon: UsersRound, title: 'Teams and Roles', text: 'Group learners by department, cohort, job role, or client account, then assign targeted content and view segmented performance.' },
  { icon: BarChart3, title: 'Reports and Insights', text: 'Track completions, enrollment trends, activity, course engagement, certificates, team progress, and platform-level growth.' },
  { icon: LockKeyhole, title: 'Secure Access', text: 'Support admin, manager, and learner roles with session-based access, tenant-aware routes, and structured permission boundaries.' },
  { icon: FileCheck2, title: 'Certificates', text: 'Design completion certificates and issue verifiable records that make training outcomes visible and shareable.' },
  { icon: Globe2, title: 'Localization Ready', text: 'Prepare training experiences for distributed teams with tenant locale settings and translation-ready content workflows.' },
  { icon: LifeBuoy, title: 'Managed Support', text: 'Operate the platform with admin tooling, recovery paths, audit visibility, and practical support touchpoints for learners and admins.' },
];

export const pricingPlans = [
  {
    name: 'Launch',
    price: '₹14,999',
    note: 'per workspace / month',
    description: 'For small teams launching a branded training portal quickly.',
    features: ['1 branded tenant', 'Up to 500 learners', 'Course builder', 'Basic reports', 'Email support'],
  },
  {
    name: 'Scale',
    price: '₹39,999',
    note: 'per workspace / month',
    description: 'For growing academies and organizations with multiple teams.',
    features: ['5 branded tenants', 'Up to 5,000 learners', 'Teams and role assignment', 'Certificates', 'Priority support'],
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'tailored agreement',
    description: 'For high-volume training businesses with complex operating needs.',
    features: ['Unlimited tenant strategy', 'Custom onboarding', 'Advanced governance', 'Dedicated success support', 'Custom integrations'],
  },
];

export const contactMethods = [
  { icon: Mail, title: 'Email', text: 'skalathmika@gmail.com', href: 'mailto:skalathmika@gmail.com' },
  { icon: Phone, title: 'Phone', text: 'Schedule a guided call', href: '/contact' },
  { icon: MapPin, title: 'Region', text: 'Built for distributed teams', href: '/contact' },
  { icon: MessageSquareText, title: 'Support', text: 'Platform, onboarding, and learner operations', href: '/contact' },
];

export const faqs = [
  { q: 'Can every client have a separate branded LMS?', a: 'Yes. The platform is structured for multiple tenant workspaces, each with its own brand, learner access, content, teams, and settings.' },
  { q: 'Can we sell or distribute shared courses?', a: 'Yes. Global marketplace workflows let platform owners publish reusable content and let tenants claim or use it inside their own workspace.' },
  { q: 'Does it support certificates and reporting?', a: 'Yes. Certificates, completion tracking, learner activity, admin reports, and team-level progress are core parts of the system.' },
  { q: 'Can we start with one workspace and grow later?', a: 'Yes. Start with a focused academy, then expand into more tenants, teams, courses, roles, and reporting as your learning operation grows.' },
];

export function FeatureCard({ icon: Icon, title, text }: { icon: typeof Zap; title: string; text: string }) {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700 shadow-sm">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}

export function PricingCard({ plan }: { plan: (typeof pricingPlans)[number] }) {
  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${plan.featured ? 'border-slate-950 bg-slate-950 text-white shadow-xl shadow-slate-300' : 'border-slate-200 bg-white text-slate-950'}`}>
      {plan.featured && <div className="mb-5 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-950">Most Popular</div>}
      <h3 className="text-2xl font-bold">{plan.name}</h3>
      <p className={`mt-3 text-sm leading-6 ${plan.featured ? 'text-slate-300' : 'text-slate-600'}`}>{plan.description}</p>
      <div className="mt-8">
        <span className="text-4xl font-bold">{plan.price}</span>
        <p className={`mt-2 text-sm ${plan.featured ? 'text-slate-300' : 'text-slate-500'}`}>{plan.note}</p>
      </div>
      <Link href="/contact" className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.02] ${plan.featured ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'}`}>
        Talk to Sales <ChevronRight className="h-4 w-4" />
      </Link>
      <div className="mt-8 space-y-4">
        {plan.features.map((feature) => (
          <div key={feature} className="flex gap-3 text-sm">
            <Check className={`mt-0.5 h-4 w-4 flex-none ${plan.featured ? 'text-emerald-300' : 'text-emerald-600'}`} />
            <span className={plan.featured ? 'text-slate-200' : 'text-slate-700'}>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <Eyebrow tone="amber">Questions</Eyebrow>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Clear answers for serious learning teams.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {faqs.map((item) => (
            <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <CircleHelp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-950">{item.q}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProcessBand() {
  const steps = [
    ['01', 'Brand the workspace', 'Add identity, domains, colors, logos, and the training model that fits your organization.'],
    ['02', 'Build the academy', 'Create courses, modules, lessons, quizzes, teams, roles, and certificate templates.'],
    ['03', 'Launch and measure', 'Invite learners, monitor progress, issue certificates, and improve training with reports.'],
  ];

  return (
    <section className="px-5 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[32px] bg-slate-950 p-6 text-white sm:p-10 lg:p-12">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <Eyebrow tone="green">Workflow</Eyebrow>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">From empty portal to operating academy.</h2>
            <p className="mt-5 text-sm leading-7 text-slate-300">
              Lebra.Ai is designed for the practical work behind learning operations: setup, content, enrollment, governance, measurement, and ongoing support.
            </p>
          </div>
          <div className="grid gap-4">
            {steps.map(([number, title, text]) => (
              <div key={number} className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:grid-cols-[72px_1fr]">
                <div className="text-2xl font-bold text-emerald-300">{number}</div>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function MetricStrip() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 px-5 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['99.9%', 'Platform availability target'],
          ['24/7', 'Learner-ready access'],
          ['Multi', 'Tenant operating model'],
          ['1', 'Central admin command center'],
        ].map(([value, label]) => (
          <div key={label} className="text-center">
            <div className="text-4xl font-bold text-slate-950">{value}</div>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TrustBand() {
  return (
    <section className="px-5 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
        {[
          [Clock3, 'Fast setup', 'A practical launch path for teams that do not want months of LMS implementation work.'],
          [ShieldCheck, 'Structured control', 'Admin, tenant, manager, and learner surfaces keep responsibility clearly separated.'],
          [Zap, 'Growth ready', 'Start with one branded portal and grow into a managed learning ecosystem.'],
        ].map(([Icon, title, text]) => (
          <div key={title as string} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-950">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
