// =============================================================================
// GATEMATE Backend - Command Routes
// =============================================================================

import { Router } from 'express';
import { CommandController } from './command.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new CommandController();

// All routes require authentication
router.use(authMiddleware);

// Gate control commands
router.post('/:deviceId/open', controller.openGate);
router.post('/:deviceId/close', controller.closeGate);
router.post('/:deviceId/stop', controller.stopGate);
router.post('/:deviceId/partial', controller.partialOpen);

// Command history
router.get('/:deviceId/history', controller.getCommandHistory);

export { router as commandRouter };
