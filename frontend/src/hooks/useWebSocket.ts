// =============================================================================
// GATEMATE Frontend - WebSocket Hook
// =============================================================================

import { useEffect, useCallback, useState } from 'react';
import { wsService } from '@/services/websocket';
import { useAuthStore } from '@/stores/authStore';
import { useGateStore } from '@/stores/gateStore';

export function useWebSocket() {
    const { isAuthenticated } = useAuthStore();
    const { updateGateStatus } = useGateStore();
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            const socket = wsService.connect();

            socket?.on('connect', () => setIsConnected(true));
            socket?.on('disconnect', () => setIsConnected(false));

            // Listen for gate status updates
            const unsubStatus = wsService.onGateStatus((data) => {
                updateGateStatus(data.deviceId, {
                    status: data.state,
                    percentage: data.percentage,
                    isOnline: data.online,
                });
            });

            // Listen for sensor data
            const unsubSensor = wsService.onSensorData((data) => {
                updateGateStatus(data.deviceId, {
                    sensors: {
                        current: data.current,
                        voltage: data.voltage,
                        temperature: data.temperature,
                        wifiSignal: data.wifiSignal,
                    },
                });
            });

            return () => {
                unsubStatus?.();
                unsubSensor?.();
                wsService.disconnect();
            };
        }
    }, [isAuthenticated, updateGateStatus]);

    return { isConnected };
}

export function useDeviceSubscription(deviceId: string) {
    useEffect(() => {
        if (deviceId) {
            wsService.subscribeToDevice(deviceId);
            return () => wsService.unsubscribeFromDevice(deviceId);
        }
    }, [deviceId]);
}

export function useGateCommands(deviceId: string) {
    const sendOpen = useCallback(() => {
        wsService.sendCommand(deviceId, 'open');
    }, [deviceId]);

    const sendClose = useCallback(() => {
        wsService.sendCommand(deviceId, 'close');
    }, [deviceId]);

    const sendStop = useCallback(() => {
        wsService.sendCommand(deviceId, 'stop');
    }, [deviceId]);

    const sendPartial = useCallback((percentage: number) => {
        wsService.sendCommand(deviceId, 'partial', percentage);
    }, [deviceId]);

    return { sendOpen, sendClose, sendStop, sendPartial };
}
