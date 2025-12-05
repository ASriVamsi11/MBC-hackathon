'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { DollarSign, Wallet, Menu, X, Home, Zap, Trophy, Users, Search, User } from 'lucide-react';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';
import DarkModeToggle from '@/components/DarkModeToggle';

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { username } = useUsername(address);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-white/80 dark:bg-gray-900/90 backdrop-blur-md shadow-lg border-b border-gray-100/50 dark:border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <DollarSign className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Base Bets</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Challenge friends on Polymarket</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Only render wallet UI after mount to prevent hydration mismatch */}
            {!mounted ? (
              <div className="w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ) : !isConnected ? (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-semibold transform hover:-translate-y-0.5"
              >
                <Wallet size={20} />
                <span className="hidden sm:inline">Connect</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="hidden sm:block text-right hover:opacity-80 transition">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {username || formatAddress(address!)}
                  </div>
                </Link>
                <button
                  onClick={() => disconnect()}
                  className="hidden sm:block px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md text-sm transition-all font-medium"
                >
                  Disconnect
                </button>

                {/* Desktop Menu Button */}
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                    className="p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all hover:shadow-md"
                  >
                    <Menu size={24} />
                  </button>

                  {/* Desktop Dropdown Menu */}
                  {desktopMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setDesktopMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100/50 dark:border-gray-800/50 py-2 z-20">
                        <Link
                          href="/"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition text-gray-700 dark:text-gray-300 rounded-lg mx-2"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Home size={20} />
                          <span className="font-medium">Home</span>
                        </Link>
                        <Link
                          href="/create"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition text-gray-700 dark:text-gray-300 rounded-lg mx-2"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Zap size={20} />
                          <span className="font-medium">Create Challenge</span>
                        </Link>
                        <Link
                          href="/my-escrows"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition text-gray-700 dark:text-gray-300 rounded-lg mx-2"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Trophy size={20} />
                          <span className="font-medium">My Challenges</span>
                        </Link>
                        <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                        <Link
                          href="/leaderboard"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition text-gray-700 dark:text-gray-300 rounded-lg mx-2"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Trophy size={20} className="text-yellow-500" />
                          <span className="font-medium">Leaderboard</span>
                        </Link>
                        <Link
                          href="/friends"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition text-gray-700 dark:text-gray-300 rounded-lg mx-2"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Users size={20} />
                          <span className="font-medium">Friends</span>
                        </Link>
                        <Link
                          href="/search"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition text-gray-700 dark:text-gray-300 rounded-lg mx-2"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Search size={20} />
                          <span className="font-medium">Search Users</span>
                        </Link>
                        <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition text-gray-700 dark:text-gray-300 rounded-lg mx-2"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                          <span className="font-medium">Profile</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Button - only show after mount */}
            {mounted && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu - only render after mount */}
        {mounted && mobileMenuOpen && (
          <div className="sm:hidden mt-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl px-3">
            <nav className="flex flex-col gap-2">
              <Link href="/" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 font-medium py-3 px-3 transition rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                <Home size={20} />
                Home
              </Link>
              <Link href="/create" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 font-medium py-3 px-3 transition rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                <Zap size={20} />
                Create Challenge
              </Link>
              {isConnected && (
                <>
                  <Link href="/my-escrows" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 font-medium py-3 px-3 transition rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    <Trophy size={20} />
                    My Challenges
                  </Link>
                  <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                  <Link href="/leaderboard" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 font-medium py-3 px-3 transition rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    <Trophy size={20} className="text-yellow-500" />
                    Leaderboard
                  </Link>
                  <Link href="/friends" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 font-medium py-3 px-3 transition rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    <Users size={20} />
                    Friends
                  </Link>
                  <Link href="/search" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 font-medium py-3 px-3 transition rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    <Search size={20} />
                    Search Users
                  </Link>
                  <Link href="/profile" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 font-medium py-3 px-3 transition rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                    <User size={20} />
                    Profile
                  </Link>
                  <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                  <button
                    onClick={() => {
                      disconnect();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-900/30 font-medium py-3 px-3 transition flex items-center gap-3 rounded-lg"
                  >
                    <Wallet size={20} />
                    Disconnect
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}