'use client';

import { useEffect, useState } from 'react';
import { getStats } from '@/lib/api';
import { TrendingUp, Users, Zap, DollarSign } from 'lucide-react';

interface Stats {
    totalEscrowsCreated: number;
    totalEscrowsResolved: number;
    activeEscrows: number;
    totalVolumeUSD: number;
    uniqueWinners: number;
    totalParticipants: number;
}

export default function StatsWidget() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await getStats();
                setStats(data.stats);
            } catch (error) {
                console.error('Failed to load stats:', error);
                // Set demo data on error
                setStats({
                    totalEscrowsCreated: 0,
                    totalEscrowsResolved: 0,
                    activeEscrows: 0,
                    totalVolumeUSD: 0,
                    uniqueWinners: 0,
                    totalParticipants: 0,
                });
            } finally {
                setIsLoading(false);
            }
        }

        loadStats();

        // Refresh every minute
        const interval = setInterval(loadStats, 60000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 animate-pulse">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K+`;
        }
        return num.toString();
    };

    const formatCurrency = (num: number) => {
        if (num >= 1000000) {
            return `$${(num / 1000000).toFixed(1)}M+`;
        }
        if (num >= 1000) {
            return `$${(num / 1000).toFixed(1)}K+`;
        }
        return `$${num.toFixed(0)}`;
    };

    return (
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Challenges Created */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:scale-110 transition-transform">
                        <Zap className="text-indigo-600 dark:text-indigo-400" size={20} />
                    </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stats.totalEscrowsCreated === 0 ? '0' : formatNumber(stats.totalEscrowsCreated)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Challenges Created
                </div>
            </div>

            {/* Total Staked */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                        <DollarSign className="text-green-600 dark:text-green-400" size={20} />
                    </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stats.totalVolumeUSD === 0 ? '$0' : formatCurrency(stats.totalVolumeUSD)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Total Volume
                </div>
            </div>

            {/* Active Users */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow group">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                        <Users className="text-purple-600 dark:text-purple-400" size={20} />
                    </div>
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {stats.totalParticipants === 0 ? '0' : formatNumber(stats.totalParticipants)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Active Users
                </div>
            </div>
        </div>
    );
}