// API base URL - automatically switches between dev and production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

/**
 * Leaderboard API
 */
export async function getLeaderboard(limit: number = 10) {
    return fetchAPI<{
        success: boolean;
        leaderboard: Array<{
            address: string;
            username?: string;
            totalWonUSD: number;
            wins: number;
            rank: number;
        }>;
        total: number;
    }>(`/api/leaderboard?limit=${limit}`);
}

/**
 * Activity Feed API
 */
export async function getActivity(limit: number = 20, type?: string) {
    const query = type ? `limit=${limit}&type=${type}` : `limit=${limit}`;
    return fetchAPI<{
        success: boolean;
        activities: Array<{
            type: string;
            escrowId: string;
            message: string;
            timestamp: number;
            timeAgo: string;
        }>;
        total: number;
    }>(`/api/activity?${query}`);
}

/**
 * User Profile API
 */
export async function getProfile(address: string) {
    return fetchAPI<{
        success: boolean;
        address: string;
        username?: string;
        stats: {
            escrowsCreated: number;
            escrowsWon: number;
            totalWonUSD: number;
            winRate: number;
            netProfitLossUSD: number;
        };
        leaderboard: {
            rank: number | null;
        };
        recentActivity: any[];
        badges: string[];
    }>(`/api/profile/${address}`);
}

/**
 * Global Stats API
 */
export async function getStats() {
    return fetchAPI<{
        success: boolean;
        stats: {
            totalEscrowsCreated: number;
            totalEscrowsResolved: number;
            activeEscrows: number;
            totalVolumeUSD: number;
            uniqueWinners: number;
            averageEscrowUSD: number;
        };
    }>('/api/stats');
}

/**
 * Challenge/Escrow Details API
 */
export async function getChallenge(id: string) {
    return fetchAPI<{
        success: boolean;
        escrow: any;
        depositorUsername?: string;
        beneficiaryUsername?: string;
        marketQuestion?: string;
    }>(`/api/challenge/${id}`);
}

/**
 * Username Lookup API
 */
export async function getUsername(address: string) {
    return fetchAPI<{
        success: boolean;
        address: string;
        username: string | null;
    }>(`/api/username/${address}`);
}

/**
 * Health Check
 */
export async function healthCheck() {
    return fetchAPI<{
        status: string;
        uptime: number;
        cache: any;
    }>('/health');
}