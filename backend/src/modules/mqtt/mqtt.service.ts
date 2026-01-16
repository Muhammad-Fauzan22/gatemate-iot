// =============================================================================
// GATEMATE Backend - MQTT Service
// =============================================================================

import mqtt from 'mqtt';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { config } from '../../config/env.js';

const prisma = new PrismaClient();

let mqttClient: mqtt.MqttClient | null = null;
let io: SocketIOServer | null = null;

export async function setupMQTT(socketIO: SocketIOServer) {
    io = socketIO;

    const options: mqtt.IClientOptions = {
        clientId: `gatemate-backend-${Date.now()}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
    };

    if (config.MQTT_USERNAME) {
        options.username = config.MQTT_USERNAME;
        options.password = config.MQTT_PASSWORD;
    }

    try {
        mqttClient = mqtt.connect(config.MQTT_BROKER_URL, options);

        mqttClient.on('connect', () => {
            console.log('✓ MQTT connected to broker');

            // Subscribe to all device topics
            mqttClient?.subscribe('gatemate/devices/+/status');
            mqttClient?.subscribe('gatemate/devices/+/sensors');
        });

        mqttClient.on('message', handleMQTTMessage);

        mqttClient.on('error', (error) => {
            console.error('MQTT error:', error.message);
        });

        mqttClient.on('close', () => {
            console.log('MQTT connection closed');
        });

    } catch (error) {
        console.warn('MQTT broker not available, running in standalone mode');
    }
}

async function handleMQTTMessage(topic: string, payload: Buffer) {
    try {
        const message = JSON.parse(payload.toString());
        const parts = topic.split('/');
        const deviceId = parts[2];
        const messageType = parts[3];

        console.log(`MQTT [${messageType}] from ${deviceId}:`, message);

        if (messageType === 'status') {
            await handleStatusUpdate(deviceId, message);
        } else if (messageType === 'sensors') {
            await handleSensorData(deviceId, message);
        }

    } catch (error) {
        console.error('Error processing MQTT message:', error);
    }
}

async function handleStatusUpdate(deviceId: string, status: any) {
    // Update device status in database
    await prisma.device.updateMany({
        where: { deviceId },
        data: {
            isOnline: status.online ?? true,
            lastSeenAt: new Date(),
        },
    });

    // Broadcast to connected WebSocket clients
    if (io) {
        io.to(`device:${deviceId}`).emit('gate:status', {
            deviceId,
            state: status.state,
            percentage: status.percentage,
            online: status.online,
            obstacle: status.obstacle,
            timestamp: new Date().toISOString(),
        });
    }
}

async function handleSensorData(deviceId: string, sensors: any) {
    // Store sensor data
    const device = await prisma.device.findFirst({
        where: { deviceId },
    });

    if (device) {
        await prisma.sensorData.create({
            data: {
                deviceId: device.id,
                current: sensors.current,
                voltage: sensors.voltage,
                temperature: sensors.temperature,
                wifiSignal: sensors.wifiSignal,
                percentage: sensors.percentage,
                gateState: sensors.state,
            },
        });

        // Broadcast to WebSocket clients
        if (io) {
            io.to(`device:${deviceId}`).emit('sensor:data', {
                deviceId,
                ...sensors,
                timestamp: new Date().toISOString(),
            });
        }
    }
}

export function publishCommand(deviceId: string, command: object) {
    if (!mqttClient?.connected) {
        console.warn('MQTT not connected, command not sent');
        return false;
    }

    const topic = `gatemate/devices/${deviceId}/commands`;
    mqttClient.publish(topic, JSON.stringify(command));
    return true;
}

export function getMQTTClient() {
    return mqttClient;
}
