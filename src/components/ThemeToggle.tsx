'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-border/50" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 rounded-xl bg-secondary/20 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all active:scale-95 group relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun 
          size={20} 
          className={`absolute inset-0 transition-all duration-500 rotate-0 scale-100 ${theme === 'dark' ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} 
        />
        <Moon 
          size={20} 
          className={`absolute inset-0 transition-all duration-500 rotate-90 scale-0 opacity-0 ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} 
        />
      </div>
      
      {/* Subtle glow effect */}
      <div className={`absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'bg-blue-400/5' : 'bg-orange-400/5'}`} />
    </button>
  );
}
