// =============================================================================
// GATEMATE Backend - Improved Auth Middleware (JWT with Refresh Tokens)
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/env.js';
import { AuthenticationError, AuthorizationError } from './error.middleware.js';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    type: 'access' | 'refresh';
    iat?: number;
    exp?: number;
}

export interface AuthRequest extends Request {
    user?: TokenPayload;
    deviceAccess?: {
        deviceId: string;
        role: string;
    };
}

// =============================================================================
// Token Generation
// =============================================================================

export const generateAccessToken = (payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string => {
    return jwt.sign(
        { ...payload, type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '15m' } // 15 minutes
    );
};

export const generateRefreshToken = (payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>): string => {
    return jwt.sign(
        { ...payload, type: 'refresh' },
        config.JWT_REFRESH_SECRET || config.JWT_SECRET,
        { expiresIn: '7d' } // 7 days
    );
};

export const generateTokenPair = (payload: Omit<TokenPayload, 'type' | 'iat' | 'exp'>) => {
    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        expiresIn: 15 * 60, // 15 minutes in seconds
    };
};

// =============================================================================
// Token Verification
// =============================================================================

export const verifyAccessToken = (token: string): TokenPayload => {
    const payload = jwt.verify(token, config.JWT_SECRET) as TokenPayload;

    if (payload.type !== 'access') {
        throw new AuthenticationError('Invalid token type');
    }

    return payload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    const payload = jwt.verify(
        token,
        config.JWT_REFRESH_SECRET || config.JWT_SECRET
    ) as TokenPayload;

    if (payload.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
    }

    return payload;
};

// =============================================================================
// Authentication Middleware
// =============================================================================

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AuthenticationError('Authorization header required');
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new AuthenticationError('Invalid authorization format. Use: Bearer <token>');
        }

        const token = parts[1];
        const payload = verifyAccessToken(token);

        // Verify user still exists and is active
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            type: 'access',
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired',
                code: 'TOKEN_EXPIRED',
            });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token',
                code: 'INVALID_TOKEN',
            });
        } else if (error instanceof AuthenticationError) {
            res.status(401).json({
                success: false,
                error: error.message,
                code: error.code,
            });
        } else {
            next(error);
        }
    }
};

// =============================================================================
// Role-Based Access Control
// =============================================================================

export const requireRole = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'AUTHENTICATION_REQUIRED',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                code: 'FORBIDDEN',
                requiredRoles: allowedRoles,
            });
        }

        next();
    };
};

// =============================================================================
// Device Access Middleware
// =============================================================================

export const requireDeviceAccess = (...allowedDeviceRoles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw new AuthenticationError('Authentication required');
            }

            const deviceId = req.params.deviceId || req.params.id || req.body.deviceId;

            if (!deviceId) {
                throw new AuthorizationError('Device ID required');
            }

            // Check device access
            const userDevice = await prisma.userDevice.findFirst({
                where: {
                    userId: req.user.userId,
                    device: {
                        OR: [
                            { id: deviceId },
                            { deviceId: deviceId },
                        ],
                    },
                },
                include: {
                    device: {
                        select: { id: true, deviceId: true },
                    },
                },
            });

            if (!userDevice) {
                throw new AuthorizationError('No access to this device');
            }

            if (allowedDeviceRoles.length > 0 && !allowedDeviceRoles.includes(userDevice.role)) {
                throw new AuthorizationError('Insufficient device permissions');
            }

            req.deviceAccess = {
                deviceId: userDevice.device.id,
                role: userDevice.role,
            };

            next();
        } catch (error) {
            if (error instanceof AuthorizationError) {
                res.status(403).json({
                    success: false,
                    error: error.message,
                    code: error.code,
                });
            } else {
                next(error);
            }
        }
    };
};

// =============================================================================
// Optional Auth (for public endpoints that can use auth)
// =============================================================================

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                const token = parts[1];
                const payload = verifyAccessToken(token);

                const user = await prisma.user.findUnique({
                    where: { id: payload.userId },
                    select: { id: true, email: true, role: true },
                });

                if (user) {
                    req.user = {
                        userId: user.id,
                        email: user.email,
                        role: user.role,
                        type: 'access',
                    };
                }
            }
        }
    } catch {
        // Ignore auth errors for optional auth
    }

    next();
};
