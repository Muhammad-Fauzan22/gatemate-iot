// =============================================================================
// GATEMATE Backend - Authentication Routes
// =============================================================================

import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refreshToken);

// Protected routes
router.post('/logout', authMiddleware, controller.logout);
router.get('/me', authMiddleware, controller.getProfile);
router.put('/me', authMiddleware, controller.updateProfile);
router.put('/password', authMiddleware, controller.changePassword);

export { router as authRouter };
