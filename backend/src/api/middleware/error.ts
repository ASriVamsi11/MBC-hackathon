import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware
 */
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error('Error:', error);

    // Default error
    let statusCode = 500;
    let message = 'Internal server error';

    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = error.message;
    } else if (error.message.includes('not found')) {
        statusCode = 404;
        message = error.message;
    } else if (error.message.includes('unauthorized')) {
        statusCode = 401;
        message = 'Unauthorized';
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.message,
        }),
    });
}

/**
 * 404 handler middleware
 */
export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({
        success: false,
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`,
        availableRoutes: [
            'GET /api/leaderboard',
            'GET /api/activity',
            'GET /api/profile/:address',
            'GET /api/stats',
            'GET /api/challenge/:id',
            'GET /health',
        ],
    });
}

/**
 * Request logger middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, path, ip } = req;
        const { statusCode } = res;

        console.log(
            `[${new Date().toISOString()}] ${method} ${path} ${statusCode} ${duration}ms - ${ip}`
        );
    });

    next();
}

/**
 * Rate limiting middleware (simple in-memory)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(
    maxRequests: number = 100,
    windowMs: number = 60000
) {
    return (req: Request, res: Response, next: NextFunction) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();

        const current = requestCounts.get(ip);

        if (!current || now > current.resetTime) {
            // New window
            requestCounts.set(ip, {
                count: 1,
                resetTime: now + windowMs,
            });
            return next();
        }

        if (current.count >= maxRequests) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests',
                message: `Rate limit exceeded. Try again in ${Math.ceil((current.resetTime - now) / 1000)}s`,
            });
        }

        current.count++;
        next();
    };
}

/**
 * Validate address middleware
 */
export function validateAddress(req: Request, res: Response, next: NextFunction) {
    const address = req.params.address;

    if (!address || !address.startsWith('0x') || address.length !== 42) {
        return res.status(400).json({
            success: false,
            error: 'Invalid Ethereum address',
            message: 'Address must be a valid 0x-prefixed 42-character hex string',
        });
    }

    next();
}