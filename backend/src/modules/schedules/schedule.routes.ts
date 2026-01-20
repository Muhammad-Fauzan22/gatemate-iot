// =============================================================================
// GATEMATE Backend - Schedule Routes with Validation
// =============================================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware.js';
import { validate, asyncHandler, NotFoundError, AuthorizationError } from '../../middleware/error.middleware.js';
import {
    createScheduleSchema,
    updateScheduleSchema,
    idParamSchema,
    paginationSchema,
} from '../../utils/validation.js';
import { auditLogger } from '../../middleware/logger.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authMiddleware);

// =============================================================================
// Schedule CRUD Operations
// =============================================================================

/**
 * GET /api/v1/schedules
 * List all schedules for the current user
 */
router.get('/',
    validate({ query: paginationSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user!.userId;
        const { page = 1, limit = 50, sortBy = 'time', sortOrder = 'asc' } = req.query as unknown as { page: number, limit: number, sortBy: string, sortOrder: string };

        const skip = (page - 1) * limit;

        const [schedules, total] = await Promise.all([
            prisma.schedule.findMany({
                where: {
                    userId, // Schedule directly linked to User
                },
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    device: {
                        select: {
                            id: true,
                            name: true,
                            type: true,
                        },
                    },
                },
            }),
            prisma.schedule.count({
                where: {
                    userId,
                },
            }),
        ]);

        res.json({
            success: true,
            data: schedules.map(s => ({
                ...s,
                days: s.recurrence ? JSON.parse(s.recurrence) : [], // Map recurrence -> days
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
 * GET /api/v1/schedules/:id
 * Get a specific schedule
 */
router.get('/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;

        const schedule = await prisma.schedule.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                device: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
            },
        });

        if (!schedule) {
            throw new NotFoundError('Jadwal');
        }

        res.json({
            success: true,
            data: {
                ...schedule,
                days: schedule.recurrence ? JSON.parse(schedule.recurrence) : [],
            },
        });
    })
);

/**
 * POST /api/v1/schedules
 * Create a new schedule
 */
router.post('/',
    validate({ body: createScheduleSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user!.userId;
        const { name, deviceId, action, time, days, enabled } = req.body;

        // Verify device ownership
        const device = await prisma.device.findFirst({
            where: {
                id: deviceId,
                users: { some: { userId } }
            },
        });

        if (!device) {
            throw new AuthorizationError('Anda tidak memiliki akses ke perangkat ini');
        }

        const schedule = await prisma.schedule.create({
            data: {
                name,
                deviceId,
                userId,
                action,
                time,
                recurrence: JSON.stringify(days || []), // Map days -> recurrence
                enabled: enabled !== undefined ? enabled : true,
            },
            include: {
                device: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        auditLogger.log({
            action: 'CREATE_SCHEDULE',
            resource: 'schedule',
            resourceId: schedule.id,
            userId,
            details: { name, deviceName: device.name, time, action },
            success: true,
        });

        res.status(201).json({
            success: true,
            message: 'Jadwal berhasil dibuat',
            data: {
                ...schedule,
                days: days || [],
            },
        });
    })
);

/**
 * PUT /api/v1/schedules/:id
 * Update a schedule
 */
router.put('/:id',
    validate({ params: idParamSchema, body: updateScheduleSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;
        const { name, action, time, days, enabled } = req.body;

        // Check ownership
        const existing = await prisma.schedule.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existing) {
            throw new NotFoundError('Jadwal');
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (action !== undefined) updateData.action = action;
        if (time !== undefined) updateData.time = time;
        if (days !== undefined) updateData.recurrence = JSON.stringify(days); // Map days -> recurrence
        if (enabled !== undefined) updateData.enabled = enabled;

        const schedule = await prisma.schedule.update({
            where: { id },
            data: updateData,
            include: {
                device: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        auditLogger.log({
            action: 'UPDATE_SCHEDULE',
            resource: 'schedule',
            resourceId: id,
            userId,
            details: updateData,
            success: true,
        });

        res.json({
            success: true,
            message: 'Jadwal berhasil diperbarui',
            data: {
                ...schedule,
                days: schedule.recurrence ? JSON.parse(schedule.recurrence) : [],
            },
        });
    })
);

/**
 * DELETE /api/v1/schedules/:id
 * Delete a schedule
 */
router.delete('/:id',
    validate({ params: idParamSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;

        // Check ownership
        const existing = await prisma.schedule.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existing) {
            throw new NotFoundError('Jadwal');
        }

        await prisma.schedule.delete({ where: { id } });

        auditLogger.log({
            action: 'DELETE_SCHEDULE',
            resource: 'schedule',
            resourceId: id,
            userId,
            details: { name: existing.name },
            success: true,
        });

        res.json({
            success: true,
            message: 'Jadwal berhasil dihapus',
        });
    })
);

/**
 * PATCH /api/v1/schedules/:id/toggle
 * Toggle schedule enabled status
 */
router.patch('/:id/toggle',
    validate({ params: idParamSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;

        // Check ownership
        const existing = await prisma.schedule.findFirst({
            where: {
                id,
                userId,
            },
            include: { device: { select: { id: true, name: true } } }
        });

        if (!existing) {
            throw new NotFoundError('Jadwal');
        }

        const schedule = await prisma.schedule.update({
            where: { id },
            data: { enabled: !existing.enabled },
        });

        auditLogger.log({
            action: schedule.enabled ? 'ENABLE_SCHEDULE' : 'DISABLE_SCHEDULE',
            resource: 'schedule',
            resourceId: id,
            userId,
            success: true,
        });

        res.json({
            success: true,
            message: schedule.enabled ? 'Jadwal diaktifkan' : 'Jadwal dinonaktifkan',
            data: {
                ...schedule,
                days: schedule.recurrence ? JSON.parse(schedule.recurrence) : [],
            },
        });
    })
);

/**
 * GET /api/v1/schedules/device/:deviceId
 * Get all schedules for a specific device
 */
router.get('/device/:deviceId',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validate({ params: { deviceId: idParamSchema.shape.id } as any }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as AuthRequest).user!.userId;
        const { deviceId } = req.params;

        // Verify device ownership
        const device = await prisma.device.findFirst({
            where: {
                id: deviceId,
                users: { some: { userId } }
            },
        });

        if (!device) {
            throw new NotFoundError('Perangkat');
        }

        const schedules = await prisma.schedule.findMany({
            where: { deviceId },
            orderBy: { time: 'asc' },
        });

        res.json({
            success: true,
            data: schedules.map(s => ({
                ...s,
                days: s.recurrence ? JSON.parse(s.recurrence) : [],
            })),
        });
    })
);

export { router as scheduleRouter };
