'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Trophy, Loader } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import { useUsername } from '@/hooks/useUsername';
import { formatAddress } from '@/lib/utils';

interface ActivityFeedProps {
  limit?: number;
}

export default function ActivityFeed({ limit = 20 }: ActivityFeedProps) {
  const { events, isLoading } = useEvents(limit);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader size={32} className="mx-auto text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
        <p className="text-gray-600">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <ActivityItem key={index} event={event} />
      ))}
    </div>
  );
}

function ActivityItem({ event }: { event: any }) {
  const { username: user1Name } = useUsername(event.user1);
  const { username: user2Name } = useUsername(event.user2);

  const getIcon = () => {
    if (event.type === 'created') {
      return <Zap className="text-indigo-600" size={20} />;
    }
    if (event.type === 'resolved') {
      return <Trophy className="text-green-600" size={20} />;
    }
    return <Zap className="text-gray-600" size={20} />;
  };

  const getMessage = () => {
    if (event.type === 'created') {
      return (
        <>
          <span className="font-semibold">{user1Name || formatAddress(event.user1)}</span>
          {' challenged '}
          <span className="font-semibold">{user2Name || formatAddress(event.user2)}</span>
          {' on '}
          <span className="text-indigo-600">"{event.market}"</span>
        </>
      );
    }
    if (event.type === 'resolved') {
      return (
        <>
          <span className="font-semibold text-green-600">{user1Name || formatAddress(event.user1)}</span>
          {' won '}
          <span className="font-semibold">${event.amount}</span>
          {' on '}
          <span className="text-indigo-600">"{event.market}"</span>
        </>
      );
    }
    return 'Activity';
  };

  return (
    <Link href={`/challenge/${event.escrowId}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-md transition cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-50 rounded-lg mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="text-gray-900 mb-1">{getMessage()}</p>
            <p className="text-sm text-gray-500">{event.timeAgo}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}