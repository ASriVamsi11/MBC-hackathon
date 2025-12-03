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
    totalStaked: '0',
    friendCount: 0,
    joinedDate: 'January 2024'
  });
  
  const [recentChallenges, setRecentChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) return;

    // TODO: Fetch real data from contract
    // Mock data for now
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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Users size={64} className="mx-auto text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
        <p className="text-gray-600">Connect your wallet to view your profile</p>
      </div>
    );
  }

  const winRate = stats.totalChallenges > 0 
    ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-white/30">
            {(username || formatAddress(address)).slice(0, 2).toUpperCase()}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
              <h1 className="text-4xl font-bold">
                {username || 'Anonymous User'}
              </h1>
              <Link
                href="/settings"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                title="Edit Profile"
              >
                <Settings size={20} />
              </Link>
            </div>
            <p className="text-indigo-100 text-lg mb-4 font-mono">
              {formatAddress(address)}
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Users size={20} />
                <span className="font-semibold">{stats.friendCount} Friends</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Calendar size={20} />
                <span className="font-semibold">Joined {stats.joinedDate}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Trophy size={20} />
                <span className="font-semibold">{stats.totalChallenges} Challenges</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Trophy className="text-yellow-600" size={32} />}
          label="Total Wins"
          value={stats.wins}
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={<Target className="text-red-600" size={32} />}
          label="Total Losses"
          value={stats.losses}
          bgColor="bg-red-50"
        />
        <StatCard
          icon={<TrendingUp className="text-green-600" size={32} />}
          label="Win Rate"
          value={`${winRate}%`}
          bgColor="bg-green-50"
        />
      </div>

      {/* Win Rate Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Performance</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.wins}</div>
            <div className="text-sm text-gray-600">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-400">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.losses}</div>
            <div className="text-sm text-gray-600">Losses</div>
          </div>
        </div>
        
        <div className="relative w-full bg-gray-200 rounded-full h-4">
          <div
            className="absolute h-4 bg-green-600 rounded-l-full transition-all"
            style={{ width: `${(stats.wins / stats.totalChallenges) * 100}%` }}
          />
          <div
            className="absolute h-4 bg-gray-400 transition-all"
            style={{ 
              left: `${(stats.wins / stats.totalChallenges) * 100}%`,
              width: `${(stats.pending / stats.totalChallenges) * 100}%` 
            }}
          />
          <div
            className="absolute h-4 bg-red-600 rounded-r-full transition-all"
            style={{ 
              left: `${((stats.wins + stats.pending) / stats.totalChallenges) * 100}%`,
              width: `${(stats.losses / stats.totalChallenges) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Recent Challenges */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Challenges</h2>
        
        {recentChallenges.length === 0 ? (
          <div className="text-center py-12">
            <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No challenges yet</p>
            <Link
              href="/create"
              className="inline-block mt-4 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
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
  );
}

function StatCard({ icon, label, value, bgColor }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-6 border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const { username } = useUsername(challenge.opponent);

  const statusColors = {
    won: 'bg-green-100 text-green-800 border-green-200',
    lost: 'bg-red-100 text-red-800 border-red-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const statusIcons = {
    won: <Trophy size={16} />,
    lost: <Target size={16} />,
    pending: <Calendar size={16} />
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
          {(username || formatAddress(challenge.opponent)).slice(0, 2).toUpperCase()}
        </div>
        <div>
          <Link 
            href={`/profile/${challenge.opponent}`}
            className="font-semibold text-gray-900 hover:text-indigo-600 transition"
          >
            {username || formatAddress(challenge.opponent)}
          </Link>
          <p className="text-sm text-gray-500">{challenge.amount} ETH</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{challenge.createdAt}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusColors[challenge.status]}`}>
          {statusIcons[challenge.status]}
          {challenge.status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}