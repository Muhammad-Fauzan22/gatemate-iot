// =============================================================================
// GATEMATE Backend - WebSocket Service
// =============================================================================

import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { TokenPayload } from '../../types/auth.types.js';

interface AuthenticatedSocket extends Socket {
    user?: TokenPayload;
}

export function setupWebSocket(io: SocketIOServer) {
    // Authentication middleware
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`WebSocket connected: ${socket.id} (user: ${socket.user?.email})`);

        // Join user-specific room
        if (socket.user) {
            socket.join(`user:${socket.user.userId}`);
        }

        // Subscribe to device updates
        socket.on('subscribe:device', (deviceId: string) => {
            console.log(`${socket.id} subscribed to device:${deviceId}`);
            socket.join(`device:${deviceId}`);
        });

        // Unsubscribe from device updates
        socket.on('unsubscribe:device', (deviceId: string) => {
            console.log(`${socket.id} unsubscribed from device:${deviceId}`);
            socket.leave(`device:${deviceId}`);
        });

        // Handle gate control commands (pass-through to devices)
        socket.on('gate:command', async (data: { deviceId: string; command: string; percentage?: number }) => {
            console.log(`Command from ${socket.user?.email}:`, data);

            // Note: In production, validate permissions and send via MQTT
            // For now, echo back to all subscribers
            io.to(`device:${data.deviceId}`).emit('gate:command:sent', {
                deviceId: data.deviceId,
                command: data.command,
                percentage: data.percentage,
                userId: socket.user?.userId,
                timestamp: new Date().toISOString(),
            });
        });

        // Handle ping for connection keep-alive
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });

        socket.on('disconnect', (reason) => {
            console.log(`WebSocket disconnected: ${socket.id} (${reason})`);
        });

        socket.on('error', (error) => {
            console.error(`WebSocket error: ${socket.id}`, error);
        });
    });

    console.log('✓ WebSocket server configured');
}

// Utility function to broadcast to specific device subscribers
export function broadcastToDevice(io: SocketIOServer, deviceId: string, event: string, data: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    io.to(`device:${deviceId}`).emit(event, data);
}

// Utility function to send notification to specific user
export function notifyUser(io: SocketIOServer, userId: string, event: string, data: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    io.to(`user:${userId}`).emit(event, data);
}
