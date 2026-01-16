// =============================================================================
// GATEMATE Backend - Command Controller
// =============================================================================

import type { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../types/auth.types.js';

const prisma = new PrismaClient();

// Note: In production, this would publish to MQTT
async function sendCommandToDevice(deviceId: string, command: any) {
    console.log(`Sending command to ${deviceId}:`, command);
    // TODO: Implement MQTT publish
    return true;
}

export class CommandController {
    async openGate(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { deviceId } = req.params;

            // Verify user access
            const device = await prisma.device.findFirst({
                where: {
                    id: deviceId,
                    users: { some: { userId: req.user!.userId } },
                },
            });

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            // Create command record
            const command = await prisma.command.create({
                data: {
                    deviceId,
                    userId: req.user!.userId,
                    type: 'OPEN',
                    status: 'PENDING',
                },
            });

            // Send to device
            await sendCommandToDevice(device.deviceId, { command: 'open' });

            // Update status
            await prisma.command.update({
                where: { id: command.id },
                data: { status: 'EXECUTING', executedAt: new Date() },
            });

            res.json({ message: 'Gate opening', commandId: command.id });
        } catch (error) {
            next(error);
        }
    }

    async closeGate(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { deviceId } = req.params;

            const device = await prisma.device.findFirst({
                where: {
                    id: deviceId,
                    users: { some: { userId: req.user!.userId } },
                },
            });

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            const command = await prisma.command.create({
                data: {
                    deviceId,
                    userId: req.user!.userId,
                    type: 'CLOSE',
                    status: 'PENDING',
                },
            });

            await sendCommandToDevice(device.deviceId, { command: 'close' });

            await prisma.command.update({
                where: { id: command.id },
                data: { status: 'EXECUTING', executedAt: new Date() },
            });

            res.json({ message: 'Gate closing', commandId: command.id });
        } catch (error) {
            next(error);
        }
    }

    async stopGate(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { deviceId } = req.params;

            const device = await prisma.device.findFirst({
                where: {
                    id: deviceId,
                    users: { some: { userId: req.user!.userId } },
                },
            });

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            const command = await prisma.command.create({
                data: {
                    deviceId,
                    userId: req.user!.userId,
                    type: 'STOP',
                    status: 'PENDING',
                },
            });

            await sendCommandToDevice(device.deviceId, { command: 'stop' });

            await prisma.command.update({
                where: { id: command.id },
                data: { status: 'COMPLETED', executedAt: new Date(), completedAt: new Date() },
            });

            res.json({ message: 'Gate stopped', commandId: command.id });
        } catch (error) {
            next(error);
        }
    }

    async partialOpen(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { deviceId } = req.params;
            const { percentage } = req.body;

            if (percentage === undefined || percentage < 0 || percentage > 100) {
                return res.status(400).json({ error: 'Invalid percentage (0-100)' });
            }

            const device = await prisma.device.findFirst({
                where: {
                    id: deviceId,
                    users: { some: { userId: req.user!.userId } },
                },
            });

            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }

            const command = await prisma.command.create({
                data: {
                    deviceId,
                    userId: req.user!.userId,
                    type: 'PARTIAL',
                    payload: { percentage },
                    status: 'PENDING',
                },
            });

            await sendCommandToDevice(device.deviceId, { command: 'partial', percentage });

            await prisma.command.update({
                where: { id: command.id },
                data: { status: 'EXECUTING', executedAt: new Date() },
            });

            res.json({ message: `Moving to ${percentage}%`, commandId: command.id });
        } catch (error) {
            next(error);
        }
    }

    async getCommandHistory(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { deviceId } = req.params;
            const limit = parseInt(req.query.limit as string) || 20;

            const commands = await prisma.command.findMany({
                where: {
                    deviceId,
                    device: {
                        users: { some: { userId: req.user!.userId } },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    user: {
                        select: { id: true, name: true },
                    },
                },
            });

            res.json(commands);
        } catch (error) {
            next(error);
        }
    }
}
