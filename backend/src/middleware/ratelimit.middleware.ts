// =============================================================================
// GATEMATE Backend - Rate Limiting Middleware
// =============================================================================

import { Request, Response, NextFunction, RequestHandler } from 'express';

// =============================================================================
// In-Memory Store (Production should use Redis)
// =============================================================================

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetTime < now) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

// =============================================================================
// Rate Limiter Factory
// =============================================================================

interface RateLimitOptions {
    windowMs: number;      // Time window in milliseconds
    max: number;           // Max requests per window
    message?: string;      // Error message
    keyPrefix?: string;    // Prefix for rate limit key
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
}

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
    const {
        windowMs,
        max,
        message = 'Terlalu banyak request. Silakan coba lagi nanti.',
        keyPrefix = 'rl',
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
    } = options;

    return (req: Request, res: Response, next: NextFunction): void => {
        // Get client identifier (IP or user ID)
        const clientId = (req as any).user?.userId ||
            req.ip ||
            req.headers['x-forwarded-for'] ||
            'unknown';

        const key = `${keyPrefix}:${clientId}`;
        const now = Date.now();

        // Get or create entry
        let entry = store.get(key);

        if (!entry || entry.resetTime < now) {
            // Create new window
            entry = {
                count: 0,
                resetTime: now + windowMs,
            };
        }

        // Increment count
        entry.count++;
        store.set(key, entry);

        // Set headers
        const remaining = Math.max(0, max - entry.count);
        const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

        res.setHeader('X-RateLimit-Limit', max.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

        // Check if limit exceeded
        if (entry.count > max) {
            res.setHeader('Retry-After', resetSeconds.toString());
            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message,
                    retryAfter: resetSeconds,
                },
            });
            return;
        }

        // Handle skip options
        if (skipSuccessfulRequests || skipFailedRequests) {
            const originalEnd = res.end;
            res.end = function (...args: any[]) {
                const shouldDecrement =
                    (skipSuccessfulRequests && res.statusCode < 400) ||
                    (skipFailedRequests && res.statusCode >= 400);

                if (shouldDecrement) {
                    const currentEntry = store.get(key);
                    if (currentEntry) {
                        currentEntry.count = Math.max(0, currentEntry.count - 1);
                    }
                }

                return originalEnd.apply(res, args);
            };
        }

        next();
    };
}

// =============================================================================
// Pre-configured Rate Limiters
// =============================================================================

// General API rate limit: 100 requests per minute
export const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 100,
    keyPrefix: 'api',
    message: 'Terlalu banyak request. Maksimal 100 request per menit.',
});

// Auth rate limit: 5 attempts per 15 minutes
export const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    keyPrefix: 'auth',
    message: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.',
    skipSuccessfulRequests: true,
});

// Register rate limit: 3 registrations per hour
export const registerLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyPrefix: 'register',
    message: 'Terlalu banyak pendaftaran. Silakan coba lagi dalam 1 jam.',
});

// Device command rate limit: 30 commands per minute
export const commandLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    keyPrefix: 'command',
    message: 'Terlalu banyak perintah. Maksimal 30 perintah per menit.',
});

// Password change rate limit: 3 attempts per hour
export const passwordLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyPrefix: 'password',
    message: 'Terlalu banyak percobaan ganti password. Silakan coba lagi dalam 1 jam.',
});

// OTP/Verification rate limit: 5 per 10 minutes
export const otpLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    keyPrefix: 'otp',
    message: 'Terlalu banyak permintaan OTP. Silakan coba lagi dalam 10 menit.',
});

// File upload rate limit: 10 per hour
export const uploadLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyPrefix: 'upload',
    message: 'Terlalu banyak upload. Maksimal 10 upload per jam.',
});

// =============================================================================
// Slow down middleware (progressive delay)
// =============================================================================

interface SlowDownEntry {
    count: number;
    resetTime: number;
}

const slowDownStore = new Map<string, SlowDownEntry>();

interface SlowDownOptions {
    windowMs: number;
    delayAfter: number;      // Start delaying after this many requests
    delayMs: number;         // Delay per request
    maxDelayMs?: number;     // Maximum delay
    keyPrefix?: string;
}

export function createSlowDown(options: SlowDownOptions): RequestHandler {
    const {
        windowMs,
        delayAfter,
        delayMs,
        maxDelayMs = 10000,
        keyPrefix = 'sd',
    } = options;

    return (req: Request, res: Response, next: NextFunction): void => {
        const clientId = (req as any).user?.userId || req.ip || 'unknown';
        const key = `${keyPrefix}:${clientId}`;
        const now = Date.now();

        let entry = slowDownStore.get(key);

        if (!entry || entry.resetTime < now) {
            entry = { count: 0, resetTime: now + windowMs };
        }

        entry.count++;
        slowDownStore.set(key, entry);

        const delayCount = Math.max(0, entry.count - delayAfter);
        const delay = Math.min(delayCount * delayMs, maxDelayMs);

        if (delay > 0) {
            res.setHeader('X-SlowDown-Delay', delay.toString());
            setTimeout(() => next(), delay);
        } else {
            next();
        }
    };
}

// Pre-configured slow down for auth
export const authSlowDown = createSlowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 3,
    delayMs: 500,
    maxDelayMs: 5000,
    keyPrefix: 'auth-sd',
});
