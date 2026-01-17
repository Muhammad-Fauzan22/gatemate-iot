// =============================================================================
// GATEMATE Backend - Security Middleware (Enhanced)
// =============================================================================

import { Request, Response, NextFunction, RequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from '../config/env.js';

// =============================================================================
// CORS Configuration
// =============================================================================

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://192.168.1.209:3000',
    'http://192.168.1.209:5173',
    'exp://192.168.1.209:8081',
    'exp://192.168.1.209:8082',
    'exp://192.168.1.209:8083',
    // Production URLs
    'https://gatemate.io',
    'https://app.gatemate.io',
    'https://api.gatemate.io',
];

export const corsMiddleware = cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, Postman, curl)
        if (!origin) {
            callback(null, true);
            return;
        }

        if (allowedOrigins.includes(origin) || origin.startsWith('exp://')) {
            callback(null, true);
        } else if (config.NODE_ENV === 'development') {
            // Allow all origins in development
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-Id',
        'X-Device-Id',
        'X-App-Version',
    ],
    exposedHeaders: [
        'X-Request-Id',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
    ],
    maxAge: 86400, // 24 hours
});

// =============================================================================
// Helmet Security Headers
// =============================================================================

export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'wss:', 'ws:', 'https://firestore.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for API
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    frameguard: { action: 'deny' },
});

// =============================================================================
// Custom Security Headers
// =============================================================================

export const customSecurityHeaders: RequestHandler = (_req: Request, res: Response, next: NextFunction): void => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Content Security Policy for API
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Remove server identification
    res.removeHeader('X-Powered-By');

    next();
};

// =============================================================================
// Request Sanitization
// =============================================================================

export const sanitizeRequest: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
    // Remove potentially dangerous characters from query strings
    const sanitize = (obj: any): any => {
        if (typeof obj === 'string') {
            // Remove null bytes and other control characters
            return obj.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        }
        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }
        if (obj && typeof obj === 'object') {
            const sanitized: any = {};
            for (const key of Object.keys(obj)) {
                // Skip prototype pollution attempts
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                    continue;
                }
                sanitized[key] = sanitize(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };

    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);

    next();
};

// =============================================================================
// IP Whitelist/Blacklist
// =============================================================================

const ipBlacklist = new Set<string>();
const ipWhitelist = new Set<string>(['127.0.0.1', '::1']);

export const ipFilter: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip ||
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'unknown';

    // Check blacklist
    if (ipBlacklist.has(clientIp)) {
        res.status(403).json({
            success: false,
            error: {
                code: 'IP_BLOCKED',
                message: 'Access denied',
            },
        });
        return;
    }

    // Add client IP to request for logging
    (req as any).clientIp = clientIp;

    next();
};

// Function to manage IP lists
export const blockIp = (ip: string): void => {
    ipBlacklist.add(ip);
};

export const unblockIp = (ip: string): void => {
    ipBlacklist.delete(ip);
};

export const whitelistIp = (ip: string): void => {
    ipWhitelist.add(ip);
};

// =============================================================================
// Request Size Limiter
// =============================================================================

export const requestSizeLimiter: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxSize) {
        res.status(413).json({
            success: false,
            error: {
                code: 'REQUEST_TOO_LARGE',
                message: `Request body terlalu besar. Maksimal ${maxSize / 1024 / 1024}MB`,
            },
        });
        return;
    }

    next();
};

// =============================================================================
// API Version Middleware
// =============================================================================

export const apiVersion: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
    // Get API version from header or default
    const version = req.headers['x-api-version'] as string || 'v1';
    (req as any).apiVersion = version;

    // Set version in response
    res.setHeader('X-API-Version', version);

    next();
};

// =============================================================================
// Prevent Parameter Pollution
// =============================================================================

export const preventParameterPollution: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
    // Convert array params to last value (prevent HPP attacks)
    const sanitizeParams = (obj: any): any => {
        const result: any = {};
        for (const key of Object.keys(obj)) {
            if (Array.isArray(obj[key])) {
                result[key] = obj[key][obj[key].length - 1];
            } else {
                result[key] = obj[key];
            }
        }
        return result;
    };

    req.query = sanitizeParams(req.query);

    next();
};

// =============================================================================
// Combined Security Middleware
// =============================================================================

export const securityMiddleware = [
    corsMiddleware,
    customSecurityHeaders,
    sanitizeRequest,
    ipFilter,
    requestSizeLimiter,
    preventParameterPollution,
    apiVersion,
];
