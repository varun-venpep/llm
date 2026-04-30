import Link from 'next/link';
import { ArrowRight, CheckCircle2, Send } from 'lucide-react';
import { Eyebrow, MarketingPage } from '@/components/marketing/MarketingLayout';
import { contactMethods } from '@/components/marketing/marketingData';

export default function ContactPage() {
  return (
    <MarketingPage>
      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <Eyebrow tone="rose">Contact</Eyebrow>
            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-slate-950 sm:text-6xl">Let’s design the right learning platform for your team.</h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Tell us what you want to train, who needs access, how many workspaces you expect, and what reporting matters. We will help you map the launch plan.
            </p>
            <div className="mt-8 grid gap-3">
              {['Workspace strategy', 'Course and certificate planning', 'Learner onboarding and reporting'].map((item) => (
                <div key={item} className="flex gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200">
            <div className="grid gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Name</label>
                <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white" placeholder="Your name" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Work Email</label>
                  <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white" placeholder="you@company.com" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Learners</label>
                  <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white">
                    <option>Under 500</option>
                    <option>500 - 5,000</option>
                    <option>5,000+</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">What are you building?</label>
                <textarea className="mt-2 min-h-36 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:bg-white" placeholder="Example: a branded LMS for employee training across 6 departments..." />
              </div>
              <Link href="mailto:skalathmika@gmail.com?subject=Libra.AI%20Platform%20Demo%20Request" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-bold text-white transition-transform hover:scale-[1.02]">
                Send Request <Send className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {contactMethods.map(({ icon: Icon, title, text, href }) => (
            <Link key={title} href={href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-1">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[32px] bg-slate-950 p-8 text-white sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-center">
            <div>
              <h2 className="text-4xl font-bold tracking-tight">Prefer to start with the admin portal?</h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                If your workspace already exists, sign in and continue configuring tenants, learners, courses, certificates, and reports from the platform dashboard.
              </p>
            </div>
            <Link href="/admin/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-slate-950">
              Go To Admin Login <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
