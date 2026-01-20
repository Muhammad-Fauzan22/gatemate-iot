// =============================================================================
// GATEMATE Backend - Enhanced Error Handling Middleware
// =============================================================================

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// =============================================================================
// Custom Error Classes
// =============================================================================

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
    public readonly details?: any;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        details?: any
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: any) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Autentikasi diperlukan') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Akses ditolak') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} tidak ditemukan`, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT');
    }
}

export class RateLimitError extends AppError {
    constructor(retryAfter: number) {
        super('Terlalu banyak request', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
    }
}

// =============================================================================
// Error Response Interface
// =============================================================================

interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
        stack?: string;
    };
    timestamp: string;
    path: string;
    requestId?: string;
}

// =============================================================================
// Error Handler Middleware
// =============================================================================

export const errorHandler: ErrorRequestHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Generate request ID for tracking
    const requestId = req.headers['x-request-id'] as string ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Default error values
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Terjadi kesalahan pada server';
    let details: any = undefined;

    // Log error
    console.error(`[${requestId}] Error:`, {
        name: err.name,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        user: (req as Request & { user?: { userId: string } }).user?.userId,
    });

    // Handle specific error types
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        code = err.code;
        message = err.message;
        details = err.details;
    } else if (err instanceof ZodError) {
        // Zod validation errors
        statusCode = 400;
        code = 'VALIDATION_ERROR';
        message = 'Data tidak valid';
        details = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Prisma errors
        switch (err.code) {
            case 'P2002':
                statusCode = 409;
                code = 'DUPLICATE_ENTRY';
                message = 'Data sudah ada';
                break;
            case 'P2025':
                statusCode = 404;
                code = 'NOT_FOUND';
                message = 'Data tidak ditemukan';
                break;
            case 'P2003':
                statusCode = 400;
                code = 'FOREIGN_KEY_ERROR';
                message = 'Referensi data tidak valid';
                break;
            default:
                code = `PRISMA_${err.code}`;
                message = 'Kesalahan database';
        }
    } else if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        code = 'DATABASE_VALIDATION_ERROR';
        message = 'Format data tidak valid';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        code = 'INVALID_TOKEN';
        message = 'Token tidak valid';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        code = 'TOKEN_EXPIRED';
        message = 'Token sudah kadaluarsa';
    } else if (err.name === 'SyntaxError' && 'body' in err) {
        statusCode = 400;
        code = 'INVALID_JSON';
        message = 'Format JSON tidak valid';
    }

    // Build response
    const response: ErrorResponse = {
        success: false,
        error: {
            code,
            message,
            details,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId,
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.error.stack = err.stack;
    }

    // Send response
    res.status(statusCode).json(response);
};

// =============================================================================
// Not Found Handler
// =============================================================================

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ENDPOINT_NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} tidak ditemukan`,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
    });
};

// =============================================================================
// Async Handler Wrapper
// =============================================================================

type AsyncHandler = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>;

export const asyncHandler = (fn: AsyncHandler) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// =============================================================================
// Validation Middleware Factory
// =============================================================================

import { ZodSchema } from 'zod';

interface ValidateOptions {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}

export const validate = (schemas: ValidateOptions) => {
    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
        try {
            if (schemas.body) {
                req.body = await schemas.body.parseAsync(req.body);
            }
            if (schemas.query) {
                req.query = await schemas.query.parseAsync(req.query);
            }
            if (schemas.params) {
                req.params = await schemas.params.parseAsync(req.params);
            }
            next();
        } catch (error) {
            next(error);
        }
    };
};

// =============================================================================
// Request Logger Middleware
// =============================================================================

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add request ID to headers
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    // Log request
    console.log(`[${requestId}] --> ${req.method} ${req.path}`);

    // Log response on finish
    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusEmoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';

        console.log(`[${requestId}] <-- ${statusEmoji} ${status} (${duration}ms)`);
    });

    next();
};

// =============================================================================
// Health Check Response
// =============================================================================

export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    services: {
        database: 'connected' | 'disconnected';
        redis: 'connected' | 'disconnected';
        mqtt: 'connected' | 'disconnected';
    };
}
