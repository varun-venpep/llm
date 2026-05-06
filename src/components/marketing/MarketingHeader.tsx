"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const brand = {
  name: 'Lebra.Ai',
  colorLogo: '/lebra_ai_logo_transparent.png',
  lightLogo: '/lebra_ai_logo_footer.png',
};

const navItems = [
  { href: '/landing', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isLanding = pathname === '/landing' || pathname === '/';
  const logo = isLanding ? brand.lightLogo : brand.colorLogo;

  return (
    <header className={isLanding ? 'absolute inset-x-0 top-0 z-50 bg-transparent' : 'sticky inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md'}>
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <nav className="flex h-20 items-center justify-between">
          <Link href="/landing" className="flex min-w-0 items-center" aria-label={`${brand.name} home`}>
            <Image
              src={logo}
              alt={`${brand.name} logo`}
              width={1340}
              height={382}
              className="h-14 w-[210px] object-contain sm:w-[250px]"
              priority
            />
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={`text-sm font-medium transition-colors ${isLanding ? 'text-white/75 hover:text-white' : 'text-foreground/75 hover:text-foreground'}`}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isLanding ? 'text-white/75 hover:bg-white/10 hover:text-white' : 'text-foreground/75 hover:bg-secondary hover:text-foreground'}`}>
              Sign In
            </Link>
            <Link href="/contact" className="rounded-full bg-gradient-to-r from-primary to-primary-glow px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_hsl(var(--primary)_/_0.5)] transition-all duration-300 hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl md:hidden ${isLanding ? 'text-white' : 'text-foreground'}`}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileOpen ? (
          <div className={`grid gap-1 rounded-2xl p-3 shadow-2xl backdrop-blur md:hidden ${isLanding ? 'border border-white/10 bg-surface-dark/95' : 'border border-border bg-background/95'}`}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isLanding ? 'text-white/75 hover:bg-white/10 hover:text-white' : 'text-foreground/75 hover:bg-secondary hover:text-foreground'}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/login" className={`inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-semibold ${isLanding ? 'border-white/15 text-white' : 'border-border text-foreground'}`} onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-glow px-4 py-2.5 text-sm font-semibold text-white" onClick={() => setMobileOpen(false)}>
                Get Started
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
