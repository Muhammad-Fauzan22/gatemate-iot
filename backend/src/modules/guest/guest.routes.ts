// =============================================================================
// GATEMATE Backend - Guest Access Routes with QR Code
// =============================================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate, asyncHandler, NotFoundError, AuthorizationError, ValidationError } from '../../middleware/error.middleware.js';
import { guestAccessSchema, idParamSchema, paginationSchema } from '../../utils/validation.js';
import { auditLogger } from '../../middleware/logger.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// =============================================================================
// Helper Functions
// =============================================================================

function generateAccessCode(): string {
    return crypto.randomBytes(16).toString('hex');
}

function generateQRData(code: string): string {
    const baseUrl = process.env.GUEST_ACCESS_URL || 'https://gatemate.io/guest';
    return `${baseUrl}?code=${code}`;
}

// =============================================================================
// Protected Routes (Owner creates guest access)
// =============================================================================

/**
 * GET /api/v1/guest
 * List all guest access tokens created by user
 */
router.get('/',
    authMiddleware,
    validate({ query: paginationSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { page = 1, limit = 20 } = req.query as any;

        const skip = (page - 1) * limit;

        const [guests, total] = await Promise.all([
            prisma.guestAccess.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    device: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            }),
            prisma.guestAccess.count({ where: { userId } }),
        ]);

        res.json({
            success: true,
            data: guests.map(g => ({
                ...g,
                qrData: generateQRData(g.code),
                isExpired: g.expiresAt ? new Date(g.expiresAt) < new Date() : false,
                isExhausted: g.usedCount >= g.maxUses,
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
 * POST /api/v1/guest
 * Create a new guest access token
 */
router.post('/',
    authMiddleware,
    validate({ body: guestAccessSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { deviceId, name, expiresAt, maxUses, permissions } = req.body;

        // Verify device ownership
        const device = await prisma.device.findFirst({
            where: { id: deviceId, userId },
        });

        if (!device) {
            throw new AuthorizationError('Anda tidak memiliki akses ke perangkat ini');
        }

        const code = generateAccessCode();

        const guestAccess = await prisma.guestAccess.create({
            data: {
                code,
                name,
                userId,
                deviceId,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                maxUses,
                permissions: JSON.stringify(permissions),
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
            action: 'CREATE_GUEST_ACCESS',
            resource: 'guest_access',
            resourceId: guestAccess.id,
            userId,
            details: { name, deviceName: device.name, maxUses },
            success: true,
        });

        res.status(201).json({
            success: true,
            message: 'Akses tamu berhasil dibuat',
            data: {
                ...guestAccess,
                qrData: generateQRData(code),
            },
        });
    })
);

/**
 * DELETE /api/v1/guest/:id
 * Revoke a guest access token
 */
router.delete('/:id',
    authMiddleware,
    validate({ params: idParamSchema }),
    asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { id } = req.params;

        const existing = await prisma.guestAccess.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            throw new NotFoundError('Akses tamu');
        }

        await prisma.guestAccess.delete({ where: { id } });

        auditLogger.log({
            action: 'REVOKE_GUEST_ACCESS',
            resource: 'guest_access',
            resourceId: id,
            userId,
            details: { name: existing.name },
            success: true,
        });

        res.json({
            success: true,
            message: 'Akses tamu berhasil dicabut',
        });
    })
);

// =============================================================================
// Public Routes (Guest uses access code)
// =============================================================================

/**
 * POST /api/v1/guest/access
 * Use guest access code to control device
 */
router.post('/access',
    asyncHandler(async (req: Request, res: Response) => {
        const { code, action } = req.body;

        if (!code || !action) {
            throw new ValidationError('Kode dan aksi diperlukan');
        }

        // Find guest access
        const guestAccess = await prisma.guestAccess.findUnique({
            where: { code },
            include: {
                device: true,
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!guestAccess) {
            throw new NotFoundError('Kode akses');
        }

        // Check expiration
        if (guestAccess.expiresAt && new Date(guestAccess.expiresAt) < new Date()) {
            throw new AuthorizationError('Kode akses sudah kadaluarsa');
        }

        // Check usage limit
        if (guestAccess.usedCount >= guestAccess.maxUses) {
            throw new AuthorizationError('Kode akses sudah mencapai batas penggunaan');
        }

        // Check permission
        const permissions = JSON.parse(guestAccess.permissions || '["open"]');
        if (!permissions.includes(action)) {
            throw new AuthorizationError(`Anda tidak memiliki izin untuk ${action}`);
        }

        // Increment usage count
        await prisma.guestAccess.update({
            where: { id: guestAccess.id },
            data: {
                usedCount: guestAccess.usedCount + 1,
                lastUsedAt: new Date(),
            },
        });

        // Create activity log
        await prisma.activityLog.create({
            data: {
                userId: guestAccess.userId,
                deviceId: guestAccess.deviceId,
                action,
                source: 'guest',
                details: JSON.stringify({ guestName: guestAccess.name }),
            },
        });

        auditLogger.log({
            action: `GUEST_${action.toUpperCase()}`,
            resource: 'device',
            resourceId: guestAccess.deviceId,
            details: {
                guestName: guestAccess.name,
                deviceName: guestAccess.device.name,
                usedCount: guestAccess.usedCount + 1,
            },
            ip: req.ip,
            success: true,
        });

        // TODO: Send command to device via MQTT

        res.json({
            success: true,
            message: `Perintah ${action} berhasil dikirim`,
            data: {
                deviceName: guestAccess.device.name,
                action,
                remainingUses: guestAccess.maxUses - guestAccess.usedCount - 1,
            },
        });
    })
);

/**
 * GET /api/v1/guest/verify/:code
 * Verify if a guest access code is valid
 */
router.get('/verify/:code',
    asyncHandler(async (req: Request, res: Response) => {
        const { code } = req.params;

        const guestAccess = await prisma.guestAccess.findUnique({
            where: { code },
            include: {
                device: {
                    select: {
                        name: true,
                        type: true,
                    },
                },
                user: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!guestAccess) {
            res.json({
                success: true,
                data: {
                    valid: false,
                    reason: 'Kode tidak ditemukan',
                },
            });
            return;
        }

        const isExpired = guestAccess.expiresAt ? new Date(guestAccess.expiresAt) < new Date() : false;
        const isExhausted = guestAccess.usedCount >= guestAccess.maxUses;

        res.json({
            success: true,
            data: {
                valid: !isExpired && !isExhausted,
                isExpired,
                isExhausted,
                guestName: guestAccess.name,
                deviceName: guestAccess.device.name,
                deviceType: guestAccess.device.type,
                ownerName: guestAccess.user.name,
                permissions: JSON.parse(guestAccess.permissions || '[]'),
                remainingUses: Math.max(0, guestAccess.maxUses - guestAccess.usedCount),
                expiresAt: guestAccess.expiresAt,
            },
        });
    })
);

export { router as guestRouter };
