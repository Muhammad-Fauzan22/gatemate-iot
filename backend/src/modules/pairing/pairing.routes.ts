// =============================================================================
// GATEMATE Backend - Device Pairing Service
// =============================================================================

import { Router } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { AuthRequest } from '../../types/auth.types.js';
import type { Response, NextFunction } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Store pairing codes temporarily
const pairingCodes = new Map<string, { deviceId: string; expiresAt: Date }>();

// Scan for devices on network (called by app)
router.get('/scan', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // In production, this would use mDNS/Bonjour or UDP broadcast
        // For demo, return mock discovered devices
        const discoveredDevices = [
            {
                deviceId: 'GATEMATE-001',
                name: 'GATEMATE Device',
                ip: '192.168.1.100',
                type: 'GATE',
                paired: false,
            },
        ];

        // Check which are already paired
        const pairedDevices = await prisma.device.findMany({
            where: {
                users: { some: { userId: req.user!.userId } },
            },
            select: { deviceId: true },
        });

        const pairedIds = pairedDevices.map(d => d.deviceId);

        const devices = discoveredDevices.map(d => ({
            ...d,
            paired: pairedIds.includes(d.deviceId),
        }));

        res.json(devices);
    } catch (error) {
        next(error);
    }
});

// Generate pairing code (called by ESP32 setup)
router.post('/code', async (req, res, next) => {
    try {
        const { deviceId, mac } = req.body;

        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID required' });
        }

        // Generate 6-digit code
        const code = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        pairingCodes.set(code, { deviceId, expiresAt });

        // Auto-expire
        setTimeout(() => pairingCodes.delete(code), 10 * 60 * 1000);

        res.json({ code, expiresAt });
    } catch (error) {
        next(error);
    }
});

// Pair device with code
router.post('/pair', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { code, name } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Pairing code required' });
        }

        const pairingData = pairingCodes.get(code);

        if (!pairingData) {
            return res.status(404).json({ error: 'Invalid pairing code' });
        }

        if (new Date() > pairingData.expiresAt) {
            pairingCodes.delete(code);
            return res.status(410).json({ error: 'Pairing code expired' });
        }

        // Create or update device
        let device = await prisma.device.findUnique({
            where: { deviceId: pairingData.deviceId },
        });

        if (device) {
            // Check if user already has access
            const existingAccess = await prisma.userDevice.findFirst({
                where: {
                    deviceId: device.id,
                    userId: req.user!.userId,
                },
            });

            if (existingAccess) {
                return res.status(409).json({ error: 'Device already paired' });
            }

            // Add user to device
            await prisma.userDevice.create({
                data: {
                    userId: req.user!.userId,
                    deviceId: device.id,
                    role: 'OPERATOR',
                },
            });
        } else {
            // Create new device with owner
            device = await prisma.device.create({
                data: {
                    deviceId: pairingData.deviceId,
                    name: name || 'My Gate',
                    type: 'GATE',
                    isOnline: true,
                    users: {
                        create: {
                            userId: req.user!.userId,
                            role: 'OWNER',
                        },
                    },
                },
            });
        }

        // Remove used code
        pairingCodes.delete(code);

        // Log pairing
        await prisma.accessLog.create({
            data: {
                deviceId: device.id,
                userId: req.user!.userId,
                action: 'device_paired',
                details: { code },
            },
        });

        res.status(201).json({
            message: 'Device paired successfully',
            device: {
                id: device.id,
                deviceId: device.deviceId,
                name: device.name,
                type: device.type,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Pair by IP address (direct connection)
router.post('/pair-ip', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { ip, name } = req.body;

        if (!ip) {
            return res.status(400).json({ error: 'IP address required' });
        }

        // Try to fetch device info from IP
        try {
            const response = await fetch(`http://${ip}/config`, {
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                throw new Error('Device not responding');
            }

            const deviceInfo = await response.json() as any;

            // Create device
            const device = await prisma.device.create({
                data: {
                    deviceId: deviceInfo.device || `GATEMATE-${Date.now()}`,
                    name: name || deviceInfo.device || 'My Gate',
                    type: 'GATE',
                    ipAddress: ip,
                    firmwareVersion: deviceInfo.version,
                    macAddress: deviceInfo.mac,
                    isOnline: true,
                    users: {
                        create: {
                            userId: req.user!.userId,
                            role: 'OWNER',
                        },
                    },
                },
            });

            res.status(201).json({
                message: 'Device paired successfully',
                device: {
                    id: device.id,
                    deviceId: device.deviceId,
                    name: device.name,
                    ip: device.ipAddress,
                },
            });
        } catch (fetchError) {
            return res.status(400).json({ error: 'Could not connect to device at this IP' });
        }
    } catch (error) {
        next(error);
    }
});

// Unpair device
router.delete('/:deviceId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId } = req.params;

        // Check if user is owner
        const userDevice = await prisma.userDevice.findFirst({
            where: {
                device: { id: deviceId },
                userId: req.user!.userId,
                role: 'OWNER',
            },
        });

        if (!userDevice) {
            return res.status(403).json({ error: 'Only owner can unpair device' });
        }

        // Delete all user associations and device
        await prisma.userDevice.deleteMany({
            where: { deviceId },
        });

        await prisma.device.delete({
            where: { id: deviceId },
        });

        res.json({ message: 'Device unpaired' });
    } catch (error) {
        next(error);
    }
});

export { router as pairingRouter };
