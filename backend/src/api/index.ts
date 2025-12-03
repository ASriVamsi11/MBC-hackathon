import express, { Request, Response } from 'express';
import cors from 'cors';
import { cache } from '../cache';
import { getEscrow } from '../services/escrow';
import { Address } from 'viem';

// Import routes
import leaderboardRouter from './routes/leaderboard';
import activityRouter from './routes/activity';
import profileRouter from './routes/profile';
import statsRouter from './routes/stats';

// Import middleware
import { errorHandler, notFoundHandler, requestLogger, rateLimiter } from './middleware/error';
import { customCorsMiddleware } from './middleware/cors';

const app = express();

// Middleware
app.use(cors()); // Or use customCorsMiddleware
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter(100, 60000)); // 100 requests per minute

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        cache: cache.getStatus(),
    });
});

// Mount routers
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/activity', activityRouter);
app.use('/api/profile', profileRouter);
app.use('/api/stats', statsRouter);

/**
 * GET /api/username/:address
 * Get username for an address
 */
app.get('/api/username/:address', (req: Request, res: Response) => {
    try {
        const address = req.params.address as Address;
        const username = cache.getUsername(address);

        res.json({
            success: true,
            address,
            username: username || null,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/challenge/:id
 * Get challenge (escrow) details
 */
app.get('/api/challenge/:id', async (req: Request, res: Response) => {
    try {
        const escrowId = BigInt(req.params.id);

        // Get escrow from blockchain
        const escrow = await getEscrow(escrowId);

        // Enrich with usernames and market question
        const depositorUsername = cache.getUsername(escrow.depositor);
        const beneficiaryUsername = cache.getUsername(escrow.beneficiary);
        const marketQuestion = cache.getMarketQuestion(escrow.polymarketId);

        // Find related events
        const createdEvent = cache.createdEvents.find(e => e.escrowId === escrowId.toString());
        const resolvedEvent = cache.resolvedEvents.find(e => e.escrowId === escrowId.toString());

        res.json({
            success: true,
            escrow: {
                ...escrow,
                id: escrow.id.toString(),
                amount: escrow.amount.toString(),
                createdAt: escrow.createdAt.toString(),
            },
            depositorUsername,
            beneficiaryUsername,
            marketQuestion,
            events: {
                created: createdEvent,
                resolved: resolvedEvent,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/cache/status
 * Get cache status
 */
app.get('/api/cache/status', (req: Request, res: Response) => {
    res.json({
        success: true,
        ...cache.getStatus(),
    });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

/**
 * Start API server
 */
export function startApiServer(port: number = 3001) {
    app.listen(port, () => {
        console.log(`🚀 API Server running on port ${port}`);
        console.log(`   Health: http://localhost:${port}/health`);
        console.log(`   Leaderboard: http://localhost:${port}/api/leaderboard`);
        console.log(`   Activity: http://localhost:${port}/api/activity`);
    });
}

export default app;