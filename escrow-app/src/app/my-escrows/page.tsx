'use client';

import { useState, useEffect } from 'react';
import { Trophy, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';

interface Challenge {
  id: string;
  opponent: string;
  marketUrl: string;
  marketTitle: string;
  amount: string;
  yourPrediction: 'yes' | 'no';
  status: 'pending' | 'active' | 'won' | 'lost' | 'cancelled';
  createdAt: string;
  resolvedAt?: string;
}

export default function MyChallengesPage() {
  const { address, isConnected } = useAccount();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) return;

    // TODO: Fetch real challenges from contract
    const mockChallenges: Challenge[] = [
      {
        id: '1',
        opponent: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        marketUrl: 'https://polymarket.com/event/will-trump-win-2024',
        marketTitle: 'Will Trump win the 2024 election?',
        amount: '1.5',
        yourPrediction: 'yes',
        status: 'active',
        createdAt: '2024-03-15'
      },
      {
        id: '2',
        opponent: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        marketUrl: 'https://polymarket.com/event/btc-100k-2024',
        marketTitle: 'Will Bitcoin reach $100k in 2024?',
        amount: '0.5',
        yourPrediction: 'no',
        status: 'pending',
        createdAt: '2024-03-14'
      },
      {
        id: '3',
        opponent: '0x9Cd35Aa6634C0532925a3b844Bc9e7595f0bFf',
        marketUrl: 'https://polymarket.com/event/eth-merge',
        marketTitle: 'Will ETH merge happen in Q2?',
        amount: '2.0',
        yourPrediction: 'yes',
        status: 'won',
        createdAt: '2024-02-10',
        resolvedAt: '2024-03-01'
      },
      {
        id: '4',
        opponent: '0x1234567890123456789012345678901234567890',
        marketUrl: 'https://polymarket.com/event/super-bowl',
        marketTitle: 'Will Chiefs win Super Bowl?',
        amount: '1.0',
        yourPrediction: 'no',
        status: 'lost',
        createdAt: '2024-01-20',
        resolvedAt: '2024-02-15'
      },
    ];

    setChallenges(mockChallenges);
    setIsLoading(false);
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-12 text-center max-w-md">
          <Trophy size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400">Connect your wallet to view your challenges</p>
        </div>
      </div>
    );
  }

  const filteredChallenges = challenges.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'active') return c.status === 'active' || c.status === 'pending';
    if (filter === 'completed') return c.status === 'won' || c.status === 'lost' || c.status === 'cancelled';
    return true;
  });

  const stats = {
    total: challenges.length,
    active: challenges.filter(c => c.status === 'active' || c.status === 'pending').length,
    won: challenges.filter(c => c.status === 'won').length,
    lost: challenges.filter(c => c.status === 'lost').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 mb-8">
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
          
          <div className="relative">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy size={40} />
              My Challenges
            </h1>
            <p className="text-indigo-100 text-lg">Track all your active and past challenges</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total"
            value={stats.total}
            gradient="from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-700"
            textColor="text-gray-900 dark:text-white"
            borderColor="border-gray-200 dark:border-gray-600"
          />
          <StatCard
            label="Active"
            value={stats.active}
            gradient="from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30"
            textColor="text-indigo-600 dark:text-indigo-400"
            borderColor="border-indigo-200 dark:border-indigo-800"
          />
          <StatCard
            label="Won"
            value={stats.won}
            gradient="from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30"
            textColor="text-green-600 dark:text-green-400"
            borderColor="border-green-200 dark:border-green-800"
          />
          <StatCard
            label="Lost"
            value={stats.lost}
            gradient="from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30"
            textColor="text-red-600 dark:text-red-400"
            borderColor="border-red-200 dark:border-red-800"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md border border-gray-200 dark:border-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === 'active'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md border border-gray-200 dark:border-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md border border-gray-200 dark:border-gray-700'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Challenges List */}
        {filteredChallenges.length === 0 ? (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Trophy size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Challenges Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first challenge to get started!</p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold transform hover:-translate-y-0.5"
            >
              Create Challenge
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} userAddress={address!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, gradient, textColor, borderColor }: {
  label: string;
  value: number;
  gradient: string;
  textColor: string;
  borderColor: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-5 border ${borderColor} shadow-md`}>
      <div className={`text-3xl font-bold ${textColor} mb-1`}>{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</div>
    </div>
  );
}

function ChallengeCard({ challenge, userAddress }: { challenge: Challenge; userAddress: string }) {
  const { username: opponentUsername } = useUsername(challenge.opponent);

  const statusConfig = {
    pending: {
      icon: <Clock size={20} />,
      label: 'Waiting for opponent',
      gradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      badgeBg: 'bg-yellow-100 dark:bg-yellow-900/50',
      badgeText: 'text-yellow-800 dark:text-yellow-300',
      badgeBorder: 'border-yellow-200 dark:border-yellow-700'
    },
    active: {
      icon: <AlertCircle size={20} />,
      label: 'In Progress',
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/50',
      badgeText: 'text-blue-800 dark:text-blue-300',
      badgeBorder: 'border-blue-200 dark:border-blue-700'
    },
    won: {
      icon: <CheckCircle size={20} />,
      label: 'You Won!',
      gradient: 'from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30',
      borderColor: 'border-green-200 dark:border-green-800',
      badgeBg: 'bg-green-100 dark:bg-green-900/50',
      badgeText: 'text-green-800 dark:text-green-300',
      badgeBorder: 'border-green-200 dark:border-green-700'
    },
    lost: {
      icon: <XCircle size={20} />,
      label: 'You Lost',
      gradient: 'from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30',
      borderColor: 'border-red-200 dark:border-red-800',
      badgeBg: 'bg-red-100 dark:bg-red-900/50',
      badgeText: 'text-red-800 dark:text-red-300',
      badgeBorder: 'border-red-200 dark:border-red-700'
    },
    cancelled: {
      icon: <XCircle size={20} />,
      label: 'Cancelled',
      gradient: 'from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-700',
      borderColor: 'border-gray-200 dark:border-gray-600',
      badgeBg: 'bg-gray-100 dark:bg-gray-700',
      badgeText: 'text-gray-800 dark:text-gray-300',
      badgeBorder: 'border-gray-200 dark:border-gray-600'
    }
  };

  const config = statusConfig[challenge.status];

  return (
    <div className={`bg-gradient-to-br ${config.gradient} rounded-2xl shadow-lg border ${config.borderColor} p-6 hover:shadow-xl transition-all`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          {/* Opponent Avatar */}
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
            {(opponentUsername || formatAddress(challenge.opponent)).slice(0, 2).toUpperCase()}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              vs {opponentUsername || formatAddress(challenge.opponent)}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.createdAt}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`${config.badgeBg} ${config.badgeText} px-4 py-2 rounded-xl font-bold text-sm border ${config.badgeBorder} flex items-center gap-2 shadow-sm`}>
          {config.icon}
          {config.label}
        </div>
      </div>

      {/* Market Title */}
      <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl p-4 mb-4 border border-gray-200/50 dark:border-gray-600/50">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{challenge.marketTitle}</h4>
        <a 
          href={challenge.marketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
        >
          View on Polymarket <ExternalLink size={14} />
        </a>
      </div>

      {/* Challenge Details */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Stake Amount</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">{challenge.amount} ETH</div>
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Prediction</div>
          <div className={`text-lg font-bold ${challenge.yourPrediction === 'yes' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {challenge.yourPrediction.toUpperCase()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Potential Win</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">{(parseFloat(challenge.amount) * 2).toFixed(2)} ETH</div>
        </div>
      </div>

      {/* Action Button for pending */}
      {challenge.status === 'pending' && (
        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
          <button className="w-full bg-red-500 dark:bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-600 dark:hover:bg-red-700 transition-all font-semibold">
            Cancel Challenge
          </button>
        </div>
      )}
    </div>
  );
}