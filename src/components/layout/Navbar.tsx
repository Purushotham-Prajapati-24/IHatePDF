import React from 'react';
import { useFileStore } from '../../store/useFileStore';
import { Link } from 'react-router-dom';
import { Moon, Sun, ShieldCheck, BarChart3, History as HistoryIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Navbar: React.FC = () => {
  const { theme, setTheme } = useFileStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-bg-dark/80 border-b border-border-glass transition-colors duration-300">
      <div className="max-w-[1440px] mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/80 shadow-[0_0_20px_hsla(354,76%,49%,0.4)]">
            <span className="font-outfit font-bold text-white text-xl">IH</span>
          </div>
          <span className="font-outfit font-bold text-xl tracking-tight text-text-primary hidden sm:block">
            IHate<span className="text-brand-primary">PDF</span>
          </span>
        </div>

        {/* Center Badge */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/5">
          <ShieldCheck className="w-4 h-4 text-brand-primary" />
          <span className="text-xs font-semibold text-brand-primary/90 tracking-wide">
            100% Client-Side. Your files never leave your computer.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="hidden items-center gap-2 rounded-full border border-border-glass px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-primary sm:flex"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            to="/history"
            className="hidden items-center gap-2 rounded-full border border-border-glass px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-brand-primary lg:flex"
          >
            <HistoryIcon className="h-4 w-4" />
            History
          </Link>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-border-glass transition-colors text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
