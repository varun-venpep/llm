'use client';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Isolate theme storage based on the application area
  let storageKey = 'theme-student';
  if (pathname?.includes('/super-admin')) {
    storageKey = 'theme-super-admin';
  } else if (pathname?.includes('/admin')) {
    storageKey = 'theme-admin';
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem 
      storageKey={storageKey}
    >
      {children}
    </ThemeProvider>
  );
}
