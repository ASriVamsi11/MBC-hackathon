'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Medal } from 'lucide-react';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';

interface LeaderboardEntry {
  address: string;
  totalWon: number;
  wins: number;
  losses: number;
  winRate: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for now
    setLeaderboard([
      { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', totalWon: 5420, wins: 12, losses: 3, winRate: 80 },
      { address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', totalWon: 3210, wins: 10, losses: 4, winRate: 71 },
      { address: '0x9Cd35Aa6634C0532925a3b844Bc9e7595f0bFf', totalWon: 2890, wins: 8, losses: 2, winRate: 80 },
      { address: '0x1234567890123456789012345678901234567890', totalWon: 2100, wins: 7, losses: 3, winRate: 70 },
      { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', totalWon: 1850, wins: 6, losses: 2, winRate: 75 },
    ]);
    setIsLoading(false);
  }, []);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Medal className="text-orange-600" size={24} />;
    return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Trophy className="text-yellow-500" size={36} />
          Leaderboard
        </h1>
        <p className="text-gray-600">Top performers on ConditionalEscrow</p>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Total Won</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">W/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry, index) => (
                <LeaderboardRow key={entry.address} entry={entry} rank={index + 1} getMedalIcon={getMedalIcon} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, rank, getMedalIcon }: { entry: LeaderboardEntry; rank: number; getMedalIcon: (rank: number) => JSX.Element }) {
  const { username } = useUsername(entry.address);

  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4">
        <div className="flex items-center justify-center w-12">
          {getMedalIcon(rank)}
        </div>
      </td>
      <td className="px-6 py-4">
        <Link href={`/profile/${entry.address}`} className="flex items-center gap-3 hover:text-indigo-600 transition">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {(username || formatAddress(entry.address)).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{username || formatAddress(entry.address)}</div>
            <div className="text-sm text-gray-500">{formatAddress(entry.address)}</div>
          </div>
        </Link>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <TrendingUp className="text-green-600" size={16} />
          <span className="font-bold text-green-600">${entry.totalWon.toLocaleString()}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="text-gray-900 font-medium">{entry.wins}W / {entry.losses}L</span>
      </td>
    </tr>
  );
}