// =============================================================================
// GATEMATE Backend - Device Controller
// =============================================================================

import type { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../types/auth.types.js';

const prisma = new PrismaClient();

export class DeviceController {
    async getDevices(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const devices = await prisma.device.findMany({
                where: {
                    users: {
                        some: { userId: req.user!.userId },
                    },
                },
                include: {
                    sensorData: {
                        orderBy: { timestamp: 'desc' },
                        take: 1,
                    },
                },
            });

            res.json(devices);
        } catch (error) {
            next(error);
        }
    }

    async getDevice(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const device = await prisma.device.findFirst({
                where: {
                    id,
                    users: {
                        some: { userId: req.user!.userId },
                    },
                },
                include: {
                    sensorData: {
                        orderBy: { timestamp: 'desc' },
                        take: 10,
                    },
                    schedules: {
                        where: { enabled: true },
                    },
                },
            });

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            res.json(device);
        } catch (error) {
            next(error);
        }
    }

    async createDevice(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { deviceId, name, type } = req.body;

            const device = await prisma.device.create({
                data: {
                    deviceId,
                    name,
                    type,
                    users: {
                        create: {
                            userId: req.user!.userId,
                            role: 'OWNER',
                        },
                    },
                },
            });

            res.status(201).json(device);
        } catch (error) {
            next(error);
        }
    }

    async updateDevice(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name, config } = req.body;

            const device = await prisma.device.updateMany({
                where: {
                    id,
                    users: {
                        some: {
                            userId: req.user!.userId,
                            role: { in: ['OWNER', 'ADMIN'] },
                        },
                    },
                },
                data: { name, config },
            });

            if (device.count === 0) {
                return res.status(404).json({ error: 'Device not found or unauthorized' });
            }

            res.json({ message: 'Device updated' });
        } catch (error) {
            next(error);
        }
    }

    async deleteDevice(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const device = await prisma.device.deleteMany({
                where: {
                    id,
                    users: {
                        some: {
                            userId: req.user!.userId,
                            role: 'OWNER',
                        },
                    },
                },
            });

            if (device.count === 0) {
                return res.status(404).json({ error: 'Device not found or unauthorized' });
            }

            res.json({ message: 'Device deleted' });
        } catch (error) {
            next(error);
        }
    }

    async getDeviceStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const device = await prisma.device.findFirst({
                where: {
                    id,
                    users: {
                        some: { userId: req.user!.userId },
                    },
                },
                select: {
                    id: true,
                    deviceId: true,
                    name: true,
                    isOnline: true,
                    lastSeenAt: true,
                    sensorData: {
                        orderBy: { timestamp: 'desc' },
                        take: 1,
                    },
                },
            });

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            res.json(device);
        } catch (error) {
            next(error);
        }
    }
}
