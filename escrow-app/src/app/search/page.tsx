'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Trophy, Target, TrendingUp, UserPlus, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';

interface SearchResult {
  address: string;
  totalChallenges: number;
  wins: number;
  losses: number;
  isFriend: boolean;
}

export default function SearchPage() {
  const { address: connectedAddress, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);

    // TODO: Replace with actual contract/API search
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock search results
    const mockResults: SearchResult[] = [
      {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        totalChallenges: 15,
        wins: 10,
        losses: 5,
        isFriend: true
      },
      {
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        totalChallenges: 22,
        wins: 14,
        losses: 8,
        isFriend: false
      },
      {
        address: '0x9Cd35Aa6634C0532925a3b844Bc9e7595f0bFf',
        totalChallenges: 8,
        wins: 3,
        losses: 5,
        isFriend: false
      }
    ];

    setSearchResults(mockResults);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-900/20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Search className="text-indigo-600 dark:text-indigo-400" size={40} />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Search Users</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Find friends and challengers on ConditionalEscrow</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-4 text-gray-400 dark:text-gray-500" size={24} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by username or wallet address..."
              className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
            className="w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:transform-none"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search size={20} />
                Search
              </>
            )}
          </button>
        </div>

        {/* Search Tips */}
        {!hasSearched && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">
              <Users size={20} />
              Search Tips
            </h3>
            <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-400">
              <li>• Search by ENS name (e.g., "vitalik.eth")</li>
              <li>• Search by wallet address (e.g., "0x742d...")</li>
              <li>• Search by username if they've set one</li>
              <li>• You can use partial matches</li>
            </ul>
          </div>
        )}

        {/* Results */}
        {hasSearched && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {searchResults.length} {searchResults.length === 1 ? 'Result' : 'Results'}
              </h2>
              {searchResults.length > 0 && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setHasSearched(false);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium text-sm"
                >
                  Clear Search
                </button>
              )}
            </div>

            {searchResults.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Search size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Results Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We couldn't find any users matching "{searchQuery}"
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setHasSearched(false);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
                >
                  Try a different search
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <UserCard 
                    key={result.address} 
                    user={result} 
                    currentUser={connectedAddress}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Popular Users Section */}
        {!hasSearched && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Trophy className="text-yellow-600 dark:text-yellow-500" size={28} />
              Top Challengers
            </h2>
            <div className="space-y-4">
              <TopUserCard
                address="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                rank={1}
                totalChallenges={45}
                wins={32}
                losses={13}
              />
              <TopUserCard
                address="0x8ba1f109551bD432803012645Ac136ddd64DBA72"
                rank={2}
                totalChallenges={38}
                wins={28}
                losses={10}
              />
              <TopUserCard
                address="0x9Cd35Aa6634C0532925a3b844Bc9e7595f0bFf"
                rank={3}
                totalChallenges={35}
                wins={25}
                losses={10}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({ user, currentUser }: { user: SearchResult; currentUser?: string }) {
  const { username } = useUsername(user.address);
  const isOwnProfile = currentUser?.toLowerCase() === user.address.toLowerCase();

  const winRate = user.totalChallenges > 0
    ? Math.round((user.wins / user.totalChallenges) * 100)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {(username || formatAddress(user.address)).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link 
                href={`/profile/${user.address}`}
                className="text-xl font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition truncate"
              >
                {username || formatAddress(user.address)}
              </Link>
              {user.isFriend && (
                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
                  Friend
                </span>
              )}
              {isOwnProfile && (
                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400 text-xs font-semibold px-2 py-1 rounded-full">
                  You
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">{user.address}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.totalChallenges}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Challenges</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{user.wins}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{user.losses}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Losses</div>
          </div>
        </div>
      </div>

      {/* Win Rate Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Win Rate</span>
          <span className={`font-semibold ${winRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {winRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${winRate >= 50 ? 'bg-green-600 dark:bg-green-500' : 'bg-red-600 dark:bg-red-500'}`}
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      {!isOwnProfile && (
        <div className="mt-4 flex gap-2">
          <Link
            href={`/profile/${user.address}`}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium text-center flex items-center justify-center gap-2"
          >
            <ExternalLink size={16} />
            View Profile
          </Link>
          <Link
            href={`/create?opponent=${user.address}`}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-medium text-center flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Trophy size={16} />
            Challenge
          </Link>
        </div>
      )}
    </div>
  );
}

function TopUserCard({ address, rank, totalChallenges, wins, losses }: {
  address: string;
  rank: number;
  totalChallenges: number;
  wins: number;
  losses: number;
}) {
  const { username } = useUsername(address);
  const winRate = Math.round((wins / totalChallenges) * 100);

  const rankColors = {
    1: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
    2: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600',
    3: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-700'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition">
      <div className="flex items-center gap-4">
        {/* Rank Badge */}
        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-xl flex-shrink-0 ${rankColors[rank as keyof typeof rankColors]}`}>
          #{rank}
        </div>

        {/* Avatar */}
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {(username || formatAddress(address)).slice(0, 2).toUpperCase()}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <Link 
            href={`/profile/${address}`}
            className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition block truncate"
          >
            {username || formatAddress(address)}
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span>{totalChallenges} challenges</span>
            <span>•</span>
            <span className="text-green-600 dark:text-green-400 font-semibold">{winRate}% win rate</span>
          </div>
        </div>

        {/* Quick Action */}
        <Link
          href={`/create?opponent=${address}`}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-medium text-sm flex items-center gap-2 flex-shrink-0 transform hover:-translate-y-0.5"
        >
          <Trophy size={16} />
          Challenge
        </Link>
      </div>
    </div>
  );
}