// =============================================================================
// GATEMATE Backend - Redis Cache Service
// =============================================================================

import { createClient, RedisClientType } from 'redis';
import { config } from '../config/env.js';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType | null> {
    if (!config.REDIS_URL) {
        console.warn('Redis URL not configured, caching disabled');
        return null;
    }

    try {
        redisClient = createClient({ url: config.REDIS_URL });

        redisClient.on('error', (err) => {
            console.error('Redis error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('✓ Redis connected');
        });

        await redisClient.connect();
        return redisClient;
    } catch (error) {
        console.warn('Redis connection failed, caching disabled');
        return null;
    }
}

export async function disconnectRedis(): Promise<void> {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
    }
}

// Cache helpers
export const cache = {
    async get<T>(key: string): Promise<T | null> {
        if (!redisClient) return null;
        try {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    },

    async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
        if (!redisClient) return;
        try {
            await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        } catch {
            // Ignore cache errors
        }
    },

    async del(key: string): Promise<void> {
        if (!redisClient) return;
        try {
            await redisClient.del(key);
        } catch {
            // Ignore cache errors
        }
    },

    async invalidatePattern(pattern: string): Promise<void> {
        if (!redisClient) return;
        try {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(keys);
            }
        } catch {
            // Ignore cache errors
        }
    },
};

// Device status cache
export const deviceCache = {
    async getStatus(deviceId: string) {
        return cache.get(`device:${deviceId}:status`);
    },

    async setStatus(deviceId: string, status: any) {
        await cache.set(`device:${deviceId}:status`, status, 60); // 1 minute TTL
    },

    async getSensors(deviceId: string) {
        return cache.get(`device:${deviceId}:sensors`);
    },

    async setSensors(deviceId: string, sensors: any) {
        await cache.set(`device:${deviceId}:sensors`, sensors, 30); // 30 seconds TTL
    },

    async invalidateDevice(deviceId: string) {
        await cache.invalidatePattern(`device:${deviceId}:*`);
    },
};

// Session cache
export const sessionCache = {
    async get(token: string) {
        return cache.get(`session:${token}`);
    },

    async set(token: string, session: any, ttlSeconds = 900) {
        await cache.set(`session:${token}`, session, ttlSeconds);
    },

    async del(token: string) {
        await cache.del(`session:${token}`);
    },
};
