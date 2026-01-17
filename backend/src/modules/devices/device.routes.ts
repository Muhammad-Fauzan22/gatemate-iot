// =============================================================================
// GATEMATE Backend - Device Routes with Validation
// =============================================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate, asyncHandler, NotFoundError } from '../../middleware/error.middleware.js';
import {
    createDeviceSchema,
    updateDeviceSchema,
    deviceCommandSchema,
    idParamSchema,
    paginationSchema,
} from '../../utils/validation.js';
import { auditLogger } from '../../middleware/logger.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// =============================================================================
// Device CRUD Operations
// =============================================================================

/**
 * GET /api/v1/devices
 * List all devices for the current user
 */
router.get('/',
    validate({ query: paginationSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;

        const skip = (page - 1) * limit;

        const [devices, total] = await Promise.all([
            prisma.device.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    ip: true,
                    macAddress: true,
                    firmwareVersion: true,
                    lastSeen: true,
                    createdAt: true,
                },
            }),
            prisma.device.count({ where: { userId } }),
        ]);

        res.json({
            success: true,
            data: devices,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

/**
 * GET /api/v1/devices/:id
 * Get a specific device
 */
router.get('/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const device = await prisma.device.findFirst({
            where: { id, userId },
            include: {
                schedules: {
                    select: {
                        id: true,
                        name: true,
                        time: true,
                        action: true,
                        enabled: true,
                    },
                },
            },
        });

        if (!device) {
            throw new NotFoundError('Perangkat');
        }

        res.json({
            success: true,
            data: device,
        });
    })
);

/**
 * POST /api/v1/devices
 * Create a new device
 */
router.post('/',
    validate({ body: createDeviceSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { name, type, ip, macAddress } = req.body;

        const device = await prisma.device.create({
            data: {
                name,
                type,
                ip,
                macAddress,
                userId,
                status: 'offline',
            },
        });

        auditLogger.log({
            action: 'CREATE_DEVICE',
            resource: 'device',
            resourceId: device.id,
            userId,
            details: { name, type },
            success: true,
        });

        res.status(201).json({
            success: true,
            message: 'Perangkat berhasil ditambahkan',
            data: device,
        });
    })
);

/**
 * PUT /api/v1/devices/:id
 * Update a device
 */
router.put('/:id',
    validate({ params: idParamSchema, body: updateDeviceSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        // Check ownership
        const existing = await prisma.device.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new NotFoundError('Perangkat');
        }

        const device = await prisma.device.update({
            where: { id },
            data: req.body,
        });

        auditLogger.log({
            action: 'UPDATE_DEVICE',
            resource: 'device',
            resourceId: id,
            userId,
            details: req.body,
            success: true,
        });

        res.json({
            success: true,
            message: 'Perangkat berhasil diperbarui',
            data: device,
        });
    })
);

/**
 * DELETE /api/v1/devices/:id
 * Delete a device
 */
router.delete('/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        // Check ownership
        const existing = await prisma.device.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new NotFoundError('Perangkat');
        }

        await prisma.device.delete({ where: { id } });

        auditLogger.log({
            action: 'DELETE_DEVICE',
            resource: 'device',
            resourceId: id,
            userId,
            details: { name: existing.name },
            success: true,
        });

        res.json({
            success: true,
            message: 'Perangkat berhasil dihapus',
        });
    })
);

// =============================================================================
// Device Commands
// =============================================================================

/**
 * POST /api/v1/devices/:id/command
 * Send a command to a device
 */
router.post('/:id/command',
    validate({ params: idParamSchema, body: deviceCommandSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { command, duration } = req.body;

        // Check ownership
        const device = await prisma.device.findFirst({
            where: { id, userId },
        });

        if (!device) {
            throw new NotFoundError('Perangkat');
        }

        // TODO: Send command to device via MQTT/HTTP
        // For now, just log it

        // Create activity log
        await prisma.activityLog.create({
            data: {
                userId,
                deviceId: id,
                action: command,
                details: JSON.stringify({ duration }),
                source: 'app',
            },
        });

        auditLogger.log({
            action: `DEVICE_${command.toUpperCase()}`,
            resource: 'device',
            resourceId: id,
            userId,
            details: { command, duration, deviceName: device.name },
            success: true,
        });

        res.json({
            success: true,
            message: `Perintah ${command} berhasil dikirim`,
            data: {
                deviceId: id,
                command,
                sentAt: new Date().toISOString(),
            },
        });
    })
);

/**
 * GET /api/v1/devices/:id/status
 * Get real-time device status
 */
router.get('/:id/status',
    validate({ params: idParamSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const device = await prisma.device.findFirst({
            where: { id, userId },
            select: {
                id: true,
                name: true,
                status: true,
                ip: true,
                lastSeen: true,
            },
        });

        if (!device) {
            throw new NotFoundError('Perangkat');
        }

        // TODO: Get real-time status from device

        res.json({
            success: true,
            data: {
                ...device,
                gateStatus: 'closed', // TODO: Get from device
                isOnline: device.status === 'online',
                lastChecked: new Date().toISOString(),
            },
        });
    })
);

/**
 * GET /api/v1/devices/:id/logs
 * Get device activity logs
 */
router.get('/:id/logs',
    validate({ params: idParamSchema, query: paginationSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query as any;

        // Check ownership
        const device = await prisma.device.findFirst({
            where: { id, userId },
        });

        if (!device) {
            throw new NotFoundError('Perangkat');
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where: { deviceId: id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    action: true,
                    details: true,
                    source: true,
                    createdAt: true,
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
            prisma.activityLog.count({ where: { deviceId: id } }),
        ]);

        res.json({
            success: true,
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    })
);

export { router as deviceRouter };
