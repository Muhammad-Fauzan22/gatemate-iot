// =============================================================================
// GATEMATE Backend - Diagnostics Service
// =============================================================================

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { AuthRequest } from '../../types/auth.types.js';
import type { Response, NextFunction } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Get device diagnostics
router.get('/:deviceId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId } = req.params;

        // Verify access
        const device = await prisma.device.findFirst({
            where: {
                id: deviceId,
                users: { some: { userId: req.user!.userId } },
            },
            include: {
                sensorData: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                },
            },
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        const latestSensor = device.sensorData[0];

        // Build diagnostics report
        const diagnostics = {
            timestamp: new Date().toISOString(),
            device: {
                id: device.id,
                deviceId: device.deviceId,
                name: device.name,
                firmwareVersion: device.firmwareVersion || 'Unknown',
                macAddress: device.macAddress,
                ipAddress: device.ipAddress,
            },
            status: {
                online: device.isOnline,
                lastSeen: device.lastSeenAt,
            },
            checks: [
                {
                    name: 'ESP32',
                    status: device.isOnline ? 'ok' : 'error',
                    message: device.isOnline ? 'Device online' : 'Device offline',
                },
                {
                    name: 'WiFi',
                    status: latestSensor?.wifiSignal && latestSensor.wifiSignal > -70 ? 'ok' : 'warning',
                    message: latestSensor?.wifiSignal
                        ? `Signal: ${latestSensor.wifiSignal} dBm`
                        : 'No signal data',
                },
                {
                    name: 'Power',
                    status: latestSensor?.voltage && latestSensor.voltage > 10 ? 'ok' : 'warning',
                    message: latestSensor?.voltage
                        ? `Voltage: ${latestSensor.voltage}V`
                        : 'No power data',
                },
                {
                    name: 'Motor Current',
                    status: latestSensor?.current && latestSensor.current < 15 ? 'ok' : 'warning',
                    message: latestSensor?.current
                        ? `Current: ${latestSensor.current}A`
                        : 'No current data',
                },
                {
                    name: 'Temperature',
                    status: latestSensor?.temperature && latestSensor.temperature < 60 ? 'ok' : 'warning',
                    message: latestSensor?.temperature
                        ? `Temperature: ${latestSensor.temperature}°C`
                        : 'No temperature data',
                },
            ],
            recommendations: [] as string[],
        };

        // Generate recommendations
        if (!device.isOnline) {
            diagnostics.recommendations.push('Check if device is powered on');
            diagnostics.recommendations.push('Verify WiFi network is working');
            diagnostics.recommendations.push('Try power cycling the device');
        }
        if (latestSensor?.wifiSignal && latestSensor.wifiSignal < -75) {
            diagnostics.recommendations.push('Move device closer to WiFi router');
            diagnostics.recommendations.push('Consider adding a WiFi extender');
        }
        if (latestSensor?.temperature && latestSensor.temperature > 50) {
            diagnostics.recommendations.push('Check for adequate ventilation');
            diagnostics.recommendations.push('Reduce gate operation frequency');
        }

        res.json(diagnostics);
    } catch (error) {
        next(error);
    }
});

// Restart device remotely
router.post('/:deviceId/restart', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId } = req.params;

        const device = await prisma.device.findFirst({
            where: {
                id: deviceId,
                users: {
                    some: {
                        userId: req.user!.userId,
                        role: { in: ['OWNER', 'ADMIN'] },
                    }
                },
            },
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found or no permission' });
        }

        // TODO: Send restart command via MQTT
        console.log(`Restart command for device ${device.deviceId}`);

        await prisma.accessLog.create({
            data: {
                deviceId: device.id,
                userId: req.user!.userId,
                action: 'device_restart',
            },
        });

        res.json({ message: 'Restart command sent' });
    } catch (error) {
        next(error);
    }
});

// Get activity log
router.get('/:deviceId/activity', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId } = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const logs = await prisma.accessLog.findMany({
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
                    select: { id: true, name: true, email: true },
                },
            },
        });

        res.json(logs);
    } catch (error) {
        next(error);
    }
});

// Get sensor history
router.get('/:deviceId/sensors/history', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId } = req.params;
        const hours = parseInt(req.query.hours as string) || 24;

        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const sensorHistory = await prisma.sensorData.findMany({
            where: {
                device: {
                    id: deviceId,
                    users: { some: { userId: req.user!.userId } },
                },
                timestamp: { gte: since },
            },
            orderBy: { timestamp: 'asc' },
        });

        res.json(sensorHistory);
    } catch (error) {
        next(error);
    }
});

export { router as diagnosticsRouter };
