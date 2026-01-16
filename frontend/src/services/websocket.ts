// =============================================================================
// GATEMATE Frontend - WebSocket Service
// =============================================================================

import { io, Socket } from 'socket.io-client';
import { config } from '@/config/api';
import { useAuthStore } from '@/stores/authStore';

class WebSocketService {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect() {
        const token = useAuthStore.getState().token;

        if (!token) {
            console.warn('WebSocket: No auth token available');
            return;
        }

        if (this.socket?.connected) {
            return;
        }

        this.socket = io(config.WS_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error.message);
            this.reconnectAttempts++;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    // Subscribe to device updates
    subscribeToDevice(deviceId: string) {
        this.socket?.emit('subscribe:device', deviceId);
    }

    // Unsubscribe from device updates
    unsubscribeFromDevice(deviceId: string) {
        this.socket?.emit('unsubscribe:device', deviceId);
    }

    // Send gate command
    sendCommand(deviceId: string, command: string, percentage?: number) {
        this.socket?.emit('gate:command', { deviceId, command, percentage });
    }

    // Listen to gate status updates
    onGateStatus(callback: (data: any) => void) {
        this.socket?.on('gate:status', callback);
        return () => this.socket?.off('gate:status', callback);
    }

    // Listen to sensor data updates
    onSensorData(callback: (data: any) => void) {
        this.socket?.on('sensor:data', callback);
        return () => this.socket?.off('sensor:data', callback);
    }

    // Listen to command confirmations
    onCommandSent(callback: (data: any) => void) {
        this.socket?.on('gate:command:sent', callback);
        return () => this.socket?.off('gate:command:sent', callback);
    }
}

export const wsService = new WebSocketService();
