'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAppRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/t/') ||
    pathname?.startsWith('/login');
  
  // Public marketing pages stay in light mode; app areas keep their own theme settings.
  let storageKey = 'theme-learner';
  if (pathname?.includes('/super-admin')) {
    storageKey = 'theme-super-admin';
  } else if (pathname?.includes('/admin')) {
    storageKey = 'theme-admin';
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem={isAppRoute}
      forcedTheme={isAppRoute ? undefined : 'light'}
      storageKey={storageKey}
    >
      {children}
    </ThemeProvider>
  );
}
