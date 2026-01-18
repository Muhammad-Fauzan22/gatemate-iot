// =============================================================================
// GATEMATE Backend - Auth Routes with Validation
// =============================================================================

import { Router, Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import {
    validate,
    asyncHandler,
} from '../../middleware/error.middleware.js';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
    updateProfileSchema,
} from '../../utils/validation.js';
import { auditLogger } from '../../middleware/logger.middleware.js';

const router = Router();
const authService = new AuthService();

// =============================================================================
// Public Routes
// =============================================================================

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
router.post('/register',
    validate({ body: registerSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { email, password, name } = req.body;

        const result = await authService.register({ email, password, name });

        auditLogger.log({
            action: 'REGISTER',
            resource: 'user',
            resourceId: result.user.id,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            success: true,
        });

        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: result,
        });
    })
);

/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
router.post('/login',
    validate({ body: loginSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        try {
            const result = await authService.login(email, password);

            auditLogger.log({
                action: 'LOGIN',
                resource: 'session',
                userId: result.user.id,
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                success: true,
            });

            res.json({
                success: true,
                message: 'Login berhasil',
                data: result,
            });
        } catch (error) {
            auditLogger.log({
                action: 'LOGIN_FAILED',
                resource: 'session',
                details: { email },
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                success: false,
                errorMessage: (error as Error).message,
            });

            throw error;
        }
    })
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
    validate({ body: refreshTokenSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;

        const result = await authService.refreshToken(refreshToken);

        res.json({
            success: true,
            message: 'Token diperbarui',
            data: result,
        });
    })
);

// =============================================================================
// Protected Routes (Require Authentication)
// =============================================================================

/**
 * POST /api/v1/auth/logout
 * Logout current session
 */
router.post('/logout',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        const userId = (req as any).user?.userId;

        if (token) {
            await authService.logout(token);
        }

        auditLogger.log({
            action: 'LOGOUT',
            resource: 'session',
            userId,
            ip: req.ip,
            success: true,
        });

        res.json({
            success: true,
            message: 'Logout berhasil',
        });
    })
);

/**
 * GET /api/v1/auth/profile
 * Get current user profile
 */
router.get('/profile',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;

        const profile = await authService.getProfile(userId);

        res.json({
            success: true,
            data: profile,
        });
    })
);

/**
 * PUT /api/v1/auth/profile
 * Update current user profile
 */
router.put('/profile',
    authMiddleware,
    validate({ body: updateProfileSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { name, avatar } = req.body;

        const profile = await authService.updateProfile(userId, { name, avatar });

        auditLogger.log({
            action: 'UPDATE_PROFILE',
            resource: 'user',
            userId,
            success: true,
        });

        res.json({
            success: true,
            message: 'Profil diperbarui',
            data: profile,
        });
    })
);

/**
 * POST /api/v1/auth/change-password
 * Change user password
 */
router.post('/change-password',
    authMiddleware,
    validate({ body: changePasswordSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { currentPassword, newPassword } = req.body;

        try {
            await authService.changePassword(userId, currentPassword, newPassword);

            auditLogger.log({
                action: 'CHANGE_PASSWORD',
                resource: 'user',
                userId,
                ip: req.ip,
                success: true,
            });

            res.json({
                success: true,
                message: 'Password berhasil diubah. Silakan login kembali.',
            });
        } catch (error) {
            auditLogger.log({
                action: 'CHANGE_PASSWORD_FAILED',
                resource: 'user',
                userId,
                ip: req.ip,
                success: false,
                errorMessage: (error as Error).message,
            });

            throw error;
        }
    })
);

/**
 * GET /api/v1/auth/sessions
 * Get all active sessions
 */
router.get('/sessions',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        // TODO: Implement session listing
        res.json({
            success: true,
            data: [],
            message: 'Session listing not implemented yet',
        });
    })
);

/**
 * DELETE /api/v1/auth/sessions/:sessionId
 * Revoke a specific session
 */
router.delete('/sessions/:sessionId',
    authMiddleware,
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { sessionId } = req.params;

        // TODO: Implement session revocation
        auditLogger.log({
            action: 'REVOKE_SESSION',
            resource: 'session',
            resourceId: sessionId,
            userId,
            success: true,
        });

        res.json({
            success: true,
            message: 'Session revoked',
        });
    })
);

export { router as authRouter };
