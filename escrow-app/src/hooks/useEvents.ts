'use client';

import { useState, useEffect } from 'react';

export interface ActivityEvent {
  type: 'created' | 'resolved' | 'accepted';
  escrowId: number;
  user1: string;
  user2?: string;
  market: string;
  amount?: string;
  timeAgo: string;
  timestamp: number;
}

export function useEvents(limit: number = 20) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // TODO: Replace with actual contract event fetching
        const mockEvents: ActivityEvent[] = [
          {
            type: 'created',
            escrowId: 1,
            user1: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            user2: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
            market: 'Will Bitcoin hit $100k by EOY 2024?',
            timeAgo: '2 hours ago',
            timestamp: Date.now() - 7200000,
          },
          {
            type: 'resolved',
            escrowId: 2,
            user1: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            amount: '200',
            market: 'Will Lakers win tonight?',
            timeAgo: '5 hours ago',
            timestamp: Date.now() - 18000000,
          },
        ];

        setEvents(mockEvents.slice(0, limit));
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  return { events, isLoading };
}