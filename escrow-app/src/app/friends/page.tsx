'use client';

import { useState, useEffect } from 'react';
import { Users, Trophy, Search } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';
import Link from 'next/link';

interface Friend {
  address: string;
  totalChallenges: number;
  challengesWithYou: number;
  yourWins: number;
  theirWins: number;
}

export default function FriendsPage() {
  const { address, isConnected } = useAccount();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) return;

    // TODO: Fetch real friends data from contract events
    // Mock data for now
    setFriends([
      { 
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 
        totalChallenges: 15, 
        challengesWithYou: 8, 
        yourWins: 5, 
        theirWins: 3 
      },
      { 
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', 
        totalChallenges: 12, 
        challengesWithYou: 6, 
        yourWins: 4, 
        theirWins: 2 
      },
      { 
        address: '0x9Cd35Aa6634C0532925a3b844Bc9e7595f0bFf', 
        totalChallenges: 10, 
        challengesWithYou: 5, 
        yourWins: 2, 
        theirWins: 3 
      },
    ]);
    setIsLoading(false);
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12">
            <Users size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Connect Your Wallet</h1>
            <p className="text-gray-600 dark:text-gray-400">Connect your wallet to see your friends and challenge history</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header with gradient background */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 shadow-lg">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
          
          <div className="relative">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users size={36} />
              Friends & Rivals
            </h1>
            <p className="text-indigo-100 text-lg">People you've challenged on ConditionalEscrow</p>
          </div>
        </div>

        {/* Search Bar with frosted glass effect */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-4 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search friends by name or address..."
              className="w-full pl-12 pr-4 py-4 border border-gray-200/50 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 dark:text-white bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Friends List */}
        {friends.length === 0 ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <Users size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Friends Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Challenge someone to start building your network!</p>
            <Link
              href="/create"
              className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold transform hover:-translate-y-0.5"
            >
              Create Challenge
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {friends.map((friend) => (
              <FriendCard 
                key={friend.address} 
                friend={friend} 
                currentUser={address!}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FriendCard({ friend, currentUser, searchQuery }: { friend: Friend; currentUser: string; searchQuery: string }) {
  const { username } = useUsername(friend.address);

  const matchesSearch = searchQuery === '' || 
    username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.address.toLowerCase().includes(searchQuery.toLowerCase());

  if (!matchesSearch) return null;

  const winRate = friend.challengesWithYou > 0 
    ? Math.round((friend.yourWins / friend.challengesWithYou) * 100)
    : 0;

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-md border border-gray-100/50 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          {/* Avatar with gradient */}
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {(username || formatAddress(friend.address)).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link 
              href={`/profile/${friend.address}`}
              className="text-lg font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {username || formatAddress(friend.address)}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{formatAddress(friend.address)}</p>
          </div>
        </div>
      </div>

      {/* Stats with glassmorphism */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-600 shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{friend.challengesWithYou}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Together</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl p-3 text-center border border-green-100 dark:border-green-800 shadow-sm">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{friend.yourWins}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Your Wins</div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl p-3 text-center border border-red-100 dark:border-red-800 shadow-sm">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{friend.theirWins}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Their Wins</div>
        </div>
      </div>

      {/* Win Rate Bar with gradient */}
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400 font-medium">Your win rate</span>
          <span className={`font-bold ${winRate >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {winRate}%
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 shadow-inner">
          <div
            className={`h-2.5 rounded-full transition-all shadow-sm ${
              winRate >= 50 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-red-500 to-rose-500'
            }`}
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* Actions with gradient button */}
      <div className="flex gap-2">
        <Link
          href={`/create?opponent=${friend.address}`}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all font-semibold text-center flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
        >
          <Trophy size={18} />
          Challenge Again
        </Link>
      </div>
    </div>
  );
}