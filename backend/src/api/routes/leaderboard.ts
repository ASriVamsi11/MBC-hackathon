import { Router, Request, Response } from 'express';
import { cache } from '../../cache';
import { getTopN, getEntryForAddress } from '../../services/leaderboard';

const router = Router();

/**
 * GET /api/leaderboard
 * Get top winners leaderboard
 * 
 * Query params:
 * - limit: number (default: 10, max: 100)
 */
router.get('/', (req: Request, res: Response) => {
    try {
        const limit = Math.min(
            parseInt(req.query.limit as string) || 10,
            100 // Max 100 entries
        );

        const top = getTopN(cache.leaderboard, limit);

        res.json({
            success: true,
            leaderboard: top,
            total: cache.leaderboard.length,
            limit,
            lastUpdated: new Date(cache.lastUpdated).toISOString(),
            cacheAge: Date.now() - cache.lastUpdated,
        });
    } catch (error: any) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard',
            message: error.message,
        });
    }
});

/**
 * GET /api/leaderboard/:address
 * Get leaderboard entry for specific address
 */
router.get('/:address', (req: Request, res: Response) => {
    try {
        const address = req.params.address as `0x${string}`;

        if (!address.startsWith('0x') || address.length !== 42) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Ethereum address',
            });
        }

        const entry = getEntryForAddress(cache.leaderboard, address);

        if (!entry) {
            return res.status(404).json({
                success: false,
                error: 'Address not found in leaderboard',
                message: 'This address has not won any escrows yet',
            });
        }

        res.json({
            success: true,
            entry,
            lastUpdated: new Date(cache.lastUpdated).toISOString(),
        });
    } catch (error: any) {
        console.error('Error fetching leaderboard entry:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard entry',
            message: error.message,
        });
    }
});

export default router;