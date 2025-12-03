import { Address } from 'viem';
import { EscrowResolvedEvent } from './events';

export interface LeaderboardEntry {
    address: Address;
    username?: string;
    totalWon: string; // Total USDC won (in base units)
    totalWonUSD: number; // Total in USD
    wins: number;
    lastWinTimestamp: number;
    rank: number;
}

/**
 * Calculate leaderboard from resolved events
 */
export function calculateLeaderboard(
    resolvedEvents: EscrowResolvedEvent[],
    usernames?: Map<Address, string>
): LeaderboardEntry[] {

    // Aggregate wins by address
    const winnerMap = new Map<Address, {
        totalWon: bigint;
        wins: number;
        lastWinTimestamp: number;
    }>();

    for (const event of resolvedEvents) {
        const current = winnerMap.get(event.beneficiary) || {
            totalWon: 0n,
            wins: 0,
            lastWinTimestamp: 0,
        };

        winnerMap.set(event.beneficiary, {
            totalWon: current.totalWon + BigInt(event.amount),
            wins: current.wins + 1,
            lastWinTimestamp: Math.max(current.lastWinTimestamp, event.timestamp),
        });
    }

    // Convert to array and sort
    const entries: LeaderboardEntry[] = Array.from(winnerMap.entries())
        .map(([address, data]) => ({
            address,
            username: usernames?.get(address),
            totalWon: data.totalWon.toString(),
            totalWonUSD: Number(data.totalWon) / 1_000_000, // USDC has 6 decimals
            wins: data.wins,
            lastWinTimestamp: data.lastWinTimestamp,
            rank: 0, // Will be set below
        }))
        .sort((a, b) => {
            // Sort by total won (descending)
            const diff = b.totalWonUSD - a.totalWonUSD;
            if (diff !== 0) return diff;

            // Tiebreaker: most recent win
            return b.lastWinTimestamp - a.lastWinTimestamp;
        });

    // Assign ranks
    entries.forEach((entry, index) => {
        entry.rank = index + 1;
    });

    return entries;
}

/**
 * Get top N entries
 */
export function getTopN(leaderboard: LeaderboardEntry[], n: number): LeaderboardEntry[] {
    return leaderboard.slice(0, n);
}

/**
 * Get leaderboard entry for specific address
 */
export function getEntryForAddress(
    leaderboard: LeaderboardEntry[],
    address: Address
): LeaderboardEntry | null {
    return leaderboard.find(
        entry => entry.address.toLowerCase() === address.toLowerCase()
    ) || null;
}

/**
 * Calculate global statistics
 */
export function calculateGlobalStats(resolvedEvents: EscrowResolvedEvent[]) {
    const totalVolume = resolvedEvents.reduce(
        (sum, event) => sum + BigInt(event.amount),
        0n
    );

    const uniqueWinners = new Set(resolvedEvents.map(e => e.beneficiary)).size;

    return {
        totalEscrowsResolved: resolvedEvents.length,
        totalVolumeUSD: Number(totalVolume) / 1_000_000,
        uniqueWinners,
        averageEscrowUSD: resolvedEvents.length > 0
            ? Number(totalVolume) / 1_000_000 / resolvedEvents.length
            : 0,
    };
}