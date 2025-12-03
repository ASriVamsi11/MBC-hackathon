import { Address } from 'viem';
import { EscrowCreatedEvent, EscrowResolvedEvent, EscrowRefundedEvent } from './events';

export interface UserStats {
    address: Address;
    username?: string;

    // As depositor
    escrowsCreated: number;
    totalDeposited: string;
    totalDepositedUSD: number;

    // As beneficiary/winner
    escrowsWon: number;
    totalWon: string;
    totalWonUSD: number;

    // Overall
    netProfitLoss: string;
    netProfitLossUSD: number;
    winRate: number; // Percentage

    // Recent activity
    lastActivityTimestamp: number;
    activeEscrows: number;
}

/**
 * Calculate statistics for a specific user
 */
export function calculateUserStats(
    address: Address,
    events: {
        created: EscrowCreatedEvent[];
        resolved: EscrowResolvedEvent[];
        refunded: EscrowRefundedEvent[];
    },
    activeEscrowCount: number = 0,
    username?: string
): UserStats {

    const addressLower = address.toLowerCase();

    // Calculate as depositor
    const asDepositor = events.created.filter(
        e => e.depositor.toLowerCase() === addressLower
    );
    const totalDeposited = asDepositor.reduce(
        (sum, e) => sum + BigInt(e.amount),
        0n
    );

    // Calculate as winner
    const asWinner = events.resolved.filter(
        e => e.beneficiary.toLowerCase() === addressLower
    );
    const totalWon = asWinner.reduce(
        (sum, e) => sum + BigInt(e.amount),
        0n
    );

    // Calculate refunds
    const refunds = events.refunded.filter(
        e => e.depositor.toLowerCase() === addressLower
    );
    const totalRefunded = refunds.reduce(
        (sum, e) => sum + BigInt(e.amount),
        0n
    );

    // Net profit/loss = Won + Refunded - Deposited
    const netProfitLoss = totalWon + totalRefunded - totalDeposited;

    // Win rate (only count resolved escrows where user was involved)
    const resolvedWhereInvolved = events.resolved.filter(e => {
        // Find corresponding created event
        const createdEvent = events.created.find(
            c => c.escrowId === e.escrowId
        );
        if (!createdEvent) return false;

        return (
            createdEvent.depositor.toLowerCase() === addressLower ||
            createdEvent.beneficiary.toLowerCase() === addressLower
        );
    });

    const wins = asWinner.length;
    const totalResolved = resolvedWhereInvolved.length;
    const winRate = totalResolved > 0 ? (wins / totalResolved) * 100 : 0;

    // Last activity timestamp
    const allTimestamps = [
        ...asDepositor.map(e => e.timestamp),
        ...asWinner.map(e => e.timestamp),
        ...refunds.map(e => e.timestamp),
    ];
    const lastActivityTimestamp = Math.max(...allTimestamps, 0);

    return {
        address,
        username,

        escrowsCreated: asDepositor.length,
        totalDeposited: totalDeposited.toString(),
        totalDepositedUSD: Number(totalDeposited) / 1_000_000,

        escrowsWon: wins,
        totalWon: totalWon.toString(),
        totalWonUSD: Number(totalWon) / 1_000_000,

        netProfitLoss: netProfitLoss.toString(),
        netProfitLossUSD: Number(netProfitLoss) / 1_000_000,
        winRate: Math.round(winRate * 100) / 100, // Round to 2 decimals

        lastActivityTimestamp,
        activeEscrows: activeEscrowCount,
    };
}

/**
 * Get leaderboard position for user
 */
export function getUserRank(
    address: Address,
    leaderboard: Array<{ address: Address; rank: number }>
): number | null {
    const entry = leaderboard.find(
        e => e.address.toLowerCase() === address.toLowerCase()
    );
    return entry ? entry.rank : null;
}

/**
 * Calculate statistics for all users
 */
export function calculateAllUserStats(
    events: {
        created: EscrowCreatedEvent[];
        resolved: EscrowResolvedEvent[];
        refunded: EscrowRefundedEvent[];
    },
    usernames?: Map<Address, string>
): Map<Address, UserStats> {

    // Get all unique addresses
    const addresses = new Set<Address>();

    events.created.forEach(e => {
        addresses.add(e.depositor);
        addresses.add(e.beneficiary);
    });

    events.resolved.forEach(e => {
        addresses.add(e.beneficiary);
    });

    events.refunded.forEach(e => {
        addresses.add(e.depositor);
    });

    // Calculate stats for each address
    const statsMap = new Map<Address, UserStats>();

    for (const address of addresses) {
        const stats = calculateUserStats(
            address,
            events,
            0, // activeEscrowCount would need to be fetched separately
            usernames?.get(address)
        );
        statsMap.set(address, stats);
    }

    return statsMap;
}