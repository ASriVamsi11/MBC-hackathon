import { Address } from 'viem';
import { EscrowCreatedEvent, EscrowResolvedEvent, EscrowRefundedEvent } from './events';

export type ActivityType = 'created' | 'resolved' | 'refunded';

export interface ActivityItem {
    type: ActivityType;
    escrowId: string;
    timestamp: number;
    blockNumber: bigint;
    txHash: string;

    // For 'created' events
    depositor?: Address;
    beneficiary?: Address;
    amount?: string;
    polymarketId?: string;
    yesOutcome?: boolean;

    // For 'resolved' events
    winner?: Address;
    outcome?: boolean;

    // For 'refunded' events
    refundedTo?: Address;

    // Enriched data
    depositorUsername?: string;
    beneficiaryUsername?: string;
    winnerUsername?: string;
    marketQuestion?: string;
}

/**
 * Merge and format all events into activity feed
 */
export function formatActivityFeed(
    createdEvents: EscrowCreatedEvent[],
    resolvedEvents: EscrowResolvedEvent[],
    refundedEvents: EscrowRefundedEvent[],
    usernames?: Map<Address, string>,
    marketQuestions?: Map<string, string>
): ActivityItem[] {

    const activities: ActivityItem[] = [];

    // Add created events
    for (const event of createdEvents) {
        activities.push({
            type: 'created',
            escrowId: event.escrowId,
            timestamp: event.timestamp,
            blockNumber: event.blockNumber,
            txHash: event.txHash,
            depositor: event.depositor,
            beneficiary: event.beneficiary,
            amount: event.amount,
            polymarketId: event.polymarketId,
            yesOutcome: event.yesOutcome,
            depositorUsername: usernames?.get(event.depositor),
            beneficiaryUsername: usernames?.get(event.beneficiary),
            marketQuestion: marketQuestions?.get(event.polymarketId),
        });
    }

    // Add resolved events
    for (const event of resolvedEvents) {
        activities.push({
            type: 'resolved',
            escrowId: event.escrowId,
            timestamp: event.timestamp,
            blockNumber: event.blockNumber,
            txHash: event.txHash,
            winner: event.beneficiary,
            amount: event.amount,
            outcome: event.outcome,
            winnerUsername: usernames?.get(event.beneficiary),
        });
    }

    // Add refunded events
    for (const event of refundedEvents) {
        activities.push({
            type: 'refunded',
            escrowId: event.escrowId,
            timestamp: event.timestamp,
            blockNumber: event.blockNumber,
            txHash: event.txHash,
            refundedTo: event.depositor,
            amount: event.amount,
        });
    }

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get activity for specific user (as depositor or beneficiary)
 */
export function getUserActivity(
    activityFeed: ActivityItem[],
    userAddress: Address
): ActivityItem[] {
    const addressLower = userAddress.toLowerCase();

    return activityFeed.filter(item => {
        return (
            item.depositor?.toLowerCase() === addressLower ||
            item.beneficiary?.toLowerCase() === addressLower ||
            item.winner?.toLowerCase() === addressLower ||
            item.refundedTo?.toLowerCase() === addressLower
        );
    });
}

/**
 * Format activity item to human-readable string
 */
export function formatActivityMessage(item: ActivityItem): string {
    const depositor = item.depositorUsername || shortAddress(item.depositor);
    const beneficiary = item.beneficiaryUsername || shortAddress(item.beneficiary);
    const winner = item.winnerUsername || shortAddress(item.winner);
    const amountUSD = item.amount ? (Number(item.amount) / 1_000_000).toFixed(2) : '0';

    switch (item.type) {
        case 'created':
            const condition = item.yesOutcome ? 'YES' : 'NO';
            const market = item.marketQuestion || item.polymarketId;
            return `${depositor} challenged ${beneficiary} with $${amountUSD} USDC on "${market}" resolving to ${condition}`;

        case 'resolved':
            const outcomeText = item.outcome ? 'YES' : 'NO';
            return `Escrow #${item.escrowId} resolved ${outcomeText} — ${winner} won $${amountUSD} USDC`;

        case 'refunded':
            const refundee = shortAddress(item.refundedTo);
            return `Escrow #${item.escrowId} refunded $${amountUSD} USDC to ${refundee}`;

        default:
            return `Unknown activity`;
    }
}

/**
 * Shorten address for display
 */
function shortAddress(address?: Address): string {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get recent activity (last N items)
 */
export function getRecentActivity(
    activityFeed: ActivityItem[],
    limit: number = 20
): ActivityItem[] {
    return activityFeed.slice(0, limit);
}