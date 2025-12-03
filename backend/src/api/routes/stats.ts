import { Router, Request, Response } from 'express';
import { cache } from '../../cache';
import { calculateGlobalStats } from '../../services/leaderboard';

const router = Router();

/**
 * GET /api/stats
 * Get global platform statistics
 */
router.get('/', (req: Request, res: Response) => {
    try {
        // Calculate global stats from resolved events
        const globalStats = calculateGlobalStats(cache.resolvedEvents);

        // Calculate additional stats
        const totalEscrowsCreated = cache.createdEvents.length;
        const totalEscrowsResolved = cache.resolvedEvents.length;
        const totalEscrowsRefunded = cache.refundedEvents.length;
        const activeEscrows = totalEscrowsCreated - totalEscrowsResolved - totalEscrowsRefunded;

        // Calculate total volume (created + resolved)
        const totalCreatedVolume = cache.createdEvents.reduce(
            (sum, e) => sum + BigInt(e.amount),
            0n
        );
        const totalCreatedVolumeUSD = Number(totalCreatedVolume) / 1_000_000;

        // Get top market
        const marketCounts = new Map<string, number>();
        cache.createdEvents.forEach(e => {
            marketCounts.set(e.polymarketId, (marketCounts.get(e.polymarketId) || 0) + 1);
        });
        const topMarketId = Array.from(marketCounts.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0];
        const topMarketQuestion = topMarketId ? cache.getMarketQuestion(topMarketId) : null;

        // Recent activity metrics
        const last24h = Date.now() / 1000 - 86400;
        const recentCreated = cache.createdEvents.filter(e => e.timestamp >= last24h).length;
        const recentResolved = cache.resolvedEvents.filter(e => e.timestamp >= last24h).length;

        res.json({
            success: true,
            stats: {
                // Total counts
                totalEscrowsCreated,
                totalEscrowsResolved,
                totalEscrowsRefunded,
                activeEscrows,

                // Volume stats
                totalVolumeUSD: globalStats.totalVolumeUSD,
                totalCreatedVolumeUSD,
                averageEscrowUSD: globalStats.averageEscrowUSD,

                // User stats
                uniqueWinners: globalStats.uniqueWinners,
                totalParticipants: cache.userStats.size,

                // Leaderboard
                leaderboardSize: cache.leaderboard.length,

                // Top market
                topMarket: topMarketQuestion ? {
                    question: topMarketQuestion,
                    escrowCount: marketCounts.get(topMarketId!),
                } : null,

                // Recent activity (last 24h)
                last24h: {
                    created: recentCreated,
                    resolved: recentResolved,
                },
            },
            cache: {
                lastUpdated: new Date(cache.lastUpdated).toISOString(),
                lastIndexedBlock: cache.lastIndexedBlock.toString(),
                cacheAge: Date.now() - cache.lastUpdated,
            },
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stats',
            message: error.message,
        });
    }
});

/**
 * GET /api/stats/markets
 * Get statistics grouped by market
 */
router.get('/markets', (req: Request, res: Response) => {
    try {
        const marketStats = new Map<string, {
            marketId: string;
            question: string | null;
            escrowCount: number;
            totalVolume: bigint;
            resolvedCount: number;
        }>();

        // Aggregate created escrows by market
        cache.createdEvents.forEach(e => {
            const current = marketStats.get(e.polymarketId) || {
                marketId: e.polymarketId,
                question: cache.getMarketQuestion(e.polymarketId),
                escrowCount: 0,
                totalVolume: 0n,
                resolvedCount: 0,
            };

            current.escrowCount++;
            current.totalVolume += BigInt(e.amount);

            marketStats.set(e.polymarketId, current);
        });

        // Add resolved counts
        cache.resolvedEvents.forEach(e => {
            const created = cache.createdEvents.find(c => c.escrowId === e.escrowId);
            if (created) {
                const stats = marketStats.get(created.polymarketId);
                if (stats) {
                    stats.resolvedCount++;
                }
            }
        });

        // Convert to array and sort by escrow count
        const sortedMarkets = Array.from(marketStats.values())
            .map(m => ({
                ...m,
                totalVolumeUSD: Number(m.totalVolume) / 1_000_000,
            }))
            .sort((a, b) => b.escrowCount - a.escrowCount)
            .slice(0, 20); // Top 20 markets

        res.json({
            success: true,
            markets: sortedMarkets,
            total: marketStats.size,
            lastUpdated: new Date(cache.lastUpdated).toISOString(),
        });
    } catch (error: any) {
        console.error('Error fetching market stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch market stats',
            message: error.message,
        });
    }
});

export default router;