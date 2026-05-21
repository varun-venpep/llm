import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Check,
  CircleHelp,
  Sparkles,
  Star,
} from 'lucide-react';
import { MarketingHeader } from './MarketingHeader';
import {
  faqs,
  featureGroups,
  homeHighlights,
  logoCloud,
  pricingPlans,
  problemPoints,
  roles,
  solutionPoints,
  testimonials,
  workflowSteps,
} from './marketingData';

const brand = {
  name: 'Lebra.Ai',
  footerLogo: '/lebra_ai_logo_footer.png',
};

const linkColumns = [
  { title: 'Product', links: [['Features', '/features'], ['Pricing', '/pricing'], ['Marketplace', '/features'], ['Integrations', '/contact']] },
  { title: 'Company', links: [['Home', '/landing'], ['Contact', '/contact'], ['Admin Login', '/admin/login'], ['Learner Login', '/login']] },
  { title: 'Resources', links: [['Docs', '/contact'], ['Help Center', '/contact'], ['Security', '/features'], ['Status', '/contact']] },
  { title: 'Use Cases', links: [['Employee training', '/features'], ['Customer academies', '/features'], ['Partner enablement', '/features'], ['Compliance learning', '/features']] },
];

function buttonClass(variant: 'hero' | 'outline' | 'dark' = 'hero') {
  const base = 'inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-sm font-bold transition-all duration-300';
  if (variant === 'outline') return `${base} border border-border bg-background text-foreground hover:bg-secondary`;
  if (variant === 'dark') return `${base} border border-white/15 bg-transparent text-white hover:bg-white/10`;
  return `${base} bg-gradient-to-r from-primary to-primary-glow text-white shadow-[0_15px_40px_-12px_hsl(var(--primary)_/_0.7)] hover:-translate-y-0.5`;
}

export function MarketingPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-background pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/landing" className="mb-4 inline-flex items-center">
              <Image src={brand.footerLogo} alt={`${brand.name} logo`} width={1340} height={382} className="h-14 w-[250px] object-contain" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              The modern, multi-tenant learning platform for branded academies, AI-assisted course creation, certificates, and real-time training analytics.
            </p>
          </div>
          {linkColumns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-4 text-sm font-bold">{column.title}</h4>
              <ul className="space-y-2.5">
                {column.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">Copyright 2026 {brand.name}. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Secure learning. Tenant-ready. Built for scale.</p>
        </div>
      </div>
    </footer>
  );
}

export function PillBadge({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={dark ? 'pill-badge-dark' : 'pill-badge'}>
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

export function SectionHeading({ badge, title, highlight, text, dark = false }: { badge: string; title: string; highlight?: string; text?: string; dark?: boolean }) {
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      <PillBadge dark={dark}>{badge}</PillBadge>
      <h2 className={`mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl ${dark ? 'text-white' : 'text-foreground'}`}>
        {title} {highlight ? <span className="text-gradient-primary">{highlight}</span> : null}
      </h2>
      {text ? <p className={`mt-5 text-lg ${dark ? 'text-white/70' : 'text-muted-foreground'}`}>{text}</p> : null}
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="surface-dark relative overflow-hidden">
      <div className="glow-orb -left-40 -top-40 h-[600px] w-[600px] bg-primary/30" />
      <div className="glow-orb -right-32 top-40 h-[500px] w-[500px] bg-primary-glow/25" />
      <div className="relative mx-auto max-w-7xl px-4 pt-32 pb-20 text-center sm:px-6 lg:pt-40 lg:pb-28">
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          AI quiz generation now live - build courses faster
        </div>
        <h1 className="animate-fade-up mx-auto mt-7 max-w-5xl text-5xl font-extrabold leading-[1.02] text-white [animation-delay:80ms] sm:text-6xl lg:text-7xl xl:text-8xl">
          Train your entire org on <span className="text-gradient-primary">one beautiful platform.</span>
        </h1>
        <p className="animate-fade-up mx-auto mt-7 max-w-2xl text-lg text-white/70 [animation-delay:160ms] sm:text-xl">
          Lebra.Ai is the multi-tenant LMS that helps you build courses with AI, deliver them across branded workspaces, and track every learner in one place.
        </p>
        <div className="animate-fade-up mt-10 flex flex-col justify-center gap-3 [animation-delay:240ms] sm:flex-row">
          <Link href="/contact" className={`${buttonClass('hero')} group`}>
            Start Your Workspace <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/contact" className={buttonClass('dark')}>
            Book a 15-min Demo
          </Link>
        </div>
        <div className="animate-fade-up mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-white/60 [animation-delay:320ms]">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> No credit card needed</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> Setup-friendly workflow</span>
          <span className="flex items-center gap-1.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Built for serious learning teams</span>
        </div>
        <HeroDashboardImage />
      </div>
    </section>
  );
}

export function HeroDashboardImage() {
  return (
    <div className="animate-fade-up relative mx-auto mt-16 max-w-6xl [animation-delay:400ms] lg:mt-20">
      <div className="absolute -inset-8 -z-10 bg-gradient-to-tr from-primary/30 via-primary-glow/20 to-accent/20 blur-3xl" />
      <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.6)] lg:rounded-3xl">
        <Image
          src="/marketing-assets/hero-dashboard.jpg"
          alt="Lebra.Ai course analytics dashboard"
          width={1536}
          height={1024}
          className="block h-auto w-full"
          priority
        />
      </div>
    </div>
  );
}

export function LogoCloud() {
  return (
    <section className="border-b border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Powering learning for modern teams and academies
        </p>
        <div className="grid grid-cols-2 items-center gap-x-8 gap-y-6 opacity-70 sm:grid-cols-3 lg:grid-cols-6">
          {logoCloud.map((logo) => (
            <div key={logo} className="text-center text-xl font-bold tracking-tight text-foreground/50 transition-colors hover:text-foreground">
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProblemSolution() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading badge="The Problem" title="Your training stack is" highlight="too scattered." text="Most teams stitch together multiple tools to deliver training. Lebra.Ai brings the workflow into one managed LMS." />
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-secondary/50 p-8">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <h3 className="text-lg font-bold">Without Lebra.Ai</h3>
            </div>
            <ul className="space-y-3">
              {problemPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                  <span className="line-through decoration-muted-foreground/40">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary-glow/5 p-8 shadow-[0_25px_60px_-20px_hsl(var(--primary)_/_0.35)]">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft">
                <Check className="h-4 w-4 text-accent" />
              </div>
              <h3 className="text-lg font-bold">With Lebra.Ai</h3>
            </div>
            <ul className="space-y-3">
              {solutionPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                  <span className="font-medium text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeatureCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_30px_-8px_hsl(var(--foreground)_/_0.08)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mb-1.5 font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}

export function FeaturesShowcase() {
  return (
    <section className="bg-secondary/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading badge="Features" title="Everything you need to" highlight="launch and scale." text="AI-native creation, tenant-aware delivery, certificates, and reporting without stitching tools together." />
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <ShowcaseCard
            icon={Sparkles}
            label="AI-Native"
            title="Generate full quizzes in seconds"
            text="Upload a video, PDF, or paste your content. Lebra.Ai creates multiple-choice questions, answer explanations, and difficulty grading for review."
            image="/marketing-assets/feature-ai.jpg"
            alt="AI quiz generation"
          />
          <ShowcaseCard
            icon={BarChart3}
            label="Multi-Tenant"
            title="A branded portal for every team or client"
            text="Spin up isolated workspaces with custom branding, domains, learners, course catalogs, and admin controls."
            image="/marketing-assets/feature-multitenant.jpg"
            alt="Multi-tenant workspaces"
          />
        </div>
        <div className="mb-6 grid items-center gap-8 rounded-3xl bg-gradient-to-br from-primary to-primary-glow p-8 text-white lg:grid-cols-3 lg:p-12">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-white/80">
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Analytics</span>
            </div>
            <h3 className="text-2xl font-bold lg:text-3xl">Know exactly who learned what in real time.</h3>
            <p className="mt-3 max-w-2xl text-white/80">
              Track completion, lesson position, quiz scores, engagement, and certificates at the learner, course, and team level.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center md:grid-cols-1">
            {[
              ['98%', 'Avg. completion'],
              ['3.2x', 'Faster onboarding'],
              ['24/7', 'Live insights'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                <div className="text-3xl font-extrabold">{value}</div>
                <div className="mt-1 text-xs text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureGroups.slice(0, 6).map((item) => <FeatureCard key={item.title} {...item} />)}
        </div>
      </div>
    </section>
  );
}

function ShowcaseCard({ icon: Icon, label, title, text, image, alt }: { icon: LucideIcon; label: string; title: string; text: string; image: string; alt: string }) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-border bg-background shadow-[0_8px_30px_-8px_hsl(var(--foreground)_/_0.08)] transition-all duration-500 hover:shadow-[0_25px_60px_-20px_hsl(var(--primary)_/_0.35)]">
      <div className="p-8 lg:p-10">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary">{label}</span>
        </div>
        <h3 className="text-2xl font-bold tracking-tight lg:text-3xl">{title}</h3>
        <p className="mt-3 text-muted-foreground">{text}</p>
      </div>
      <div className="px-8 pb-2 lg:px-10">
        <Image src={image} alt={alt} width={1024} height={768} className="w-full rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]" />
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="surface-dark relative overflow-hidden py-24">
      <div className="glow-orb left-1/4 top-20 h-[400px] w-[400px] bg-primary/20" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading badge="How it works" title="From signup to scaled academy" highlight="in 4 steps." dark />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((step) => (
            <div key={step.n} className="rounded-2xl border border-surface-dark-border bg-surface-dark-card p-6 transition-all duration-300 hover:border-primary/40">
              <div className="text-gradient-primary mb-4 text-4xl font-extrabold">{step.n}</div>
              <h3 className="mb-2 text-lg font-bold text-white">{step.title}</h3>
              <p className="text-sm leading-relaxed text-white/60">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RolesSection() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading badge="Roles and permissions" title="Built for" highlight="every role." text="Purpose-built surfaces for platform owners, admins, managers, instructors, and learners." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => <FeatureCard key={role.title} icon={role.icon} title={role.title} text={role.text} />)}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const stats = [
    ['2,000+', 'Teams supported'],
    ['2M+', 'Learners enrolled'],
    ['98%', 'Avg. completion rate'],
    ['4.9/5', 'Customer rating'],
  ];

  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto mb-20 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label} className="text-center">
              <div className="text-gradient-primary text-4xl font-extrabold sm:text-5xl">{value}</div>
              <div className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">{label}</div>
            </div>
          ))}
        </div>
        <SectionHeading badge="Customer love" title="Loved by" highlight="learning leaders." />
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.name} className="flex flex-col rounded-3xl border border-border bg-secondary/40 p-8">
              <div className="mb-4 flex gap-0.5">
                {[0, 1, 2, 3, 4].map((star) => <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
              </div>
              <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground/90">&quot;{item.quote}&quot;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-bold text-white">
                  {item.name.split(' ').map((name) => name[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-bold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.role}, {item.company}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingCard({ plan }: { plan: (typeof pricingPlans)[number] }) {
  return (
    <div className={`relative flex flex-col rounded-3xl p-8 ${plan.featured ? 'z-10 border-2 border-primary bg-background shadow-[0_25px_60px_-20px_hsl(var(--primary)_/_0.35)] lg:scale-105' : 'border border-border bg-background'}`}>
      {plan.featured ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary-glow px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_60px_hsl(var(--primary)_/_0.4)]">Most Popular</span> : null}
      <h3 className="text-xl font-bold">{plan.name}</h3>
      <p className="mt-1.5 mb-6 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          {'currency' in plan ? <span className="text-2xl font-semibold tracking-normal text-foreground">{plan.currency}</span> : null}
          <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{plan.note}</p>
      </div>
      <Link href="/contact" className={`${buttonClass(plan.featured ? 'hero' : 'outline')} mb-8 w-full`}>
        {plan.featured ? 'Start Planning' : 'Talk to Sales'}
      </Link>
      <ul className="space-y-3.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft">
              <Check className="h-3 w-3 text-accent" strokeWidth={3} />
            </span>
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PricingSection() {
  return (
    <section className="bg-secondary/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading badge="Pricing" title="Simple," highlight="transparent pricing." text="Start focused, then expand into more tenants, learners, certificates, reports, and support as your academy grows." />
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {pricingPlans.map((plan) => <PricingCard key={plan.name} plan={plan} />)}
        </div>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          All plans include secure access, platform updates, branded learning workflows, and a growth path for multi-tenant operations.
        </p>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section className="bg-secondary/30 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading badge="FAQ" title="Questions," highlight="answered." />
        <div className="space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-border bg-background px-6 transition-all open:border-primary/30 open:shadow-[0_8px_30px_-8px_hsl(var(--foreground)_/_0.08)]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left font-bold">
                {item.q}
                <CircleHelp className="h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-45" />
              </summary>
              <p className="pb-5 leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="surface-dark relative overflow-hidden rounded-[2rem] p-10 text-center sm:p-16 lg:p-20">
          <div className="glow-orb -top-40 left-1/4 h-[500px] w-[500px] bg-primary/30" />
          <div className="glow-orb -bottom-32 right-0 h-[400px] w-[400px] bg-primary-glow/30" />
          <div className="relative">
            <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Ready to ship your <span className="text-gradient-primary">academy this week?</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
              Start with one branded workspace, add learners and courses, then scale the training operation with confidence.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/contact" className={`${buttonClass('hero')} group`}>
                Plan My Launch <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/admin/login" className={buttonClass('dark')}>
                Go to Admin Login
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" strokeWidth={3} /> Workspace strategy</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" strokeWidth={3} /> Course planning</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" strokeWidth={3} /> Learner reporting</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CapabilityGrid() {
  return (
    <section className="bg-secondary/30 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading badge="Capability Map" title="Everything needed to run learning" highlight="as an organized service." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featureGroups.map((item) => <FeatureCard key={item.title} {...item} />)}
        </div>
      </div>
    </section>
  );
}

export { homeHighlights, pricingPlans };
