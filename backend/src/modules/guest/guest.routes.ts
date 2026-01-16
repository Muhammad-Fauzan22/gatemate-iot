// =============================================================================
// GATEMATE Backend - Guest Access Service
// =============================================================================

import { Router } from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { AuthRequest } from '../../types/auth.types.js';
import type { Response, NextFunction } from 'express';

const router = Router();
const prisma = new PrismaClient();

// Store temporary guest passes in memory (use Redis in production)
const guestPasses = new Map<string, GuestPass>();

interface GuestPass {
    id: string;
    deviceId: string;
    createdBy: string;
    permissions: ('open' | 'close' | 'view')[];
    expiresAt: Date;
    maxUses: number;
    usedCount: number;
    name?: string;
}

// Create guest access pass
router.post('/create', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { deviceId, duration = 2, permissions = ['open'], maxUses = 1, name } = req.body;

        // Verify device ownership
        const device = await prisma.device.findFirst({
            where: {
                id: deviceId,
                users: { some: { userId: req.user!.userId } },
            },
        });

        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Generate unique pass code
        const passId = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);

        const guestPass: GuestPass = {
            id: passId,
            deviceId,
            createdBy: req.user!.userId,
            permissions,
            expiresAt,
            maxUses,
            usedCount: 0,
            name,
        };

        guestPasses.set(passId, guestPass);

        // Generate QR code data
        const qrData = {
            type: 'gatemate_guest',
            passId,
            expiresAt: expiresAt.toISOString(),
        };

        // Log access creation
        await prisma.accessLog.create({
            data: {
                deviceId,
                userId: req.user!.userId,
                action: 'guest_pass_created',
                details: { passId, duration, permissions, name },
            },
        });

        res.status(201).json({
            passId,
            qrData: JSON.stringify(qrData),
            qrUrl: `/api/v1/guest/use/${passId}`,
            expiresAt,
            permissions,
            maxUses,
        });
    } catch (error) {
        next(error);
    }
});

// Use guest pass (no auth required - accessed by guests)
router.get('/use/:passId', async (req, res, next) => {
    try {
        const { passId } = req.params;
        const guestPass = guestPasses.get(passId);

        if (!guestPass) {
            return res.status(404).json({ error: 'Pass not found or expired' });
        }

        if (new Date() > guestPass.expiresAt) {
            guestPasses.delete(passId);
            return res.status(410).json({ error: 'Pass expired' });
        }

        // Return guest control page
        res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>GATEMATE Guest Access</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #141e15 0%, #1c261d 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          .container {
            background: rgba(255,255,255,0.05);
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            width: 100%;
          }
          h1 { color: #4bbe4f; font-size: 28px; margin-bottom: 8px; }
          p { color: #9ca3af; margin-bottom: 24px; }
          .btn {
            display: block;
            width: 100%;
            padding: 20px;
            border: none;
            border-radius: 16px;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            margin-bottom: 16px;
            transition: transform 0.2s;
          }
          .btn:active { transform: scale(0.95); }
          .btn-open { background: #4bbe4f; color: #000; }
          .btn-close { background: rgba(255,255,255,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
          .status { color: #4bbe4f; margin-top: 20px; display: none; }
          .expires { color: #6b7280; font-size: 12px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚪 GATEMATE</h1>
          <p>${guestPass.name || 'Guest Access'}</p>
          ${guestPass.permissions.includes('open') ? '<button class="btn btn-open" onclick="sendCommand(\'open\')">🔓 OPEN GATE</button>' : ''}
          ${guestPass.permissions.includes('close') ? '<button class="btn btn-close" onclick="sendCommand(\'close\')">🔒 CLOSE GATE</button>' : ''}
          <div class="status" id="status">✓ Command sent!</div>
          <p class="expires">Expires: ${guestPass.expiresAt.toLocaleString()}</p>
        </div>
        <script>
          async function sendCommand(cmd) {
            try {
              const res = await fetch('/api/v1/guest/execute/${passId}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
              });
              if (res.ok) {
                document.getElementById('status').style.display = 'block';
                setTimeout(() => document.getElementById('status').style.display = 'none', 3000);
              } else {
                alert('Failed to execute command');
              }
            } catch(e) {
              alert('Error: ' + e.message);
            }
          }
        </script>
      </body>
      </html>
    `);
    } catch (error) {
        next(error);
    }
});

// Execute guest command
router.post('/execute/:passId', async (req, res, next) => {
    try {
        const { passId } = req.params;
        const { command } = req.body;
        const guestPass = guestPasses.get(passId);

        if (!guestPass) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        if (new Date() > guestPass.expiresAt) {
            guestPasses.delete(passId);
            return res.status(410).json({ error: 'Pass expired' });
        }

        if (guestPass.usedCount >= guestPass.maxUses) {
            return res.status(403).json({ error: 'Max uses exceeded' });
        }

        if (!guestPass.permissions.includes(command)) {
            return res.status(403).json({ error: 'Permission denied for this action' });
        }

        // Increment use count
        guestPass.usedCount++;

        // Log guest access
        await prisma.accessLog.create({
            data: {
                deviceId: guestPass.deviceId,
                action: 'guest_command',
                details: { passId, command, usedCount: guestPass.usedCount },
                ipAddress: req.ip,
            },
        });

        // TODO: Send command to device via MQTT
        console.log(`Guest command: ${command} for device ${guestPass.deviceId}`);

        res.json({ message: 'Command executed', command });
    } catch (error) {
        next(error);
    }
});

// List active guest passes
router.get('/list', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const passes = Array.from(guestPasses.values())
            .filter(p => p.createdBy === req.user!.userId && new Date() < p.expiresAt);

        res.json(passes);
    } catch (error) {
        next(error);
    }
});

// Revoke guest pass
router.delete('/:passId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { passId } = req.params;
        const guestPass = guestPasses.get(passId);

        if (!guestPass || guestPass.createdBy !== req.user!.userId) {
            return res.status(404).json({ error: 'Pass not found' });
        }

        guestPasses.delete(passId);
        res.json({ message: 'Pass revoked' });
    } catch (error) {
        next(error);
    }
});

export { router as guestRouter };
