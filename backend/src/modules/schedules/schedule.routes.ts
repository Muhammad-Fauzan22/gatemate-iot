// =============================================================================
// GATEMATE Backend - Schedule Routes
// =============================================================================

import { Router } from 'express';
import { ScheduleController } from './schedule.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new ScheduleController();

// All routes require authentication
router.use(authMiddleware);

// Schedule CRUD
router.get('/', controller.getSchedules);
router.get('/:id', controller.getSchedule);
router.post('/', controller.createSchedule);
router.put('/:id', controller.updateSchedule);
router.delete('/:id', controller.deleteSchedule);

// Toggle enable/disable
router.patch('/:id/toggle', controller.toggleSchedule);

export { router as scheduleRouter };
