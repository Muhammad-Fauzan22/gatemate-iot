// =============================================================================
// GATEMATE Backend - Schedule Controller
// =============================================================================

import type { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../types/auth.types.js';

const prisma = new PrismaClient();

export class ScheduleController {
    async getSchedules(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const schedules = await prisma.schedule.findMany({
                where: { userId: req.user!.userId },
                include: {
                    device: {
                        select: { id: true, name: true, deviceId: true },
                    },
                },
                orderBy: { time: 'asc' },
            });

            res.json(schedules);
        } catch (error) {
            next(error);
        }
    }

    async getSchedule(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const schedule = await prisma.schedule.findFirst({
                where: {
                    id,
                    userId: req.user!.userId,
                },
                include: {
                    device: {
                        select: { id: true, name: true, deviceId: true },
                    },
                },
            });

            if (!schedule) {
                return res.status(404).json({ error: 'Schedule not found' });
            }

            res.json(schedule);
        } catch (error) {
            next(error);
        }
    }

    async createSchedule(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { deviceId, name, action, time, recurrence } = req.body;

            // Verify device access
            const device = await prisma.device.findFirst({
                where: {
                    id: deviceId,
                    users: { some: { userId: req.user!.userId } },
                },
            });

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            const schedule = await prisma.schedule.create({
                data: {
                    deviceId,
                    userId: req.user!.userId,
                    name,
                    action,
                    time,
                    recurrence,
                    enabled: true,
                },
            });

            res.status(201).json(schedule);
        } catch (error) {
            next(error);
        }
    }

    async updateSchedule(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { name, action, time, recurrence, enabled } = req.body;

            const schedule = await prisma.schedule.updateMany({
                where: {
                    id,
                    userId: req.user!.userId,
                },
                data: { name, action, time, recurrence, enabled },
            });

            if (schedule.count === 0) {
                return res.status(404).json({ error: 'Schedule not found' });
            }

            res.json({ message: 'Schedule updated' });
        } catch (error) {
            next(error);
        }
    }

    async deleteSchedule(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const schedule = await prisma.schedule.deleteMany({
                where: {
                    id,
                    userId: req.user!.userId,
                },
            });

            if (schedule.count === 0) {
                return res.status(404).json({ error: 'Schedule not found' });
            }

            res.json({ message: 'Schedule deleted' });
        } catch (error) {
            next(error);
        }
    }

    async toggleSchedule(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            const existing = await prisma.schedule.findFirst({
                where: {
                    id,
                    userId: req.user!.userId,
                },
            });

            if (!existing) {
                return res.status(404).json({ error: 'Schedule not found' });
            }

            const schedule = await prisma.schedule.update({
                where: { id },
                data: { enabled: !existing.enabled },
            });

            res.json(schedule);
        } catch (error) {
            next(error);
        }
    }
}
