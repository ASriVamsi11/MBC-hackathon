import { Request, Response, NextFunction } from 'express';

/**
 * CORS middleware configuration
 */
export const corsOptions = {
    origin: function (origin: string | undefined, callback: Function) {
        // Allow requests with no origin (mobile apps, curl, postman)
        if (!origin) return callback(null, true);

        // Allowed origins
        const allowedOrigins = [
            'http://localhost:3000',      // Next.js dev
            'http://localhost:3001',      // Backend dev
            'https://localhost:3000',
            // Add your production URLs here
            // 'https://your-app.vercel.app',
            // 'https://your-backend.onrender.com',
        ];

        // Check if origin is allowed
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

/**
 * Custom CORS middleware (alternative to cors package)
 */
export function customCorsMiddleware(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // Allow all origins in development
    if (process.env.NODE_ENV !== 'production') {
        res.header('Access-Control-Allow-Origin', origin || '*');
    } else {
        // In production, restrict to specific origins
        const allowedOrigins = [
            'https://your-app.vercel.app',
            // Add your production URLs
        ];

        if (origin && allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
        }
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
}