import { Router, Request, Response } from 'express';
import { cache } from '../../cache';
import { getRecentActivity, getUserActivity, formatActivityMessage } from '../../services/activity';

const router = Router();

/**
 * GET /api/activity
 * Get recent activity feed
 * 
 * Query params:
 * - limit: number (default: 20, max: 100)
 * - type: 'created' | 'resolved' | 'refunded' (filter by type)
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const limit = Math.min(
            parseInt(req.query.limit as string) || 20,
            100
        );
        const typeFilter = req.query.type as string | undefined;

        let activities = getRecentActivity(cache.activityFeed, limit * 2); // Get extra for filtering

        // Filter by type if specified
        if (typeFilter && ['created', 'resolved', 'refunded'].includes(typeFilter)) {
            activities = activities.filter(a => a.type === typeFilter);
        }

        // Apply limit after filtering
        activities = activities.slice(0, limit);

        // Add formatted messages
        const withMessages = activities.map(item => ({
            ...item,
            message: formatActivityMessage(item),
            timestamp: item.timestamp,
            timeAgo: getTimeAgo(item.timestamp),
        }));

        res.json({
            success: true,
            activities: withMessages,
            total: cache.activityFeed.length,
            returned: withMessages.length,
            filters: {
                type: typeFilter || 'all',
                limit,
            },
            lastUpdated: new Date(cache.lastUpdated).toISOString(),
        });
    } catch (error: any) {
        console.error('Error fetching activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity',
            message: error.message,
        });
    }
});

/**
 * GET /api/activity/user/:address
 * Get activity for specific user
 */
router.get('/user/:address', (req: Request, res: Response) => {
    try {
        const address = req.params.address as `0x${string}`;
        const limit = Math.min(
            parseInt(req.query.limit as string) || 20,
            100
        );

        if (!address.startsWith('0x') || address.length !== 42) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Ethereum address',
            });
        }

        let activities = getUserActivity(cache.activityFeed, address);
        activities = activities.slice(0, limit);

        const withMessages = activities.map(item => ({
            ...item,
            message: formatActivityMessage(item),
            timeAgo: getTimeAgo(item.timestamp),
        }));

        res.json({
            success: true,
            address,
            username: cache.getUsername(address),
            activities: withMessages,
            total: getUserActivity(cache.activityFeed, address).length,
            returned: withMessages.length,
            lastUpdated: new Date(cache.lastUpdated).toISOString(),
        });
    } catch (error: any) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user activity',
            message: error.message,
        });
    }
});

/**
 * Helper: Convert timestamp to "time ago" format
 */
function getTimeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
}

export default router;