import { Router, Request, Response } from 'express';
import { cache } from '../../cache';
import { calculateUserStats } from '../../services/stats';
import { getUserActivity } from '../../services/activity';
import { getEntryForAddress } from '../../services/leaderboard';
import { getActiveEscrows } from '../../services/escrow';

const router = Router();

/**
 * GET /api/profile/:address
 * Get complete user profile with stats
 */
router.get('/:address', async (req: Request, res: Response) => {
    try {
        const address = req.params.address as `0x${string}`;

        if (!address.startsWith('0x') || address.length !== 42) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Ethereum address',
            });
        }

        // Get username
        const username = cache.getUsername(address);

        // Get stats from cache or calculate
        let stats = cache.getUserStats(address);
        if (!stats) {
            // Calculate stats if not in cache
            const activeEscrows = await getActiveEscrows();
            const userActiveCount = activeEscrows.filter(
                e => e.depositor.toLowerCase() === address.toLowerCase() ||
                    e.beneficiary.toLowerCase() === address.toLowerCase()
            ).length;

            stats = calculateUserStats(
                address,
                {
                    created: cache.createdEvents,
                    resolved: cache.resolvedEvents,
                    refunded: cache.refundedEvents,
                },
                userActiveCount,
                username || undefined
            );
        }

        // Get user's activity
        const activity = getUserActivity(cache.activityFeed, address).slice(0, 10);

        // Get leaderboard position
        const leaderboardEntry = getEntryForAddress(cache.leaderboard, address);

        // Calculate badges/achievements
        const badges = calculateBadges(stats);

        res.json({
            success: true,
            address,
            username,
            stats,
            leaderboard: {
                rank: leaderboardEntry?.rank || null,
                entry: leaderboardEntry || null,
            },
            recentActivity: activity,
            badges,
            lastUpdated: new Date(cache.lastUpdated).toISOString(),
        });
    } catch (error: any) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch profile',
            message: error.message,
        });
    }
});

/**
 * Calculate achievement badges for user
 */
function calculateBadges(stats: any): string[] {
    const badges: string[] = [];

    // Win-based badges
    if (stats.escrowsWon >= 1) badges.push('First Win');
    if (stats.escrowsWon >= 5) badges.push('Five Wins');
    if (stats.escrowsWon >= 10) badges.push('Ten Wins');
    if (stats.escrowsWon >= 25) badges.push('Champion');

    // Win rate badges
    if (stats.winRate >= 75 && stats.escrowsWon >= 5) badges.push('High Roller');
    if (stats.winRate === 100 && stats.escrowsWon >= 3) badges.push('Perfect Record');

    // Volume badges
    if (stats.totalWonUSD >= 100) badges.push('$100 Club');
    if (stats.totalWonUSD >= 500) badges.push('$500 Club');
    if (stats.totalWonUSD >= 1000) badges.push('$1K Club');

    // Profit badges
    if (stats.netProfitLossUSD > 0) badges.push('In The Green');
    if (stats.netProfitLossUSD >= 100) badges.push('Profitable Trader');

    // Activity badges
    if (stats.escrowsCreated >= 10) badges.push('Active Challenger');
    if (stats.escrowsCreated >= 25) badges.push('Serial Challenger');

    return badges;
}

export default router;