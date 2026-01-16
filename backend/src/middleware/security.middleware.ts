// =============================================================================
// GATEMATE Backend - Security Middleware
// =============================================================================

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

// =============================================================================
// Helmet Security Headers
// =============================================================================
export const helmetMiddleware = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

// =============================================================================
// CORS Configuration
// =============================================================================
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            config.CORS_ORIGIN,
            'http://localhost:5173',
            'http://localhost:3000',
        ].filter(Boolean);

        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
    maxAge: 86400, // 24 hours
});

// =============================================================================
// Rate Limiting
// =============================================================================

// General API rate limit
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    },
});

// Stricter rate limit for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Only 10 login attempts per 15 minutes
    message: {
        success: false,
        error: 'Too many login attempts. Please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: 15 * 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limit for guest access to prevent abuse
export const guestLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 guest actions per minute
    message: {
        success: false,
        error: 'Too many requests. Please wait.',
        code: 'GUEST_RATE_LIMIT_EXCEEDED',
    },
});

// Rate limit for device commands
export const commandLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 commands per minute
    message: {
        success: false,
        error: 'Too many commands. Please slow down.',
        code: 'COMMAND_RATE_LIMIT_EXCEEDED',
    },
});

// =============================================================================
// Input Sanitization
// =============================================================================
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    // Sanitize query parameters
    if (req.query) {
        for (const key in req.query) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key] as string);
            }
        }
    }

    // Sanitize body
    if (req.body && typeof req.body === 'object') {
        sanitizeObject(req.body);
    }

    next();
};

function sanitizeString(str: string): string {
    return str
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocols
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

function sanitizeObject(obj: Record<string, any>) {
    for (const key in obj) {
        if (typeof obj[key] === 'string') {
            obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizeObject(obj[key]);
        }
    }
}

// =============================================================================
// Security Headers Middleware
// =============================================================================
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS Protection (legacy, but still useful)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
};

// =============================================================================
// Request ID for tracing
// =============================================================================
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const requestId = req.headers['x-request-id'] as string ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);

    next();
};
