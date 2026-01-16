// =============================================================================
// GATEMATE Backend - Environment Configuration
// =============================================================================

import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missing = requiredEnvVars.filter(key => !process.env[key]);

if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export const config = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),

    // Database
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/gatemate',

    // Redis
    REDIS_URL: process.env.REDIS_URL || '',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars!',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret-change-in-prod!',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    // MQTT
    MQTT_BROKER_URL: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    MQTT_USERNAME: process.env.MQTT_USERNAME || '',
    MQTT_PASSWORD: process.env.MQTT_PASSWORD || '',

    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    // Security
    BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

    // Feature Flags
    ENABLE_MQTT: process.env.ENABLE_MQTT !== 'false',
    ENABLE_WEBSOCKET: process.env.ENABLE_WEBSOCKET !== 'false',
    ENABLE_REDIS: process.env.ENABLE_REDIS !== 'false',
} as const;

// Type export
export type Config = typeof config;
