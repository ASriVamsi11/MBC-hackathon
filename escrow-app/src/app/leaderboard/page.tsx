'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Medal, Crown } from 'lucide-react';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';
import { getLeaderboard } from '@/lib/api';
import Link from 'next/link';

interface LeaderboardEntry {
  address: string;
  username?: string;
  totalWon: number;
  totalWonUSD: number;
  wins: number;
  losses: number;
  winRate: number;
  rank: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setIsLoading(true);
        const data = await getLeaderboard(100); // Get top 100

        // Transform API data to match your format
        const transformed = data.leaderboard.map((entry: any) => ({
          address: entry.address,
          username: entry.username,
          totalWon: entry.totalWonUSD, // Use USD amount
          totalWonUSD: entry.totalWonUSD,
          wins: entry.wins,
          losses: 0, // API doesn't track losses yet, calculate from activity
          winRate: entry.wins > 0 ? 100 : 0, // Can calculate properly if we add losses
          rank: entry.rank,
        }));

        setLeaderboard(transformed);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load leaderboard:', err);
        setError('Failed to load leaderboard. Using demo data.');

        // Fallback to demo data on error
        setLeaderboard([
          { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', totalWon: 5420, totalWonUSD: 5420, wins: 12, losses: 3, winRate: 80, rank: 1, username: undefined },
          { address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', totalWon: 3210, totalWonUSD: 3210, wins: 10, losses: 4, winRate: 71, rank: 2, username: undefined },
          { address: '0x9Cd35Aa6634C0532925a3b844Bc9e7595f0bFf', totalWon: 2890, totalWonUSD: 2890, wins: 8, losses: 2, winRate: 80, rank: 3, username: undefined },
          { address: '0x1234567890123456789012345678901234567890', totalWon: 2100, totalWonUSD: 2100, wins: 7, losses: 3, winRate: 70, rank: 4, username: undefined },
          { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', totalWon: 1850, totalWonUSD: 1850, wins: 6, losses: 2, winRate: 75, rank: 5, username: undefined },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    loadLeaderboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header with gradient and crown */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 mb-8">
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />

          <div className="relative text-center">
            <div className="flex justify-center mb-4">
              <Crown size={56} className="text-white drop-shadow-lg" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">Leaderboard</h1>
            <p className="text-indigo-100 text-lg">Top performers on Base Bets</p>
            {error && (
              <p className="text-yellow-200 text-sm mt-2">⚠️ {error}</p>
            )}
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center">
            <Trophy size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Winners Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Be the first to win a challenge!</p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Create Challenge
            </Link>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <PodiumCard
                  entry={leaderboard[1]}
                  rank={2}
                  gradient="from-gray-300 via-gray-400 to-gray-500"
                  bgGradient="from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-700"
                  borderColor="border-gray-200 dark:border-gray-600"
                  height="h-72"
                />

                {/* 1st Place */}
                <PodiumCard
                  entry={leaderboard[0]}
                  rank={1}
                  gradient="from-yellow-400 via-yellow-500 to-amber-500"
                  bgGradient="from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30"
                  borderColor="border-yellow-200 dark:border-yellow-800"
                  height="h-80"
                />

                {/* 3rd Place */}
                <PodiumCard
                  entry={leaderboard[2]}
                  rank={3}
                  gradient="from-orange-400 via-orange-500 to-amber-600"
                  bgGradient="from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30"
                  borderColor="border-orange-200 dark:border-orange-800"
                  height="h-72"
                />
              </div>
            )}

            {/* Leaderboard Table */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/50 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Rankings</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 dark:text-white">User</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">Total Won</th>
                      <th className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">Wins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {leaderboard.map((entry) => (
                      <LeaderboardRow key={entry.address} entry={entry} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ entry, rank, gradient, bgGradient, borderColor, height }: {
  entry: LeaderboardEntry;
  rank: number;
  gradient: string;
  bgGradient: string;
  borderColor: string;
  height: string;
}) {
  const icons = {
    1: <Crown size={32} className="text-white drop-shadow-lg" />,
    2: <Medal size={28} className="text-white drop-shadow-lg" />,
    3: <Medal size={28} className="text-white drop-shadow-lg" />
  };

  const displayName = entry.username || formatAddress(entry.address);

  return (
    <div className={`${height} flex flex-col`}>
      <div className={`bg-gradient-to-br ${bgGradient} border-2 ${borderColor} rounded-2xl shadow-xl p-6 flex flex-col items-center flex-1 hover:shadow-2xl transition-all transform hover:-translate-y-1`}>
        {/* Medal/Crown */}
        <div className={`bg-gradient-to-br ${gradient} w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg`}>
          {icons[rank as keyof typeof icons]}
        </div>

        {/* Avatar */}
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-3 shadow-lg">
          {displayName.slice(0, 2).toUpperCase()}
        </div>

        {/* User Info */}
        <Link
          href={`/profile/${entry.address}`}
          className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition text-center mb-2 truncate max-w-full px-2"
        >
          {displayName}
        </Link>

        {/* Stats */}
        <div className="text-center space-y-3 mt-auto w-full">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${entry.totalWon.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Total Won</div>
          </div>
          <div className="flex gap-4 justify-center text-sm">
            <div>
              <div className="font-bold text-green-600 dark:text-green-400">{entry.wins} Wins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const getMedalIcon = () => {
    if (entry.rank === 1) return <Trophy className="text-yellow-500 dark:text-yellow-400" size={24} />;
    if (entry.rank === 2) return <Medal className="text-gray-400 dark:text-gray-500" size={24} />;
    if (entry.rank === 3) return <Medal className="text-orange-600 dark:text-orange-500" size={24} />;
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-xl flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 shadow-sm">
        {entry.rank}
      </div>
    );
  };

  const displayName = entry.username || formatAddress(entry.address);

  return (
    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all">
      <td className="px-6 py-5">
        <div className="flex items-center justify-center w-12">
          {getMedalIcon()}
        </div>
      </td>
      <td className="px-6 py-5">
        <Link href={`/profile/${entry.address}`} className="flex items-center gap-3 hover:text-indigo-600 dark:hover:text-indigo-400 transition group">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-xl transition">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">{formatAddress(entry.address)}</div>
          </div>
        </Link>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex items-center justify-end gap-2">
          <TrendingUp className="text-green-600 dark:text-green-400" size={18} />
          <span className="font-bold text-green-600 dark:text-green-400 text-lg">
            ${entry.totalWon.toLocaleString()}
          </span>
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className="text-green-600 dark:text-green-400 font-bold">{entry.wins} Wins</span>
        </div>
      </td>
    </tr>
  );
}