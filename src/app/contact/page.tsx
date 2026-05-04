import Link from 'next/link';
import { ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { MarketingPage, PillBadge } from '@/components/marketing/MarketingLayout';
import { contactMethods } from '@/components/marketing/marketingData';

export default function ContactPage() {
  return (
    <MarketingPage>
      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <PillBadge>Contact</PillBadge>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
              Let us design the right learning platform for your team.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Tell us what you want to train, who needs access, how many workspaces you expect, and what reporting matters. We will help map the launch plan.
            </p>
            <div className="mt-8 grid gap-3">
              {['Workspace strategy', 'Course and certificate planning', 'Learner onboarding and reporting'].map((item) => (
                <div key={item} className="flex gap-3 text-sm font-bold text-foreground/80">
                  <CheckCircle2 className="h-5 w-5 flex-none text-accent" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-background p-6 shadow-[0_25px_60px_-20px_hsl(var(--primary)_/_0.25)]">
            <div className="grid gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Name</label>
                <input className="mt-2 w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-background" placeholder="Your name" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Work Email</label>
                  <input className="mt-2 w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-background" placeholder="you@company.com" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Learners</label>
                  <select className="mt-2 w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-background">
                    <option>Under 500</option>
                    <option>500 - 5,000</option>
                    <option>5,000+</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">What are you building?</label>
                <textarea className="mt-2 min-h-36 w-full rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:bg-background" placeholder="Example: a branded LMS for employee training across 6 departments..." />
              </div>
              <Link href="mailto:skalathmika@gmail.com?subject=Lebra.Ai%20Platform%20Demo%20Request" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-glow px-7 py-4 text-sm font-bold text-white transition-transform hover:scale-[1.02]">
                Send Request <Send className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-secondary/30 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map(({ icon: Icon, title, text, href }) => (
            <Link key={title} href={href} className="rounded-2xl border border-border bg-background p-6 transition-transform hover:-translate-y-1">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="surface-dark mx-auto max-w-7xl rounded-[2rem] p-8 text-white sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-center">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight">Prefer to start with the admin portal?</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/70">
                If your workspace already exists, sign in and continue configuring tenants, learners, courses, certificates, and reports from the platform dashboard.
              </p>
            </div>
            <Link href="/admin/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-surface-dark">
              Go To Admin Login <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
