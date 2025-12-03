'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, TrendingUp, Users, ArrowRight } from 'lucide-react';
import ActivityFeed from '@/components/ActivityFeed';
import { useAccount } from 'wagmi';

export default function HomePage() {
  const { isConnected } = useAccount();
  const [stats, setStats] = useState({
    totalChallenges: 0,
    totalVolume: 0,
    activeUsers: 0,
  });

  // TODO: Fetch real stats from contract events
  useEffect(() => {
    setStats({
      totalChallenges: 127,
      totalVolume: 45230,
      activeUsers: 89,
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Challenge Friends on Polymarket
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create conditional escrows backed by real prediction markets. Winner takes all when the outcome resolves.
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/create"
            className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg flex items-center gap-2"
          >
            Create Challenge
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/my-escrows"
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-lg border-2 border-indigo-600"
          >
            My Challenges
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Zap className="text-indigo-600" size={24} />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalChallenges}</div>
              <div className="text-sm text-gray-600">Total Challenges</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">${stats.totalVolume.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Volume</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats.activeUsers}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xl font-bold mb-4">
              1
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose a Market</h3>
            <p className="text-gray-600">
              Select any active Polymarket prediction - sports, politics, crypto, or any real-world event.
            </p>
          </div>

          <div>
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xl font-bold mb-4">
              2
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Challenge a Friend</h3>
            <p className="text-gray-600">
              Set your position and amounts, then share the challenge link with your friend to accept.
            </p>
          </div>

          <div>
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xl font-bold mb-4">
              3
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Winner Takes All</h3>
            <p className="text-gray-600">
              When the market resolves, the winner automatically receives all funds. No disputes, no fees.
            </p>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        <ActivityFeed limit={10} />
      </div>

      {/* CTA */}
      {!isConnected && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-lg mb-6 opacity-90">
            Connect your wallet to create challenges and compete with friends
          </p>
          <Link href="/create" className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg">
            Get Started
          </Link>
        </div>
      )}
    </div>
  );
}