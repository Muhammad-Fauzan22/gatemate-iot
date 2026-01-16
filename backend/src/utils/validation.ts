// =============================================================================
// GATEMATE Backend - Input Validation Schemas (Zod)
// =============================================================================

import { z } from 'zod';

// =============================================================================
// Common Schemas
// =============================================================================

export const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const idParamSchema = z.object({
    id: z.string().min(1, 'ID is required'),
});

// =============================================================================
// Auth Schemas
// =============================================================================

export const registerSchema = z.object({
    email: z.string()
        .min(1, 'Email is required')
        .email('Invalid email format')
        .max(255, 'Email too long'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password too long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name too long'),
});

export const loginSchema = z.object({
    email: z.string()
        .min(1, 'Email is required')
        .email('Invalid email format'),
    password: z.string()
        .min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    avatar: z.string().url().optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password too long')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

// =============================================================================
// Device Schemas
// =============================================================================

export const createDeviceSchema = z.object({
    deviceId: z.string()
        .min(1, 'Device ID is required')
        .max(50, 'Device ID too long')
        .regex(/^[a-zA-Z0-9-_]+$/, 'Device ID can only contain letters, numbers, hyphens, and underscores'),
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name too long'),
    type: z.enum(['GATE', 'BARRIER', 'DOOR', 'SHUTTER']).default('GATE'),
});

export const updateDeviceSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    config: z.record(z.any()).optional(),
});

// =============================================================================
// Command Schemas
// =============================================================================

export const deviceIdParamSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
});

export const partialOpenSchema = z.object({
    percentage: z.coerce.number()
        .min(0, 'Percentage must be between 0 and 100')
        .max(100, 'Percentage must be between 0 and 100'),
});

// =============================================================================
// Schedule Schemas
// =============================================================================

export const createScheduleSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    name: z.string().max(100).optional(),
    action: z.enum(['OPEN', 'CLOSE', 'PARTIAL']),
    time: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format'),
    recurrence: z.string()
        .min(1, 'Recurrence is required'),
    payload: z.record(z.any()).optional(),
});

export const updateScheduleSchema = z.object({
    name: z.string().max(100).optional(),
    action: z.enum(['OPEN', 'CLOSE', 'PARTIAL']).optional(),
    time: z.string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format')
        .optional(),
    recurrence: z.string().optional(),
    enabled: z.boolean().optional(),
    payload: z.record(z.any()).optional(),
});

// =============================================================================
// Guest Access Schemas
// =============================================================================

export const createGuestPassSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    name: z.string().max(100).optional(),
    duration: z.coerce.number()
        .min(0.5, 'Duration must be at least 30 minutes')
        .max(168, 'Duration cannot exceed 1 week'),
    permissions: z.array(z.enum(['open', 'close', 'view']))
        .min(1, 'At least one permission is required'),
    maxUses: z.coerce.number().min(1).max(100).default(1),
});

export const executeGuestCommandSchema = z.object({
    command: z.enum(['open', 'close', 'stop']),
});

// =============================================================================
// Pairing Schemas
// =============================================================================

export const pairingCodeSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    mac: z.string().optional(),
});

export const pairByCodeSchema = z.object({
    code: z.string()
        .length(6, 'Pairing code must be 6 digits')
        .regex(/^\d{6}$/, 'Pairing code must contain only numbers'),
    name: z.string().max(100).optional(),
});

export const pairByIpSchema = z.object({
    ip: z.string()
        .min(1, 'IP address is required')
        .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address format'),
    name: z.string().max(100).optional(),
});

// =============================================================================
// Invitation Schemas
// =============================================================================

export const inviteUserSchema = z.object({
    deviceId: z.string().min(1, 'Device ID is required'),
    email: z.string().email('Invalid email format'),
    role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).default('OPERATOR'),
});

export const updateUserRoleSchema = z.object({
    role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']),
});

// =============================================================================
// Validation Middleware
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string[]> = {};

                error.errors.forEach((e) => {
                    const path = e.path.slice(1).join('.') || 'general';
                    if (!errors[path]) {
                        errors[path] = [];
                    }
                    errors[path].push(e.message);
                });

                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    errors,
                });
            } else {
                next(error);
            }
        }
    };
};

// Wrapper schemas for route validation
export const validateBody = <T extends z.ZodType>(schema: T) => {
    return z.object({ body: schema });
};

export const validateParams = <T extends z.ZodType>(schema: T) => {
    return z.object({ params: schema });
};

export const validateQuery = <T extends z.ZodType>(schema: T) => {
    return z.object({ query: schema });
};
