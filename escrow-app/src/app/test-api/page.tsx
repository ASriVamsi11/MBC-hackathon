'use client';

import { useState, useEffect } from 'react';
import { healthCheck, getLeaderboard, getActivity, getStats } from '@/lib/api';

export default function TestAPIPage() {
    const [health, setHealth] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any>(null);
    const [activity, setActivity] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function test() {
            try {
                setLoading(true);

                // Test all endpoints
                const [h, l, a, s] = await Promise.all([
                    healthCheck(),
                    getLeaderboard(5),
                    getActivity(10),
                    getStats(),
                ]);

                setHealth(h);
                setLeaderboard(l);
                setActivity(a);
                setStats(s);
                setError(null);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        test();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Testing backend connection...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-red-800 mb-2">❌ Connection Failed</h2>
                    <p className="text-red-700">{error}</p>
                    <p className="text-sm text-red-600 mt-4">
                        Make sure backend is running on http://localhost:3001
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">✅ Backend Connection Test</h1>

                {/* Health Check */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Health Check</h2>
                    <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
                        {JSON.stringify(health, null, 2)}
                    </pre>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Global Stats</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded">
                            <p className="text-3xl font-bold text-blue-600">
                                {stats?.stats.totalEscrowsCreated || 0}
                            </p>
                            <p className="text-sm text-gray-600">Total Escrows</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded">
                            <p className="text-3xl font-bold text-green-600">
                                ${stats?.stats.totalVolumeUSD?.toFixed(2) || '0.00'}
                            </p>
                            <p className="text-sm text-gray-600">Total Volume</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded">
                            <p className="text-3xl font-bold text-purple-600">
                                {stats?.stats.activeEscrows || 0}
                            </p>
                            <p className="text-sm text-gray-600">Active Escrows</p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Leaderboard</h2>
                    {leaderboard?.leaderboard.length > 0 ? (
                        <div className="space-y-2">
                            {leaderboard.leaderboard.map((entry: any) => (
                                <div key={entry.address} className="flex justify-between p-3 bg-gray-50 rounded">
                                    <span>#{entry.rank} - {entry.username || entry.address.slice(0, 8)}...</span>
                                    <span className="font-bold">${entry.totalWonUSD.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No winners yet</p>
                    )}
                </div>

                {/* Activity */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                    {activity?.activities.length > 0 ? (
                        <div className="space-y-2">
                            {activity.activities.map((item: any, i: number) => (
                                <div key={i} className="p-3 bg-gray-50 rounded">
                                    <p className="text-sm">{item.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">{item.timeAgo}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No activity yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}