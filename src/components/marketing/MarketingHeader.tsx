"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const brand = {
  name: 'Lebra.Ai',
  logo: '/lebra_ai_logo_transparent.png',
};

const navItems = [
  { href: '/landing', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky inset-x-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="flex h-20 items-center justify-between">
          <Link href="/landing" className="flex min-w-0 items-center" aria-label={`${brand.name} home`}>
            <Image
              src={brand.logo}
              alt={`${brand.name} logo`}
              width={1340}
              height={382}
              className="h-14 w-[210px] object-contain sm:w-[250px]"
              priority
            />
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-foreground/75 transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground">
              Sign In
            </Link>
            <Link href="/contact" className="rounded-full bg-gradient-to-r from-primary to-primary-glow px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_hsl(var(--primary)_/_0.5)] transition-all duration-300 hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground md:hidden"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileOpen ? (
          <div className="grid gap-1 pb-4 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-semibold" onClick={() => setMobileOpen(false)}>
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
