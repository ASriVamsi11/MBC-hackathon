'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Trophy, Clock, Loader, RefreshCw, Edit } from 'lucide-react';
import { useFetchEscrows } from '@/hooks/useFetchEscrows';
import { useUsername } from '@/hooks/useUsername';
import ChallengeCard from '@/components/ChallengeCard';
import UsernameInput from '@/components/UsernameInput';

export default function MyEscrowsPage() {
  const { address, isConnected } = useAccount();
  const { escrows, isLoading, refetch } = useFetchEscrows(address);
  const { username } = useUsername(address);
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [filter, setFilter] = useState<'all' | 'waiting' | 'active' | 'completed'>('all');

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    totalWon: 0,
  });

  useEffect(() => {
    if (escrows.length > 0) {
      // Status: 0 = Active (awaiting resolution)
      // Status: 1 = Resolved (completed)
      // Status: 2 = Refunded

      // Pending = Active but beneficiary hasn't accepted yet
      const pending = escrows.filter(e => e.status === 0 && !e.beneficiaryAccepted).length;
      // Active = Status 0 with beneficiary accepted, waiting for market resolution
      const active = escrows.filter(e => e.status === 0 && e.beneficiaryAccepted).length;
      // Completed = Status 1 (resolved) or Status 2 (refunded)
      const completed = escrows.filter(e => e.status === 1 || e.status === 2).length;

      const totalWon = escrows
        .filter(e => e.status === 1)
        .reduce((sum, e) => sum + Number(e.amountA) + Number(e.amountB), 0);

      setStats({
        total: escrows.length,
        pending,
        active,
        completed,
        totalWon,
      });
    }
  }, [escrows, address]);

  const filteredEscrows = escrows.filter(escrow => {
    if (filter === 'all') return true;
    if (filter === 'waiting') return escrow.status === 0 && !escrow.beneficiaryAccepted;
    if (filter === 'active') return (escrow.status === 0 && escrow.beneficiaryAccepted) || (escrow.status === 1);
    if (filter === 'completed') return escrow.status === 1 || escrow.status === 2;
    return true;
  });

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600 mb-8">Please connect your wallet to view your challenges</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Challenges</h1>
            <div className="flex items-center gap-3">
              <p className="text-gray-600">
                {username || 'Anonymous User'}
              </p>
              <button
                onClick={() => setShowUsernameInput(!showUsernameInput)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
              >
                <Edit size={14} />
                Edit
              </button>
            </div>
          </div>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Username Input */}
        {showUsernameInput && (
          <div className="mb-6">
            <UsernameInput onComplete={() => setShowUsernameInput(false)} />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Challenges</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Pending Accept</div>
          <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Active</div>
          <div className="text-3xl font-bold text-green-600">{stats.active}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Completed</div>
          <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Won</div>
          <div className="text-3xl font-bold text-green-600">${(stats.totalWon / 1e6).toFixed(0)}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'all', label: 'All' },
          { key: 'waiting', label: 'Waiting' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-6 py-3 font-medium transition-colors ${
              filter === tab.key
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenges List */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Loader size={48} className="mx-auto text-indigo-600 mb-4 animate-spin" />
          <p className="text-gray-600">Loading your challenges...</p>
        </div>
      ) : filteredEscrows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No Challenges Yet' : `No ${filter} Challenges`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? 'Create your first challenge to get started'
              : 'Check back later or try a different filter'
            }
          </p>
          {filter === 'all' && (
            <Link
              href="/create"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Create Challenge
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEscrows.map((escrow) => (
            <ChallengeCard 
              key={escrow.id} 
              escrow={escrow} 
              currentUser={address!}
              onRefetch={refetch}
            />
          ))}
        </div>
      )}

      {/* Total Winnings */}
      {stats.totalWon > 0 && (
        <div className="mt-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Total Winnings</h3>
          <div className="text-5xl font-bold mb-2">
            ${(stats.totalWon / 1e6).toFixed(2)} USDC
          </div>
          <p className="text-lg opacity-90">
            From {stats.completed} completed challenges
          </p>
        </div>
      )}
    </div>
  );
}