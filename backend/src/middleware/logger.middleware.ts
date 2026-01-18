// =============================================================================
// GATEMATE Backend - Logger Middleware (Winston)
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Simple Console Logger (Production should use Winston)
// =============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

const formatMessage = (level: string, message: string, meta?: any): string => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
    debug: (message: string, meta?: any) => {
        if (LOG_LEVELS.debug >= LOG_LEVELS[currentLevel]) {
            console.debug(formatMessage('debug', message, meta));
        }
    },

    info: (message: string, meta?: any) => {
        if (LOG_LEVELS.info >= LOG_LEVELS[currentLevel]) {
            console.info(formatMessage('info', message, meta));
        }
    },

    warn: (message: string, meta?: any) => {
        if (LOG_LEVELS.warn >= LOG_LEVELS[currentLevel]) {
            console.warn(formatMessage('warn', message, meta));
        }
    },

    error: (message: string, meta?: any) => {
        console.error(formatMessage('error', message, meta));
    },
};

// =============================================================================
// Request Logger Middleware
// =============================================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    // Generate unique request ID
    const requestId = uuidv4();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startTime = Date.now();
    const { method, path, query } = req;

    // Log incoming request
    logger.info(`--> ${method} ${path}`, {
        requestId,
        query: Object.keys(query).length > 0 ? query : undefined,
        ip: req.ip,
        userAgent: req.headers['user-agent']?.substring(0, 100),
    });

    // Capture response
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Color code based on status
        const statusEmoji =
            statusCode >= 500 ? '❌' :
                statusCode >= 400 ? '⚠️' :
                    statusCode >= 300 ? '↪️' : '✅';

        logger.info(`<-- ${statusEmoji} ${statusCode} ${method} ${path} (${duration}ms)`, {
            requestId,
            duration,
            contentLength: res.getHeader('content-length'),
        });

        return originalEnd.apply(res, args as unknown as Parameters<typeof originalEnd>);
    };

    next();
};

// =============================================================================
// Audit Logger (for sensitive operations)
// =============================================================================

interface AuditLog {
    timestamp: Date;
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: any;
    ip?: string;
    userAgent?: string;
    success: boolean;
    errorMessage?: string;
}

const auditLogs: AuditLog[] = [];

export const auditLogger = {
    log: (data: Omit<AuditLog, 'timestamp'>) => {
        const entry: AuditLog = {
            ...data,
            timestamp: new Date(),
        };

        auditLogs.push(entry);

        // Keep only last 10000 entries in memory
        if (auditLogs.length > 10000) {
            auditLogs.shift();
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            logger.info(`[AUDIT] ${data.action} ${data.resource}`, {
                userId: data.userId,
                success: data.success,
            });
        }
    },

    getRecent: (limit: number = 100): AuditLog[] => {
        return auditLogs.slice(-limit);
    },

    getByUser: (userId: string, limit: number = 50): AuditLog[] => {
        return auditLogs
            .filter(log => log.userId === userId)
            .slice(-limit);
    },
};

// =============================================================================
// Performance Logger
// =============================================================================

export const performanceLogger = {
    start: (operation: string): () => void => {
        const startTime = process.hrtime.bigint();

        return () => {
            const endTime = process.hrtime.bigint();
            const durationMs = Number(endTime - startTime) / 1_000_000;

            if (durationMs > 1000) {
                logger.warn(`Slow operation: ${operation} took ${durationMs.toFixed(2)}ms`);
            } else if (process.env.NODE_ENV === 'development') {
                logger.debug(`${operation}: ${durationMs.toFixed(2)}ms`);
            }
        };
    },
};
