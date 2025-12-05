'use client';

import { useState, useEffect } from 'react';
import { Users, Trophy, Search } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';

interface Escrow {
  id: bigint;
  amountA: bigint;
  amountB: bigint;
  status: number;
  winner: string;
  // ... other fields
}

export default function MyEscrowsPage() {
  const { address, isConnected } = useAccount();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    won: 0,
    lost: 0
  });

  useEffect(() => {
    if (!isConnected || !address) return;

    // Fetch escrows from contract
    // TODO: Replace with actual contract call
    
    // Calculate stats with proper bigint handling
    if (escrows.length > 0) {
      const totalWon = escrows
        .filter(e => e.status === 2 && e.winner === address)
        .reduce((sum, e) => sum + Number(e.amountA) + Number(e.amountB), 0); // Convert bigint to number

      setStats({
        total: escrows.length,
        active: escrows.filter(e => e.status === 1).length,
        won: escrows.filter(e => e.status === 2 && e.winner === address).length,
        lost: escrows.filter(e => e.status === 2 && e.winner !== address).length
      });
    }
  }, [isConnected, address, escrows]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
            <Users size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h1>
            <p className="text-gray-600 dark:text-gray-400">Connect your wallet to see your challenges</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 shadow-lg">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
          
          <div className="relative">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy size={36} />
              My Challenges
            </h1>
            <p className="text-indigo-100 text-lg">Track your bets and challenge history</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-md">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800 shadow-md">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">{stats.active}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-md">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.won}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Won</div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl p-6 border border-red-200 dark:border-red-800 shadow-md">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">{stats.lost}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Lost</div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Trophy size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Challenges Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first challenge to get started!</p>
          <Link
            href="/create"
            className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold transform hover:-translate-y-0.5"
          >
            Create Challenge
          </Link>
        </div>
      </div>
    </div>
  );
}