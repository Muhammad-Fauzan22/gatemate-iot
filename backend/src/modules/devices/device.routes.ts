// =============================================================================
// GATEMATE Backend - Device Routes
// =============================================================================

import { Router } from 'express';
import { DeviceController } from './device.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new DeviceController();

// All routes require authentication
router.use(authMiddleware);

// Device CRUD
router.get('/', controller.getDevices);
router.get('/:id', controller.getDevice);
router.post('/', controller.createDevice);
router.put('/:id', controller.updateDevice);
router.delete('/:id', controller.deleteDevice);

// Device status
router.get('/:id/status', controller.getDeviceStatus);

export { router as deviceRouter };
