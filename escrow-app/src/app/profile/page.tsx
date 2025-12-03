'use client';

import { useState, useEffect } from 'react';
import { Users, Trophy, Target, TrendingUp, Calendar, Settings } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';

interface ProfileStats {
  totalChallenges: number;
  wins: number;
  losses: number;
  pending: number;
  friendCount: number;
  joinedDate: string;
}

interface Challenge {
  id: string;
  opponent: string;
  amount: string;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const { username } = useUsername(address);
  
  const [stats, setStats] = useState<ProfileStats>({
    totalChallenges: 0,
    wins: 0,
    losses: 0,
    pending: 0,
    friendCount: 0,
    joinedDate: 'January 2024'
  });
  
  const [recentChallenges, setRecentChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) return;

    // TODO: Fetch real data from contract
    setStats({
      totalChallenges: 24,
      wins: 15,
      losses: 7,
      pending: 2,
      friendCount: 12,
      joinedDate: 'January 2024'
    });

    setRecentChallenges([
      {
        id: '1',
        opponent: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        amount: '0.5',
        status: 'won',
        createdAt: '2024-03-15'
      },
      {
        id: '2',
        opponent: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        amount: '1.0',
        status: 'pending',
        createdAt: '2024-03-14'
      },
      {
        id: '3',
        opponent: '0x9Cd35Aa6634C0532925a3b844Bc9e7595f0bFf',
        amount: '0.25',
        status: 'lost',
        createdAt: '2024-03-13'
      }
    ]);

    setIsLoading(false);
  }, [isConnected, address]);

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-gray-100">
            <Users size={64} className="mx-auto text-gray-400 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
            <p className="text-gray-600">Connect your wallet to view your profile</p>
          </div>
        </div>
      </div>
    );
  }

  const winRate = stats.totalChallenges > 0 
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Profile Header with gradient and pattern */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-xl p-8 mb-8">
          {/* Subtle dot pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
          
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar with glow effect */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-full blur-xl" />
              <div className="relative w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-white/30 shadow-2xl">
                {(username || formatAddress(address)).slice(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h1 className="text-4xl font-bold text-white">
                  {username || 'Anonymous User'}
                </h1>
                <Link
                  href="/settings"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition backdrop-blur-sm border border-white/20"
                  title="Edit Profile"
                >
                  <Settings size={20} className="text-white" />
                </Link>
              </div>
              <p className="text-indigo-100 text-lg mb-4 font-mono">
                {formatAddress(address)}
              </p>
              
              {/* Info badges with glassmorphism */}
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg">
                  <Users size={20} className="text-white" />
                  <span className="font-semibold text-white">{stats.friendCount} Friends</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg">
                  <Calendar size={20} className="text-white" />
                  <span className="font-semibold text-white">Joined {stats.joinedDate}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg">
                  <Trophy size={20} className="text-white" />
                  <span className="font-semibold text-white">{stats.totalChallenges} Challenges</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid with soft shadows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Trophy className="text-yellow-500" size={32} />}
            label="Total Wins"
            value={stats.wins}
            gradient="from-yellow-50 to-amber-50"
            borderColor="border-yellow-100"
          />
          <StatCard
            icon={<Target className="text-red-500" size={32} />}
            label="Total Losses"
            value={stats.losses}
            gradient="from-red-50 to-rose-50"
            borderColor="border-red-100"
          />
          <StatCard
            icon={<TrendingUp className="text-green-500" size={32} />}
            label="Win Rate"
            value={`${winRate}%`}
            gradient="from-green-50 to-emerald-50"
            borderColor="border-green-100"
          />
        </div>

        {/* Performance Section with frosted glass */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance</h2>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-1">{stats.wins}</div>
              <div className="text-sm text-gray-600 font-medium">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-400 mb-1">{stats.pending}</div>
              <div className="text-sm text-gray-600 font-medium">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-1">{stats.losses}</div>
              <div className="text-sm text-gray-600 font-medium">Losses</div>
            </div>
          </div>
          
          {/* Gradient progress bar */}
          <div className="relative w-full bg-gray-100 rounded-full h-4 shadow-inner overflow-hidden">
            <div
              className="absolute h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-l-full transition-all shadow-sm"
              style={{ width: `${(stats.wins / stats.totalChallenges) * 100}%` }}
            />
            <div
              className="absolute h-4 bg-gray-300 transition-all"
              style={{ 
                left: `${(stats.wins / stats.totalChallenges) * 100}%`,
                width: `${(stats.pending / stats.totalChallenges) * 100}%` 
              }}
            />
            <div
              className="absolute h-4 bg-gradient-to-r from-red-500 to-rose-500 rounded-r-full transition-all shadow-sm"
              style={{ 
                left: `${((stats.wins + stats.pending) / stats.totalChallenges) * 100}%`,
                width: `${(stats.losses / stats.totalChallenges) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Recent Challenges with frosted glass */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Challenges</h2>
          
          {recentChallenges.length === 0 ? (
            <div className="text-center py-12">
              <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-6">No challenges yet</p>
              <Link
                href="/create"
                className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold transform hover:-translate-y-0.5"
              >
                Create Your First Challenge
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, gradient, borderColor }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  gradient: string;
  borderColor: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 border ${borderColor} shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-3">
        {icon}
      </div>
      <div className="text-4xl font-bold text-gray-900 mb-2">{value}</div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { username } = useUsername(challenge.opponent);

  const statusStyles = {
    won: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      text: 'text-green-700',
      border: 'border-green-200',
      badge: 'bg-green-100 text-green-800 border-green-200'
    },
    lost: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      text: 'text-red-700',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800 border-red-200'
    },
    pending: {
      bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  };

  const style = statusStyles[challenge.status];

  return (
    <div className={`${style.bg} rounded-xl p-5 border ${style.border} hover:shadow-md transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            {(username || formatAddress(challenge.opponent)).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link 
              href={`/profile/${challenge.opponent}`}
              className={`font-semibold ${style.text} hover:opacity-80 transition`}
            >
              {username || formatAddress(challenge.opponent)}
            </Link>
            <p className="text-sm text-gray-600">{challenge.amount} ETH</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{challenge.createdAt}</span>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${style.badge} shadow-sm`}>
            {challenge.status.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}