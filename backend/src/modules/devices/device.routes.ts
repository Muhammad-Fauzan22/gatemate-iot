// =============================================================================
// GATEMATE Backend - Device Routes with Validation
// =============================================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware.js';
import { validate, asyncHandler, NotFoundError } from '../../middleware/error.middleware.js';
import {
    createDeviceSchema,
    updateDeviceSchema,
    deviceCommandSchema,
    idParamSchema,
    paginationSchema,
} from '../../utils/validation.js';
import crypto from 'crypto';
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
        const userId = (req as AuthRequest).user!.userId;
        const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as unknown as { page: number, limit: number, sortBy: string, sortOrder: string };

        const skip = (page - 1) * limit;

        const [devices, total] = await Promise.all([
            prisma.device.findMany({
                where: {
                    users: {
                        some: { userId }
                    }
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    isOnline: true,
                    ipAddress: true,
                    macAddress: true,
                    firmwareVersion: true,
                    lastSeenAt: true,
                    createdAt: true,
                },
            }),
            prisma.device.count({
                where: {
                    users: {
                        some: { userId }
                    }
                }
            }),
        ]);

        res.json({
            success: true,
            data: devices.map(d => ({
                ...d,
                status: d.isOnline ? 'online' : 'offline',
                ip: d.ipAddress
            })),
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
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;

        const device = await prisma.device.findFirst({
            where: {
                id,
                users: {
                    some: { userId }
                }
            },
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
            data: {
                ...device,
                status: device.isOnline ? 'online' : 'offline',
                ip: device.ipAddress
            },
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
        const userId = (req as AuthRequest).user!.userId;
        const { name, type, ip, macAddress } = req.body;

        const device = await prisma.device.create({
            data: {
                deviceId: `DEV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, // Generate unique deviceId
                name,
                type,
                ipAddress: ip,
                macAddress,
                isOnline: false,
                users: {
                    create: {
                        userId,
                        role: 'OWNER'
                    }
                }
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
            data: {
                ...device,
                status: 'offline',
                ip: device.ipAddress
            },
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
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;

        // Check ownership
        const existing = await prisma.device.findFirst({
            where: {
                id,
                users: {
                    some: { userId }
                }
            },
        });

        if (!existing) {
            throw new NotFoundError('Perangkat');
        }

        const { ip, ...otherData } = req.body;
        const updateData: any = { ...otherData };
        if (ip) updateData.ipAddress = ip;

        const device = await prisma.device.update({
            where: { id },
            data: updateData,
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
            data: {
                ...device,
                status: device.isOnline ? 'online' : 'offline',
                ip: device.ipAddress
            },
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
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;

        // Check ownership
        const existing = await prisma.device.findFirst({
            where: {
                id,
                users: {
                    some: { userId }
                }
            },
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
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;
        const { command, duration } = req.body;

        // Check ownership
        const device = await prisma.device.findFirst({
            where: {
                id,
                users: {
                    some: { userId }
                }
            },
        });

        if (!device) {
            throw new NotFoundError('Perangkat');
        }

        // TODO: Send command to device via MQTT/HTTP
        // For now, just log it

        // Create access log (formerly activity log)
        await prisma.accessLog.create({
            data: {
                userId,
                deviceId: id,
                action: command,
                details: JSON.stringify({ duration }),
                userAgent: req.headers['user-agent'] || 'app',
                ipAddress: req.ip
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
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;

        const device = await prisma.device.findFirst({
            where: {
                id,
                users: {
                    some: { userId }
                }
            },
            select: {
                id: true,
                name: true,
                isOnline: true,
                ipAddress: true,
                lastSeenAt: true,
            },
        });

        if (!device) {
            throw new NotFoundError('Perangkat');
        }

        res.json({
            success: true,
            data: {
                ...device,
                ip: device.ipAddress,
                status: device.isOnline ? 'online' : 'offline',
                gateStatus: 'closed', // TODO: Get from device
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
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query as unknown as { page: number, limit: number };

        // Check ownership
        const device = await prisma.device.findFirst({
            where: {
                id,
                users: {
                    some: { userId }
                }
            },
        });

        if (!device) {
            throw new NotFoundError('Perangkat');
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            prisma.accessLog.findMany({
                where: { deviceId: id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    action: true,
                    details: true,
                    createdAt: true,
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
            prisma.accessLog.count({ where: { deviceId: id } }),
        ]);

        res.json({
            success: true,
            data: logs.map(log => ({
                ...log,
                source: 'app', // accessLog mismatch
            })),
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
