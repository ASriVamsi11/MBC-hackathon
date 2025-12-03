'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { DollarSign, Wallet, Menu, X, Home, Zap, Trophy, Users, Search, User } from 'lucide-react';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { username } = useUsername(address);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <DollarSign className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">BetterTogether</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Challenge friends on Polymarket</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {!mounted ? (
              <div className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse" />
            ) : !isConnected ? (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Wallet size={20} />
                <span className="hidden sm:inline">Connect</span>
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="hidden sm:block text-right hover:opacity-80 transition">
                  <div className="text-sm font-medium text-gray-900">
                    {username || formatAddress(address!)}
                  </div>
                </Link>
                <button
                  onClick={() => disconnect()}
                  className="hidden sm:block px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition"
                >
                  Disconnect
                </button>

                {/* Desktop Menu Button */}
                <div className="hidden sm:block relative">
                  <button
                    onClick={() => setDesktopMenuOpen(!desktopMenuOpen)}
                    className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
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
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                        <Link
                          href="/"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-gray-700"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Home size={20} />
                          <span className="font-medium">Home</span>
                        </Link>
                        <Link
                          href="/create"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-gray-700"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Zap size={20} />
                          <span className="font-medium">Create Challenge</span>
                        </Link>
                        <Link
                          href="/my-escrows"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-gray-700"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Trophy size={20} />
                          <span className="font-medium">My Challenges</span>
                        </Link>
                        <div className="border-t border-gray-200 my-2" />
                        <Link
                          href="/leaderboard"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-gray-700"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Trophy size={20} className="text-yellow-500" />
                          <span className="font-medium">Leaderboard</span>
                        </Link>
                        <Link
                          href="/friends"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-gray-700"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Users size={20} />
                          <span className="font-medium">Friends</span>
                        </Link>
                        <Link
                          href="/search"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-gray-700"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <Search size={20} />
                          <span className="font-medium">Search Users</span>
                        </Link>
                        <div className="border-t border-gray-200 my-2" />
                        <Link
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-gray-700"
                          onClick={() => setDesktopMenuOpen(false)}
                        >
                          <User size={20} className="text-indigo-600" />
                          <span className="font-medium">Profile</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && mounted && (
          <div className="sm:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <nav className="flex flex-col gap-3">
              <Link href="/" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                <Home size={20} />
                Home
              </Link>
              <Link href="/create" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                <Zap size={20} />
                Create Challenge
              </Link>
              {isConnected && (
                <>
                  <Link href="/my-escrows" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                    <Trophy size={20} />
                    My Challenges
                  </Link>
                  <div className="border-t border-gray-200 my-2" />
                  <Link href="/leaderboard" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                    <Trophy size={20} className="text-yellow-500" />
                    Leaderboard
                  </Link>
                  <Link href="/friends" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                    <Users size={20} />
                    Friends
                  </Link>
                  <Link href="/search" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                    <Search size={20} />
                    Search Users
                  </Link>
                  <Link href="/profile" className="flex items-center gap-3 text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                    <User size={20} />
                    Profile
                  </Link>
                  <div className="border-t border-gray-200 my-2" />
                  <button
                    onClick={() => {
                      disconnect();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-red-600 hover:text-red-700 font-medium py-2 transition flex items-center gap-3"
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