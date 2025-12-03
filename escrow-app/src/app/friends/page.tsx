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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Users size={64} className="mx-auto text-gray-400 mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
        <p className="text-gray-600">Connect your wallet to see your friends and challenge history</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Users className="text-indigo-600" size={36} />
          Friends & Rivals
        </h1>
        <p className="text-gray-600">People you've challenged on ConditionalEscrow</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends by name or address..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          />
        </div>
      </div>

      {/* Friends List */}
      {friends.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Friends Yet</h3>
          <p className="text-gray-600 mb-6">Challenge someone to start building your network!</p>
          <Link
            href="/create"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold"
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
  );
}

function FriendCard({ friend, currentUser, searchQuery }: { friend: Friend; currentUser: string; searchQuery: string }) {
  const { username } = useUsername(friend.address);

  // Filter logic moved here where hooks are safe
  const matchesSearch = searchQuery === '' || 
    username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.address.toLowerCase().includes(searchQuery.toLowerCase());

  if (!matchesSearch) return null;

  const winRate = friend.challengesWithYou > 0 
    ? Math.round((friend.yourWins / friend.challengesWithYou) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {(username || formatAddress(friend.address)).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <Link 
              href={`/profile/${friend.address}`}
              className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition"
            >
              {username || formatAddress(friend.address)}
            </Link>
            <p className="text-sm text-gray-500">{formatAddress(friend.address)}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{friend.challengesWithYou}</div>
          <div className="text-xs text-gray-600">Together</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{friend.yourWins}</div>
          <div className="text-xs text-gray-600">Your Wins</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{friend.theirWins}</div>
          <div className="text-xs text-gray-600">Their Wins</div>
        </div>
      </div>

      {/* Win Rate Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Your win rate</span>
          <span className={`font-semibold ${winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
            {winRate}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${winRate >= 50 ? 'bg-green-600' : 'bg-red-600'}`}
            style={{ width: `${winRate}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/create?opponent=${friend.address}`}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-center flex items-center justify-center gap-2"
        >
          <Trophy size={16} />
          Challenge Again
        </Link>
      </div>
    </div>
  );
}