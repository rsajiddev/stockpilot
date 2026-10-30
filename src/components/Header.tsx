'use client';

import React, { useState } from 'react';
import { Search, Moon, Sun } from 'lucide-react';

export default function Header() {
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    const isDark = !dark;
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#121B2D]/95 backdrop-blur border-b border-[#E8ECF1] dark:border-[#1F2A3F] px-6 flex items-center justify-between">
      <div className="relative w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Global search (products, customers)..."
          className="w-full pl-9 pr-4 py-1.5 bg-[#F6F8FA] dark:bg-[#0E1626] border border-[#E8ECF1] dark:border-[#1F2A3F] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#3E9A60]"
        />
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-xl border border-[#E8ECF1] dark:border-[#1F2A3F] flex items-center justify-center text-[#64748B] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-[#E8ECF1] dark:border-[#1F2A3F]">
          <div className="w-7 h-7 rounded-full bg-[#3E9A60] text-white flex items-center justify-center text-xs font-bold">
            AD
          </div>
          <span className="text-xs font-semibold text-[#0F1B2D] dark:text-[#E6EDF7]">Administrator</span>
        </div>
      </div>
    </header>
  );
}
