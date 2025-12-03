import { Address } from 'viem';
import { EscrowCreatedEvent, EscrowResolvedEvent, EscrowRefundedEvent } from '../services/events';
import { LeaderboardEntry } from '../services/leaderboard';
import { ActivityItem } from '../services/activity';
import { UserStats } from '../services/stats';

/**
 * In-memory cache for social features
 */
class Cache {
    // Events
    public createdEvents: EscrowCreatedEvent[] = [];
    public resolvedEvents: EscrowResolvedEvent[] = [];
    public refundedEvents: EscrowRefundedEvent[] = [];

    // Processed data
    public leaderboard: LeaderboardEntry[] = [];
    public activityFeed: ActivityItem[] = [];
    public userStats: Map<Address, UserStats> = new Map();
    public usernames: Map<Address, string> = new Map();
    public marketQuestions: Map<string, string> = new Map();

    // Metadata
    public lastIndexedBlock: bigint = 0n;
    public lastUpdated: number = 0;

    /**
     * Update events cache
     */
    updateEvents(events: {
        created: EscrowCreatedEvent[];
        resolved: EscrowResolvedEvent[];
        refunded: EscrowRefundedEvent[];
    }) {
        this.createdEvents = events.created;
        this.resolvedEvents = events.resolved;
        this.refundedEvents = events.refunded;
        this.lastUpdated = Date.now();
    }

    /**
     * Update leaderboard cache
     */
    updateLeaderboard(leaderboard: LeaderboardEntry[]) {
        this.leaderboard = leaderboard;
    }

    /**
     * Update activity feed cache
     */
    updateActivityFeed(feed: ActivityItem[]) {
        this.activityFeed = feed;
    }

    /**
     * Update user stats cache
     */
    updateUserStats(stats: Map<Address, UserStats>) {
        this.userStats = stats;
    }

    /**
     * Update usernames cache
     */
    updateUsernames(usernames: Map<Address, string>) {
        this.usernames = usernames;
    }

    /**
     * Add market question
     */
    addMarketQuestion(marketId: string, question: string) {
        this.marketQuestions.set(marketId, question);
    }

    /**
     * Get stats for specific user
     */
    getUserStats(address: Address): UserStats | null {
        return this.userStats.get(address) || null;
    }

    /**
     * Get username for address
     */
    getUsername(address: Address): string | null {
        return this.usernames.get(address) || null;
    }

    /**
     * Get market question
     */
    getMarketQuestion(marketId: string): string | null {
        return this.marketQuestions.get(marketId) || null;
    }

    /**
     * Get cache status
     */
    getStatus() {
        return {
            createdEvents: this.createdEvents.length,
            resolvedEvents: this.resolvedEvents.length,
            refundedEvents: this.refundedEvents.length,
            leaderboardEntries: this.leaderboard.length,
            activityItems: this.activityFeed.length,
            userStats: this.userStats.size,
            usernames: this.usernames.size,
            marketQuestions: this.marketQuestions.size,
            lastIndexedBlock: this.lastIndexedBlock.toString(),
            lastUpdated: new Date(this.lastUpdated).toISOString(),
            cacheAge: Date.now() - this.lastUpdated,
        };
    }

    /**
     * Clear all cache
     */
    clear() {
        this.createdEvents = [];
        this.resolvedEvents = [];
        this.refundedEvents = [];
        this.leaderboard = [];
        this.activityFeed = [];
        this.userStats.clear();
        this.usernames.clear();
        this.marketQuestions.clear();
        this.lastIndexedBlock = 0n;
        this.lastUpdated = 0;
    }
}

// Export singleton instance
export const cache = new Cache();