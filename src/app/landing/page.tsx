'use client';

import Image from 'next/image';
import { BookOpen, Users, Globe, ChevronRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-purple-500/30">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full glassmorphism px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight uppercase">InfiniteLMS</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
          <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
        </nav>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => window.location.href = '/login'}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Sign In
          </button>
          <button className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            Start Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              The Future of Learning
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight">
              Launch Your Own <br />
              <span className="gradient-text">Whitelabel LMS</span> <br />
              in Minutes.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
              Empower your staff, engage your students, and scale your brand with the world's most powerful managed learning ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                Setup Your Workspace <ChevronRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 rounded-full bg-secondary text-foreground font-bold text-lg hover:bg-secondary/80 transition-colors border border-border">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center gap-6 pt-8 border-t border-border/50">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary font-bold italic">500+</span> teams growing with Infinite
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
            <div className="relative glassmorphism rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/lms_platform_hero_1773035558238.png"
                alt="InfiniteLMS Dashboard Preview"
                width={800}
                height={600}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-border/30 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="space-y-2">
            <h3 className="text-4xl font-black gradient-text">99.9%</h3>
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Uptime</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-black gradient-text">24/7</h3>
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Support</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-black gradient-text">100+</h3>
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Integrations</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-black gradient-text">0%</h3>
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-widest">Down Time</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black">Everything you need to <span className="gradient-text">scale learning</span>.</h2>
            <p className="text-muted-foreground text-lg">Powerful features built for managed service providers and internal training teams.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-secondary/30 border border-border hover:border-blue-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-xl font-bold mb-4">Custom Domains</h4>
              <p className="text-muted-foreground leading-relaxed">Map your client's own domain or subdomain for a fully branded experience that feels internal.</p>
            </div>
            <div className="p-8 rounded-2xl bg-secondary/30 border border-border hover:border-purple-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h4 className="text-xl font-bold mb-4">Managed Onboarding</h4>
              <p className="text-muted-foreground leading-relaxed">Bulk enroll students and generate secure credentials instantly. Zero friction for your learners.</p>
            </div>
            <div className="p-8 rounded-2xl bg-secondary/30 border border-border hover:border-emerald-500/50 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="text-xl font-bold mb-4">Offline Payments</h4>
              <p className="text-muted-foreground leading-relaxed">Focus on content delivery. Collect fees through your own channels without complex platform cuts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:row-center justify-between gap-8 items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-foreground">InfiniteLMS</span>
          </div>
          <p>© 2026 InfiniteLMS. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary">Twitter</a>
            <a href="#" className="hover:text-primary">GitHub</a>
            <a href="#" className="hover:text-primary">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
