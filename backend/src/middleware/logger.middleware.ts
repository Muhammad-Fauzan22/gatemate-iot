// =============================================================================
// GATEMATE Backend - Structured Logging (Winston)
// =============================================================================

import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';

// =============================================================================
// Log Formats
// =============================================================================

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `[${timestamp}] ${level}: ${message} ${metaStr}`;
    })
);

const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// =============================================================================
// Logger Instance
// =============================================================================

export const logger = winston.createLogger({
    level: config.NODE_ENV === 'development' ? 'debug' : 'info',
    defaultMeta: { service: 'gatemate-api' },
    transports: [
        // Console output
        new winston.transports.Console({
            format: config.NODE_ENV === 'development' ? consoleFormat : jsonFormat,
        }),
    ],
});

// Add file transports in production
if (config.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: jsonFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));

    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        format: jsonFormat,
        maxsize: 5242880,
        maxFiles: 5,
    }));
}

// =============================================================================
// HTTP Request Logger Middleware
// =============================================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] as string;

    // Log request
    logger.info('Incoming request', {
        requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });

    // Log response on finish
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logLevel = res.statusCode >= 500 ? 'error'
            : res.statusCode >= 400 ? 'warn'
                : 'info';

        logger[logLevel]('Request completed', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength: res.get('content-length'),
        });
    });

    next();
};

// =============================================================================
// Specialized Loggers
// =============================================================================

export const mqttLogger = {
    info: (message: string, meta?: object) =>
        logger.info(`[MQTT] ${message}`, { service: 'mqtt', ...meta }),
    error: (message: string, meta?: object) =>
        logger.error(`[MQTT] ${message}`, { service: 'mqtt', ...meta }),
    debug: (message: string, meta?: object) =>
        logger.debug(`[MQTT] ${message}`, { service: 'mqtt', ...meta }),
};

export const deviceLogger = {
    info: (deviceId: string, message: string, meta?: object) =>
        logger.info(`[Device:${deviceId}] ${message}`, { deviceId, ...meta }),
    error: (deviceId: string, message: string, meta?: object) =>
        logger.error(`[Device:${deviceId}] ${message}`, { deviceId, ...meta }),
    warn: (deviceId: string, message: string, meta?: object) =>
        logger.warn(`[Device:${deviceId}] ${message}`, { deviceId, ...meta }),
};

export const authLogger = {
    loginSuccess: (userId: string, ip: string) =>
        logger.info('User login successful', { event: 'login_success', userId, ip }),
    loginFailed: (email: string, ip: string, reason: string) =>
        logger.warn('Login attempt failed', { event: 'login_failed', email, ip, reason }),
    tokenRefresh: (userId: string) =>
        logger.info('Token refreshed', { event: 'token_refresh', userId }),
    logout: (userId: string) =>
        logger.info('User logged out', { event: 'logout', userId }),
};

export const securityLogger = {
    rateLimitExceeded: (ip: string, endpoint: string) =>
        logger.warn('Rate limit exceeded', { event: 'rate_limit', ip, endpoint }),
    invalidToken: (ip: string) =>
        logger.warn('Invalid token attempt', { event: 'invalid_token', ip }),
    suspiciousActivity: (ip: string, details: string) =>
        logger.error('Suspicious activity detected', { event: 'suspicious', ip, details }),
};
