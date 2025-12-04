'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check localStorage
    const savedMode = localStorage.getItem('darkMode');
    const isDark = savedMode === 'true';
    
    console.log('Initial darkMode:', isDark);
    setDarkMode(isDark);
    
    // Apply to HTML
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    const newMode = !darkMode;
    console.log('Toggling to:', newMode ? 'DARK' : 'LIGHT');
    
    // Update state
    setDarkMode(newMode);
    
    // Update localStorage
    localStorage.setItem('darkMode', String(newMode));
    
    // Update HTML class
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Verify
    console.log('HTML now has dark class:', document.documentElement.classList.contains('dark'));
    console.log('localStorage now:', localStorage.getItem('darkMode'));
  };

  if (!mounted) {
    return <div className="w-10 h-10" />;
  }

  return (
    <button
      onClick={toggle}
      className="p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
      aria-label="Toggle dark mode"
    >
      {darkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}