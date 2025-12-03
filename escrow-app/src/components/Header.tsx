'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { DollarSign, Wallet, Menu, X } from 'lucide-react';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';

export default function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { username } = useUsername(address);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration errors
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
              <h1 className="text-xl font-bold text-gray-900">ConditionalEscrow</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Challenge friends on Polymarket</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-700 hover:text-indigo-600 font-medium transition">
              Home
            </Link>
            <Link href="/create" className="text-gray-700 hover:text-indigo-600 font-medium transition">
              Create Challenge
            </Link>
            {mounted && isConnected && (
              <Link href="/my-escrows" className="text-gray-700 hover:text-indigo-600 font-medium transition">
                My Challenges
              </Link>
            )}
          </nav>

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
                <Link href={`/profile/${address}`} className="hidden sm:block text-right hover:opacity-80 transition">
                  <div className="text-sm font-medium text-gray-900">
                    {username || formatAddress(address!)}
                  </div>
                </Link>
                <button
                  onClick={() => disconnect()}
                  className="hidden sm:block px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition text-gray-900 hover:text-gray-900"
                >
                  Disconnect
                </button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && mounted && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <nav className="flex flex-col gap-3">
              <Link href="/" className="text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link href="/create" className="text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                Create Challenge
              </Link>
              {isConnected && (
                <>
                  <Link href="/my-escrows" className="text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                    My Challenges
                  </Link>
                  <Link href={`/profile/${address}`} className="text-gray-700 hover:text-indigo-600 font-medium py-2 transition" onClick={() => setMobileMenuOpen(false)}>
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      disconnect();
                      setMobileMenuOpen(false);
                    }}
                    className="text-left text-gray-600 hover:text-gray-700 font-medium py-2 transition"
                  >
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