'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Trophy, RefreshCw, Loader } from 'lucide-react';
import { getActivity } from '@/lib/api';
import { formatAddress } from '@/lib/utils';

interface ActivityFeedProps {
  limit?: number;
}

interface Activity {
  type: 'created' | 'resolved' | 'refunded';
  escrowId: string;
  timestamp: number;
  timeAgo: string;
  message: string;
  txHash: string;

  // For 'created' events
  depositor?: string;
  beneficiary?: string;
  amount?: string;
  depositorUsername?: string;
  beneficiaryUsername?: string;
  marketQuestion?: string;

  // For 'resolved' events
  winner?: string;
  winnerUsername?: string;
  outcome?: boolean;

  // For 'refunded' events
  refundedTo?: string;
}

export default function ActivityFeed({ limit = 20 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const data = await getActivity(limit);
      setActivities(data.activities);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load activity:', err);
      setError('Failed to load activity');
      // Keep existing activities on refresh error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  if (isLoading && activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Loader size={32} className="mx-auto text-indigo-600 animate-spin" />
        <p className="text-gray-500 mt-2">Loading activity...</p>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-xl border border-red-200">
        <p className="text-red-600 mb-3">{error}</p>
        <button
          onClick={loadActivities}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <Zap size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 mb-4">No recent activity</p>
        <Link
          href="/create"
          className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Create First Challenge
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Refresh indicator */}
      {isLoading && activities.length > 0 && (
        <div className="text-center py-2">
          <RefreshCw size={16} className="inline text-indigo-600 animate-spin" />
          <span className="text-xs text-gray-500 ml-2">Refreshing...</span>
        </div>
      )}

      {activities.map((activity, index) => (
        <ActivityItem key={`${activity.escrowId}-${activity.type}-${index}`} activity={activity} />
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const getIcon = () => {
    switch (activity.type) {
      case 'created':
        return <Zap className="text-indigo-600" size={20} />;
      case 'resolved':
        return <Trophy className="text-green-600" size={20} />;
      case 'refunded':
        return <RefreshCw className="text-orange-600" size={20} />;
      default:
        return <Zap className="text-gray-600" size={20} />;
    }
  };

  const getMessage = () => {
    // API already provides a formatted message, but we can enhance it with links
    const rawMessage = activity.message;

    if (activity.type === 'created') {
      const depositor = activity.depositorUsername || formatAddress(activity.depositor);
      const beneficiary = activity.beneficiaryUsername || formatAddress(activity.beneficiary);
      const amountUSD = activity.amount ? (Number(activity.amount) / 1_000_000).toFixed(2) : '0';
      const market = activity.marketQuestion || 'Unknown market';

      return (
        <>
          <span className="font-semibold text-indigo-600">{depositor}</span>
          {' challenged '}
          <span className="font-semibold text-purple-600">{beneficiary}</span>
          {' with '}
          <span className="font-semibold text-green-600">${amountUSD}</span>
          {' on '}
          <span className="text-gray-700">"{market}"</span>
        </>
      );
    }

    if (activity.type === 'resolved') {
      const winner = activity.winnerUsername || formatAddress(activity.winner);
      const amountUSD = activity.amount ? (Number(activity.amount) / 1_000_000).toFixed(2) : '0';
      const outcome = activity.outcome ? 'YES' : 'NO';

      return (
        <>
          <span className="font-semibold text-green-600">{winner}</span>
          {' won '}
          <span className="font-semibold text-green-600">${amountUSD}</span>
          {' • Outcome: '}
          <span className={`font-semibold ${activity.outcome ? 'text-green-600' : 'text-red-600'}`}>
            {outcome}
          </span>
        </>
      );
    }

    if (activity.type === 'refunded') {
      const refundee = formatAddress(activity.refundedTo);
      const amountUSD = activity.amount ? (Number(activity.amount) / 1_000_000).toFixed(2) : '0';

      return (
        <>
          <span className="font-semibold text-orange-600">${amountUSD}</span>
          {' refunded to '}
          <span className="font-semibold">{refundee}</span>
        </>
      );
    }

    // Fallback to raw message from API
    return rawMessage;
  };

  return (
    <Link href={`/challenge/${activity.escrowId}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition cursor-pointer group">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-50 rounded-lg mt-0.5 group-hover:bg-indigo-50 transition">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 mb-1 text-sm">{getMessage()}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{activity.timeAgo}</span>
              <span className="text-gray-400">•</span>
              <span className="font-mono truncate">Escrow #{activity.escrowId}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}