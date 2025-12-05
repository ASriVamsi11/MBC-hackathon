'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const savedMode = localStorage.getItem('darkMode');
    const isDark = savedMode === 'true';
    
    setDarkMode(isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Return the same structure during SSR and client-side
  // Just don't show the icon until mounted
  return (
    <button
      onClick={toggle}
      className="p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
      aria-label="Toggle dark mode"
      suppressHydrationWarning
    >
      {mounted ? (darkMode ? <Sun size={20} /> : <Moon size={20} />) : <div className="w-5 h-5" />}
    </button>
  );
}