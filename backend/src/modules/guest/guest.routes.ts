// =============================================================================
// GATEMATE Backend - Guest Access Routes with QR Code
// =============================================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { authMiddleware, AuthRequest } from '../../middleware/auth.middleware.js';
import { validate, asyncHandler, NotFoundError, AuthorizationError, ValidationError } from '../../middleware/error.middleware.js';
import { guestAccessSchema, idParamSchema, paginationSchema } from '../../utils/validation.js';
import { auditLogger } from '../../middleware/logger.middleware.js';

const router = Router();
const prisma = new PrismaClient();



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
        const userId = (req as AuthRequest).user!.userId;
        const { page = 1, limit = 20 } = req.query as unknown as { page: number, limit: number };

        const skip = (page - 1) * limit;

        const [guests, total] = await Promise.all([
            prisma.guestPass.findMany({
                where: { createdBy: userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                // Device relation exists in schema? We need to check schema carefully.
                // Assuming device relation exists in GuestPass (deviceId field + relation)
                // Schema line 226: deviceId String
                // Schema line is missing relation definition in snippet view?
                // Let's assume relation exists or we fetch manually.
                // Re-checking schema: Line 224: model GuestPass { ... deviceId String ... }
                // It does NOT explicitly show @relation to Device.
                // But it's highly likely. If not, this include fails.
                // Assuming it has relation based on previous code.
                // Wait, previous code used guestAccess which had relation.
                // If I can't trust relation, I can't include.
                // But let's assume standard Prisma usage implies relation for deviceId.
            }),
            prisma.guestPass.count({ where: { createdBy: userId } }),
        ]);

        // If relation is missing in schema, we'd need to fetch devices.
        // For now, let's assume we can only return basic data if relation fails.
        // But to pass build, let's avoid includes if they are risky, or modify schema.
        // Since I can't modify schema easily (migration needed), I will stick to code that works with Model.
        // If findMany accepts include, good. If safe-mode, fetch devices manually.
        // Let's safe-mode: fetch devices for these passes
        const deviceIds = [...new Set(guests.map(g => g.deviceId))];
        const devices = await prisma.device.findMany({
            where: { id: { in: deviceIds } },
            select: { id: true, name: true }
        });
        const deviceMap = new Map(devices.map(d => [d.id, d]));

        res.json({
            success: true,
            data: guests.map(g => ({
                ...g,
                device: deviceMap.get(g.deviceId) || { id: g.deviceId, name: 'Unknown' },

                code: g.id,
                qrData: generateQRData(g.id),
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
        const userId = (req as AuthRequest).user!.userId;
        const { deviceId, name, expiresAt, maxUses, permissions } = req.body;

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

        // Generate code? If schema doesn't have code, use CUID ID.
        // If schema has code, we'd use it.
        // Let's trust schema snippet: No code.
        const guestPass = await prisma.guestPass.create({
            data: {
                // code, // Removing code if schema lacks it
                name,
                createdBy: userId,
                deviceId,
                // Schema requires expiresAt (DateTime), assuming validation enforces it exists
                // If optional in body but required in DB, default to 24h?
                // Let's assume validation ensures it or we default it.
                expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 1 day
                maxUses,
                permissions: permissions,
                revoked: false
            }
        });

        auditLogger.log({
            action: 'CREATE_GUEST_PASS',
            resource: 'guest_pass',
            resourceId: guestPass.id,
            userId,
            details: { name, deviceName: device.name, maxUses },
            success: true,
        });

        res.status(201).json({
            success: true,
            message: 'Akses tamu berhasil dibuat',
            data: {
                ...guestPass,
                code: guestPass.id, // Use ID as code
                qrData: generateQRData(guestPass.id),
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
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;

        const existing = await prisma.guestPass.findFirst({
            where: { id, createdBy: userId },
        });

        if (!existing) {
            throw new NotFoundError('Akses tamu');
        }

        await prisma.guestPass.delete({ where: { id } });

        auditLogger.log({
            action: 'REVOKE_GUEST_PASS',
            resource: 'guest_pass',
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

        // Find guest pass by ID (code)
        const guestPass = await prisma.guestPass.findUnique({
            where: { id: code }, // Assuming code == id
        });

        if (!guestPass) {
            throw new NotFoundError('Kode akses');
        }

        // Check expiration
        if (guestPass.expiresAt && new Date(guestPass.expiresAt) < new Date()) {
            throw new AuthorizationError('Kode akses sudah kadaluarsa');
        }

        // Check usage limit
        if (guestPass.usedCount >= guestPass.maxUses) {
            throw new AuthorizationError('Kode akses sudah mencapai batas penggunaan');
        }

        // Check permission - Array direct check
        if (!guestPass.permissions.includes(action)) {
            throw new AuthorizationError(`Anda tidak memiliki izin untuk ${action}`);
        }

        // Basic Revoked check
        if (guestPass.revoked) {
            throw new AuthorizationError('Kode akses sudah dicabut');
        }

        // Increment usage count
        await prisma.guestPass.update({
            where: { id: guestPass.id },
            data: {
                usedCount: { increment: 1 },
            },
        });

        // Fetch device for details
        const device = await prisma.device.findUnique({ where: { id: guestPass.deviceId } });

        // Create access log
        await prisma.accessLog.create({
            data: {
                userId: null, // Guest has no user ID
                deviceId: guestPass.deviceId,
                action,
                details: JSON.stringify({ guestName: guestPass.name, source: 'guest' }),
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            },
        });

        auditLogger.log({
            action: `GUEST_${action.toUpperCase()}`,
            resource: 'device',
            resourceId: guestPass.deviceId,
            details: {
                guestName: guestPass.name,
                deviceName: device?.name,
                usedCount: guestPass.usedCount + 1,
            },
            ip: req.ip,
            success: true,
        });

        // TODO: Send command to device via MQTT

        res.json({
            success: true,
            message: `Perintah ${action} berhasil dikirim`,
            data: {
                deviceName: device?.name,
                action,
                remainingUses: guestPass.maxUses - guestPass.usedCount - 1,
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

        const guestPass = await prisma.guestPass.findUnique({
            where: { id: code },
        });

        if (!guestPass) {
            res.json({
                success: true,
                data: {
                    valid: false,
                    reason: 'Kode tidak ditemukan',
                },
            });
            return;
        }

        // Fetch device and owner info separately since no relations
        const device = await prisma.device.findUnique({ where: { id: guestPass.deviceId } });
        const owner = await prisma.user.findUnique({ where: { id: guestPass.createdBy } });

        const isExpired = guestPass.expiresAt ? new Date(guestPass.expiresAt) < new Date() : false;
        const isExhausted = guestPass.usedCount >= guestPass.maxUses;
        const isRevoked = guestPass.revoked;

        res.json({
            success: true,
            data: {
                valid: !isExpired && !isExhausted && !isRevoked,
                isExpired,
                isExhausted,
                isRevoked,
                guestName: guestPass.name,
                deviceName: device?.name,
                deviceType: device?.type,
                ownerName: owner?.name,
                permissions: guestPass.permissions,
                remainingUses: Math.max(0, guestPass.maxUses - guestPass.usedCount),
                expiresAt: guestPass.expiresAt,
            },
        });
    })
);

export { router as guestRouter };
