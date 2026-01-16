// =============================================================================
// GATEMATE Backend - User Invitation Service
// =============================================================================

import { Router } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { AuthRequest } from '../../types/auth.types.js';
import type { Response, NextFunction } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Store invitations (use database in production)
const invitations = new Map<string, Invitation>();

interface Invitation {
    code: string;
    deviceId: string;
    invitedBy: string;
    email: string;
    role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
    expiresAt: Date;
    used: boolean;
}

// Invite user to device
router.post('/invite', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId, email, role = 'OPERATOR' } = req.body;

        if (!deviceId || !email) {
            return res.status(400).json({ error: 'Device ID and email required' });
        }

        // Verify device ownership/admin
        const userDevice = await prisma.userDevice.findFirst({
            where: {
                deviceId,
                userId: req.user!.userId,
                role: { in: ['OWNER', 'ADMIN'] },
            },
            include: { device: true },
        });

        if (!userDevice) {
            return res.status(403).json({ error: 'No permission to invite users' });
        }

        // Check if user already has access
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            const existingAccess = await prisma.userDevice.findFirst({
                where: {
                    deviceId,
                    userId: existingUser.id,
                },
            });

            if (existingAccess) {
                return res.status(409).json({ error: 'User already has access' });
            }
        }

        // Generate invitation code
        const code = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invitation: Invitation = {
            code,
            deviceId,
            invitedBy: req.user!.userId,
            email,
            role,
            expiresAt,
            used: false,
        };

        invitations.set(code, invitation);

        // TODO: Send email with invitation link
        const inviteUrl = `https://gatemate.example.com/invite/${code}`;

        res.status(201).json({
            message: 'Invitation sent',
            code,
            inviteUrl,
            expiresAt,
        });
    } catch (error) {
        next(error);
    }
});

// Accept invitation
router.post('/accept/:code', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { code } = req.params;
        const invitation = invitations.get(code);

        if (!invitation) {
            return res.status(404).json({ error: 'Invitation not found' });
        }

        if (invitation.used) {
            return res.status(410).json({ error: 'Invitation already used' });
        }

        if (new Date() > invitation.expiresAt) {
            invitations.delete(code);
            return res.status(410).json({ error: 'Invitation expired' });
        }

        // Add user to device
        await prisma.userDevice.create({
            data: {
                userId: req.user!.userId,
                deviceId: invitation.deviceId,
                role: invitation.role,
            },
        });

        invitation.used = true;

        // Log
        await prisma.accessLog.create({
            data: {
                deviceId: invitation.deviceId,
                userId: req.user!.userId,
                action: 'invitation_accepted',
                details: { invitedBy: invitation.invitedBy, role: invitation.role },
            },
        });

        res.json({ message: 'Invitation accepted' });
    } catch (error) {
        next(error);
    }
});

// List device users
router.get('/users/:deviceId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId } = req.params;

        // Verify access
        const hasAccess = await prisma.userDevice.findFirst({
            where: {
                deviceId,
                userId: req.user!.userId,
            },
        });

        if (!hasAccess) {
            return res.status(403).json({ error: 'No access to this device' });
        }

        const users = await prisma.userDevice.findMany({
            where: { deviceId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
        });

        res.json(users);
    } catch (error) {
        next(error);
    }
});

// Update user role
router.put('/users/:deviceId/:userId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId, userId } = req.params;
        const { role } = req.body;

        // Verify owner/admin
        const hasPermission = await prisma.userDevice.findFirst({
            where: {
                deviceId,
                userId: req.user!.userId,
                role: { in: ['OWNER', 'ADMIN'] },
            },
        });

        if (!hasPermission) {
            return res.status(403).json({ error: 'No permission' });
        }

        // Cannot change owner role
        const targetUser = await prisma.userDevice.findFirst({
            where: { deviceId, userId },
        });

        if (targetUser?.role === 'OWNER') {
            return res.status(403).json({ error: 'Cannot change owner role' });
        }

        await prisma.userDevice.updateMany({
            where: { deviceId, userId },
            data: { role },
        });

        res.json({ message: 'Role updated' });
    } catch (error) {
        next(error);
    }
});

// Remove user from device
router.delete('/users/:deviceId/:userId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId, userId } = req.params;

        // Verify owner/admin
        const hasPermission = await prisma.userDevice.findFirst({
            where: {
                deviceId,
                userId: req.user!.userId,
                role: { in: ['OWNER', 'ADMIN'] },
            },
        });

        if (!hasPermission) {
            return res.status(403).json({ error: 'No permission' });
        }

        // Cannot remove owner
        const targetUser = await prisma.userDevice.findFirst({
            where: { deviceId, userId },
        });

        if (targetUser?.role === 'OWNER') {
            return res.status(403).json({ error: 'Cannot remove owner' });
        }

        await prisma.userDevice.deleteMany({
            where: { deviceId, userId },
        });

        res.json({ message: 'User removed' });
    } catch (error) {
        next(error);
    }
});

export { router as invitationRouter };
