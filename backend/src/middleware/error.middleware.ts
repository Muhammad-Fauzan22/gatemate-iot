// =============================================================================
// GATEMATE Backend - Global Error Handler
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { config } from '../config/env.js';

// =============================================================================
// Custom Error Classes
// =============================================================================

export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    public readonly errors: Record<string, string[]>;

    constructor(message: string, errors: Record<string, string[]> = {}) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409, 'CONFLICT');
    }
}

export class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_EXCEEDED');
    }
}

export class DeviceOfflineError extends AppError {
    constructor(deviceId: string) {
        super(`Device ${deviceId} is offline`, 503, 'DEVICE_OFFLINE');
    }
}

export class CommandTimeoutError extends AppError {
    constructor(commandId: string) {
        super(`Command ${commandId} timed out`, 504, 'COMMAND_TIMEOUT');
    }
}

// =============================================================================
// Error Response Interface
// =============================================================================

interface ErrorResponse {
    success: false;
    error: string;
    code: string;
    timestamp: string;
    requestId?: string;
    errors?: Record<string, string[]>;
    stack?: string;
}

// =============================================================================
// Global Error Handler Middleware
// =============================================================================

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log error
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        requestId: req.headers['x-request-id'],
        timestamp: new Date().toISOString(),
        body: config.NODE_ENV === 'development' ? req.body : undefined,
    });

    // Default error response
    let statusCode = 500;
    let errorResponse: ErrorResponse = {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
    };

    // Handle AppError (our custom errors)
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorResponse.error = err.message;
        errorResponse.code = err.code;

        if (err instanceof ValidationError) {
            errorResponse.errors = err.errors;
        }
    }
    // Handle Zod validation errors
    else if (err instanceof ZodError) {
        statusCode = 400;
        errorResponse.error = 'Validation failed';
        errorResponse.code = 'VALIDATION_ERROR';
        errorResponse.errors = {};

        err.errors.forEach((e) => {
            const path = e.path.join('.');
            if (!errorResponse.errors![path]) {
                errorResponse.errors![path] = [];
            }
            errorResponse.errors![path].push(e.message);
        });
    }
    // Handle Prisma errors
    else if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002':
                statusCode = 409;
                errorResponse.error = 'A record with this value already exists';
                errorResponse.code = 'DUPLICATE_ENTRY';
                break;
            case 'P2025':
                statusCode = 404;
                errorResponse.error = 'Record not found';
                errorResponse.code = 'NOT_FOUND';
                break;
            case 'P2003':
                statusCode = 400;
                errorResponse.error = 'Invalid reference - related record not found';
                errorResponse.code = 'INVALID_REFERENCE';
                break;
            default:
                errorResponse.error = 'Database error';
                errorResponse.code = 'DATABASE_ERROR';
        }
    }
    // Handle JWT errors
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        errorResponse.error = 'Invalid token';
        errorResponse.code = 'INVALID_TOKEN';
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        errorResponse.error = 'Token expired';
        errorResponse.code = 'TOKEN_EXPIRED';
    }
    // Handle SyntaxError (JSON parsing)
    else if (err instanceof SyntaxError && 'body' in err) {
        statusCode = 400;
        errorResponse.error = 'Invalid JSON body';
        errorResponse.code = 'INVALID_JSON';
    }

    // Include stack trace in development
    if (config.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
};

// =============================================================================
// 404 Handler
// =============================================================================

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        code: 'NOT_FOUND',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
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
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
